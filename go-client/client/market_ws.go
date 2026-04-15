package client

import (
	"context"
	"fmt"
	"log/slog"
	"slices"
	"sync"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/gorilla/websocket"
)

const (
	wsMarketDynamicURL  = "wss://ws-subscriptions-clob.polymarket.com/ws/market"
	marketPingInterval  = 10 * time.Second
	marketPongTimeout   = 30 * time.Second
	marketReconnectBase = 1 * time.Second
	marketReconnectMax  = 30 * time.Second
)

// MarketWSConfig configures the public market channel WebSocket client.
type MarketWSConfig struct {
	URL string

	// InitialAssets are subscribed on first connect; later reconnects restore the
	// current tracked asset set automatically.
	InitialAssets []string

	// CustomFeature enables best_bid_ask, new_market, and market_resolved events.
	CustomFeature bool

	OnBook           func(*types.BookMessage)
	OnPriceChange    func(*types.PriceChangeMessage)
	OnTickSizeChange func(*types.TickSizeChangeMessage)
	OnLastTradePrice func(*types.LastTradePriceMessage)
	OnBestBidAsk     func(*types.BestBidAskMessage)
	OnNewMarket      func(*types.NewMarketMessage)
	OnMarketResolved func(*types.MarketResolvedMessage)
	OnMessage        func(types.MarketChannelMessage)
	OnError          func(error)
	OnConnect        func()
	OnDisconnect     func()
	Logger           *slog.Logger
}

// MarketWSClient manages a single market-channel websocket connection with
// incremental subscribe/unsubscribe semantics and reconnect-time resubscription.
type MarketWSClient struct {
	cfg    MarketWSConfig
	log    *slog.Logger
	conn   *websocket.Conn
	cancel context.CancelFunc
	done   chan struct{}

	mu       sync.Mutex // protects conn writes and tracked assets
	assetRef map[string]int
}

// NewMarketWSClient creates a reusable market websocket client.
func NewMarketWSClient(cfg MarketWSConfig) *MarketWSClient {
	if cfg.URL == "" {
		cfg.URL = wsMarketDynamicURL
	}
	logger := cfg.Logger
	if logger == nil {
		logger = slog.Default()
	}

	assetRef := make(map[string]int, len(cfg.InitialAssets))
	for _, id := range cfg.InitialAssets {
		if id == "" {
			continue
		}
		assetRef[id]++
	}

	return &MarketWSClient{
		cfg:      cfg,
		log:      logger,
		done:     make(chan struct{}),
		assetRef: assetRef,
	}
}

// Start connects to the market channel and blocks until the context is canceled
// or Stop is called.
func (c *MarketWSClient) Start(ctx context.Context) error {
	ctx, c.cancel = context.WithCancel(ctx)
	defer close(c.done)

	delay := marketReconnectBase
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		connStart := time.Now()
		err := c.connectAndRun(ctx)
		if ctx.Err() != nil {
			return ctx.Err()
		}

		if time.Since(connStart) > marketPongTimeout {
			delay = marketReconnectBase
		}

		c.log.Warn("Market WS disconnected, reconnecting...",
			"error", err, "delay", delay)
		if c.cfg.OnDisconnect != nil {
			c.cfg.OnDisconnect()
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
		delay = min(delay*2, marketReconnectMax)
	}
}

// Stop gracefully closes the connection.
func (c *MarketWSClient) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
	<-c.done
}

// SubscribeAssets increments reference counts and sends a dynamic subscribe
// only for assets that are newly introduced to the connection.
func (c *MarketWSClient) SubscribeAssets(assetIDs []string) error {
	added := c.trackSubscribe(assetIDs)
	if len(added) == 0 {
		return nil
	}
	return c.writeDynamic(added, "subscribe")
}

// UnsubscribeAssets decrements reference counts and sends a dynamic unsubscribe
// only for assets whose refcount reaches zero.
func (c *MarketWSClient) UnsubscribeAssets(assetIDs []string) error {
	removed := c.trackUnsubscribe(assetIDs)
	if len(removed) == 0 {
		return nil
	}
	return c.writeDynamic(removed, "unsubscribe")
}

// AssetIDs returns the currently tracked assets.
func (c *MarketWSClient) AssetIDs() []string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.snapshotAssetIDsLocked()
}

func (c *MarketWSClient) trackSubscribe(assetIDs []string) []string {
	c.mu.Lock()
	defer c.mu.Unlock()

	added := make([]string, 0, len(assetIDs))
	for _, id := range assetIDs {
		if id == "" {
			continue
		}
		if c.assetRef[id] == 0 {
			added = append(added, id)
		}
		c.assetRef[id]++
	}
	return added
}

func (c *MarketWSClient) trackUnsubscribe(assetIDs []string) []string {
	c.mu.Lock()
	defer c.mu.Unlock()

	removed := make([]string, 0, len(assetIDs))
	for _, id := range assetIDs {
		if id == "" {
			continue
		}
		ref := c.assetRef[id]
		if ref <= 1 {
			if ref == 1 {
				removed = append(removed, id)
			}
			delete(c.assetRef, id)
			continue
		}
		c.assetRef[id] = ref - 1
	}
	return removed
}

