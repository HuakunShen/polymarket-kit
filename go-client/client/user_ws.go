package client

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/gorilla/websocket"
)

const (
	wsUserURL           = "wss://ws-subscriptions-clob.polymarket.com/ws/user"
	userPingInterval    = 10 * time.Second
	userPongTimeout     = 30 * time.Second
	userReconnectBase   = 1 * time.Second
	userReconnectMax    = 30 * time.Second
)

// UserWSConfig configures the user channel WebSocket client.
type UserWSConfig struct {
	// URL overrides the default WebSocket URL (for testing).
	URL string
	// APICreds are L2 API credentials (required).
	APICreds *types.ApiKeyCreds
	// Markets is an optional list of condition IDs to filter events.
	Markets []string
	// OnOrder is called for order events (PLACEMENT, UPDATE, CANCELLATION).
	OnOrder func(*types.OrderEvent)
	// OnTrade is called for trade events (MATCHED, MINED, CONFIRMED, FAILED).
	OnTrade func(*types.TradeEvent)
	// OnError is called on non-fatal errors (parse failures, etc.).
	OnError func(error)
	// OnConnect is called when the connection is established.
	OnConnect func()
	// OnDisconnect is called when the connection is lost.
	OnDisconnect func()
	// Logger overrides the default logger.
	Logger *slog.Logger
}

// UserWSClient manages a WebSocket connection to the Polymarket user channel.
// It handles authentication, PING/PONG keepalive, and automatic reconnection.
type UserWSClient struct {
	cfg    UserWSConfig
	log    *slog.Logger
	conn   *websocket.Conn
	mu     sync.Mutex // protects conn writes
	cancel context.CancelFunc
	done   chan struct{}
}

// NewUserWSClient creates a new user channel WebSocket client.
func NewUserWSClient(cfg UserWSConfig) (*UserWSClient, error) {
	if cfg.APICreds == nil {
		return nil, fmt.Errorf("APICreds required for user channel")
	}
	if cfg.URL == "" {
		cfg.URL = wsUserURL
	}
	logger := cfg.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &UserWSClient{
		cfg:  cfg,
		log:  logger,
		done: make(chan struct{}),
	}, nil
}

// Start connects to the user channel and begins receiving events.
// Blocks until the context is canceled or Stop() is called.
func (c *UserWSClient) Start(ctx context.Context) error {
	ctx, c.cancel = context.WithCancel(ctx)
	defer close(c.done)

	delay := userReconnectBase
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		err := c.connectAndRun(ctx)
		if ctx.Err() != nil {
			return ctx.Err()
		}

		c.log.Warn("User WS disconnected, reconnecting...",
			"error", err, "delay", delay)
		if c.cfg.OnDisconnect != nil {
			c.cfg.OnDisconnect()
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
		delay = min(delay*2, userReconnectMax)
	}
}

// Stop gracefully closes the connection.
func (c *UserWSClient) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
	<-c.done
}

// SubscribeMarkets dynamically adds market condition IDs to the subscription.
func (c *UserWSClient) SubscribeMarkets(conditionIDs []string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn == nil {
		return fmt.Errorf("not connected")
	}
	msg := map[string]any{
		"operation": "subscribe",
		"markets":   conditionIDs,
	}
	return c.conn.WriteJSON(msg)
}

// UnsubscribeMarkets dynamically removes market condition IDs from the subscription.
func (c *UserWSClient) UnsubscribeMarkets(conditionIDs []string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn == nil {
		return fmt.Errorf("not connected")
	}
	msg := map[string]any{
		"operation": "unsubscribe",
		"markets":   conditionIDs,
	}
	return c.conn.WriteJSON(msg)
}

// connectAndRun establishes a connection, sends auth, and runs the read loop.
// Returns when the connection is lost or context is canceled.
func (c *UserWSClient) connectAndRun(ctx context.Context) error {
	conn, _, err := websocket.DefaultDialer.Dial(c.cfg.URL, nil)
	if err != nil {
		return fmt.Errorf("dial failed: %w", err)
	}
	defer func() {
		conn.Close()
		c.mu.Lock()
		c.conn = nil
		c.mu.Unlock()
	}()

	c.mu.Lock()
	c.conn = conn
	c.mu.Unlock()

	// 发送认证订阅消息
	if err := c.sendAuthSubscribe(conn); err != nil {
		return fmt.Errorf("auth subscribe failed: %w", err)
	}

	c.log.Info("User WS connected and authenticated")
	if c.cfg.OnConnect != nil {
		c.cfg.OnConnect()
	}

	// 启动 ping loop
	pingDone := make(chan struct{})
	go func() {
		defer close(pingDone)
		c.pingLoop(ctx, conn)
	}()

	// Read loop (blocking)
	err = c.readLoop(ctx, conn)

	// Wait for ping loop to finish
	<-pingDone
	return err
}

func (c *UserWSClient) sendAuthSubscribe(conn *websocket.Conn) error {
	msg := map[string]any{
		"auth": map[string]string{
			"apiKey":     c.cfg.APICreds.Key,
			"secret":     c.cfg.APICreds.Secret,
			"passphrase": c.cfg.APICreds.Passphrase,
		},
		"type": "user",
	}
	if len(c.cfg.Markets) > 0 {
		msg["markets"] = c.cfg.Markets
	}
	return conn.WriteJSON(msg)
}

func (c *UserWSClient) readLoop(ctx context.Context, conn *websocket.Conn) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		conn.SetReadDeadline(time.Now().Add(userPongTimeout))
		_, raw, err := conn.ReadMessage()
		if err != nil {
			return fmt.Errorf("read: %w", err)
		}

		msg := string(raw)

		// Handle PONG
		if msg == "PONG" {
			continue
		}

		// Parse JSON message
		var data json.RawMessage
		if err := json.Unmarshal(raw, &data); err != nil {
			c.log.Debug("Non-JSON message from user channel", "msg", msg[:min(len(msg), 200)])
			continue
		}

		parsed, err := types.ParseUserChannelMessage(raw)
		if err != nil {
			if c.cfg.OnError != nil {
				c.cfg.OnError(err)
			}
			c.log.Debug("Failed to parse user channel message", "error", err)
			continue
		}

		switch evt := parsed.(type) {
		case *types.OrderEvent:
			if c.cfg.OnOrder != nil {
				c.cfg.OnOrder(evt)
			}
		case *types.TradeEvent:
			if c.cfg.OnTrade != nil {
				c.cfg.OnTrade(evt)
			}
		}
	}
}

func (c *UserWSClient) pingLoop(ctx context.Context, conn *websocket.Conn) {
	ticker := time.NewTicker(userPingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.mu.Lock()
			if c.conn != conn {
				c.mu.Unlock()
				return // connection replaced
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