func (c *MarketWSClient) connectAndRun(ctx context.Context) error {
	if err := c.waitForAssets(ctx); err != nil {
		return err
	}

	conn, _, err := websocket.DefaultDialer.Dial(c.cfg.URL, nil)
	if err != nil {
		return fmt.Errorf("dial failed: %w", err)
	}
	defer func() {
		conn.Close()
		c.mu.Lock()
		if c.conn == conn {
			c.conn = nil
		}
		c.mu.Unlock()
	}()

	c.mu.Lock()
	c.conn = conn
	c.mu.Unlock()

	if err := c.sendFullSubscription(conn); err != nil {
		return fmt.Errorf("subscribe failed: %w", err)
	}

	c.log.Info("Market WS connected")
	if c.cfg.OnConnect != nil {
		c.cfg.OnConnect()
	}

	pingDone := make(chan struct{})
	go func() {
		defer close(pingDone)
		c.pingLoop(ctx, conn)
	}()

	ctxDone := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			conn.Close()
		case <-ctxDone:
		}
	}()

	err = c.readLoop(ctx, conn)
	close(ctxDone)
	<-pingDone
	return err
}

func (c *MarketWSClient) sendFullSubscription(conn *websocket.Conn) error {
	c.mu.Lock()
	assetIDs := c.snapshotAssetIDsLocked()
	c.mu.Unlock()

	msg := map[string]any{
		"type":                   "market",
		"assets_ids":             assetIDs,
		"custom_feature_enabled": c.cfg.CustomFeature,
	}
	return conn.WriteJSON(msg)
}

func (c *MarketWSClient) writeDynamic(assetIDs []string, operation string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn == nil {
		// Desired subscription state is already tracked locally. The next
		// successful connect will restore the full set via sendFullSubscription.
		return nil
	}

	msg := map[string]any{
		"assets_ids": assetIDs,
		"operation":  operation,
	}
	if operation == "subscribe" {
		msg["custom_feature_enabled"] = c.cfg.CustomFeature
	}
	return c.conn.WriteJSON(msg)
}

func (c *MarketWSClient) readLoop(ctx context.Context, conn *websocket.Conn) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		conn.SetReadDeadline(time.Now().Add(marketPongTimeout))
		_, raw, err := conn.ReadMessage()
		if err != nil {
			return fmt.Errorf("read: %w", err)
		}

		if string(raw) == "PONG" {
			continue
		}

		if parts := SplitArrayMessage(raw); parts != nil {
			for _, part := range parts {
				c.dispatch(part)
			}
			continue
		}
		c.dispatch(raw)
	}
}

func (c *MarketWSClient) dispatch(raw []byte) {
	msg, err := types.ParseMarketChannelMessage(raw)
	if err != nil {
		c.emitError(err)
		return
	}
	if c.cfg.OnMessage != nil {
		c.cfg.OnMessage(msg)
	}

	switch evt := msg.(type) {
	case *types.BookMessage:
		if c.cfg.OnBook != nil {
			c.cfg.OnBook(evt)
		}
	case *types.PriceChangeMessage:
		if c.cfg.OnPriceChange != nil {
			c.cfg.OnPriceChange(evt)
		}
	case *types.TickSizeChangeMessage:
		if c.cfg.OnTickSizeChange != nil {
			c.cfg.OnTickSizeChange(evt)
		}
	case *types.LastTradePriceMessage:
		if c.cfg.OnLastTradePrice != nil {
			c.cfg.OnLastTradePrice(evt)
		}
	case *types.BestBidAskMessage:
		if c.cfg.OnBestBidAsk != nil {
			c.cfg.OnBestBidAsk(evt)
		}
	case *types.NewMarketMessage:
		if c.cfg.OnNewMarket != nil {
			c.cfg.OnNewMarket(evt)
		}
	case *types.MarketResolvedMessage:
		if c.cfg.OnMarketResolved != nil {
			c.cfg.OnMarketResolved(evt)
		}
	}
}

func (c *MarketWSClient) pingLoop(ctx context.Context, conn *websocket.Conn) {
	ticker := time.NewTicker(marketPingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.mu.Lock()
			if c.conn != conn {
				c.mu.Unlock()
				return
			}
			err := conn.WriteMessage(websocket.TextMessage, []byte("PING"))
			c.mu.Unlock()
			if err != nil {
				c.log.Debug("Ping write failed", "error", err)
				return
			}
		}
	}
}

func (c *MarketWSClient) snapshotAssetIDsLocked() []string {
	assetIDs := make([]string, 0, len(c.assetRef))
	for id := range c.assetRef {
		assetIDs = append(assetIDs, id)
	}
	slices.Sort(assetIDs)
	return assetIDs
}

func (c *MarketWSClient) emitError(err error) {
	if c.cfg.OnError != nil {
		c.cfg.OnError(err)
	}
	c.log.Debug("Market WS error", "error", err)
}

func (c *MarketWSClient) waitForAssets(ctx context.Context) error {
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		c.mu.Lock()
		hasAssets := len(c.assetRef) > 0
		c.mu.Unlock()
		if hasAssets {
			return nil
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}
