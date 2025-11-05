package client

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/gorilla/websocket"
)

const (
	wsURL        = "wss://ws-subscriptions-clob.polymarket.com"
	pingInterval = 10 * time.Second
)

// WebSocketClientOptions configures the WebSocket client
type WebSocketClientOptions struct {
	// Asset IDs to subscribe to
	AssetIDs []string

	// Market condition IDs to subscribe to (for user channel)
	Markets []string

	// Whether to auto-reconnect on disconnect
	AutoReconnect bool

	// Reconnection delay
	ReconnectDelay time.Duration

	// Maximum number of reconnection attempts (0 = infinite)
	MaxReconnectAttempts int

	// Enable debug logging
	Debug bool

	// Custom logger (if nil, uses default log.Logger)
	Logger *log.Logger
}

// MessageHandler is a callback function for handling messages
type MessageHandler func(msg types.MarketChannelMessage)

// BookMessageHandler handles book messages
type BookMessageHandler func(msg *types.BookMessage)

// PriceChangeMessageHandler handles price change messages
type PriceChangeMessageHandler func(msg *types.PriceChangeMessage)

// TickSizeChangeMessageHandler handles tick size change messages
type TickSizeChangeMessageHandler func(msg *types.TickSizeChangeMessage)

// LastTradePriceMessageHandler handles last trade price messages
type LastTradePriceMessageHandler func(msg *types.LastTradePriceMessage)

// WebSocketCallbacks holds callback functions for different events
type WebSocketCallbacks struct {
	OnBook           BookMessageHandler
	OnPriceChange    PriceChangeMessageHandler
	OnTickSizeChange TickSizeChangeMessageHandler
	OnLastTradePrice LastTradePriceMessageHandler
	OnMessage        MessageHandler
	OnError          func(error)
	OnConnect        func()
	OnDisconnect     func(code int, reason string)
	OnReconnect      func(attempt int)
}

// WebSocketClient manages WebSocket connections for market data
type WebSocketClient struct {
	clobClient *ClobClient
	options    *WebSocketClientOptions
	callbacks  *WebSocketCallbacks

	conn              *websocket.Conn
	pingTicker        *time.Ticker
	reconnectTimer    *time.Timer
	done              chan struct{}
	reconnectAttempts int
	isConnecting      bool
	shouldReconnect   bool
	mu                sync.RWMutex
	logger            *log.Logger
}

// NewWebSocketClient creates a new WebSocket client
func NewWebSocketClient(clobClient *ClobClient, options *WebSocketClientOptions) *WebSocketClient {
	if options == nil {
		options = &WebSocketClientOptions{}
	}

	// Set defaults
	if options.AutoReconnect && options.ReconnectDelay == 0 {
		options.ReconnectDelay = 5 * time.Second
	}

	logger := options.Logger
	if logger == nil {
		logger = log.Default()
	}

	return &WebSocketClient{
		clobClient:      clobClient,
		options:         options,
		callbacks:       &WebSocketCallbacks{},
		done:            make(chan struct{}),
		shouldReconnect: true,
		logger:          logger,
	}
}

// On registers event handlers
func (ws *WebSocketClient) On(callbacks *WebSocketCallbacks) *WebSocketClient {
	ws.callbacks = callbacks
	return ws
}

// Connect establishes the WebSocket connection
func (ws *WebSocketClient) Connect() error {
	ws.mu.Lock()
	if ws.isConnecting || (ws.conn != nil && ws.IsConnected()) {
		ws.mu.Unlock()
		ws.log("Already connected or connecting")
		return nil
	}
	ws.isConnecting = true
	ws.shouldReconnect = true
	ws.mu.Unlock()

	// Derive API credentials
	apiKey, err := ws.clobClient.DeriveApiKey(nil)
	if err != nil {
		ws.mu.Lock()
		ws.isConnecting = false
		ws.mu.Unlock()
		return fmt.Errorf("failed to derive API key: %w", err)
	}

	ws.log("API key derived:", apiKey.Key)

	// Create WebSocket connection
	fullURL := fmt.Sprintf("%s/ws/market", wsURL)
	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(fullURL, nil)
	if err != nil {
		ws.mu.Lock()
		ws.isConnecting = false
		ws.mu.Unlock()
		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}

	ws.mu.Lock()
	ws.conn = conn
	ws.isConnecting = false
	ws.reconnectAttempts = 0
	ws.mu.Unlock()

	ws.log("WebSocket connected")

	// Send subscription message
	if err := ws.sendSubscription(); err != nil {
		return fmt.Errorf("failed to send subscription: %w", err)
	}

	// Start handlers
	go ws.handleMessages()
	go ws.pingLoop()

	if ws.callbacks.OnConnect != nil {
		ws.callbacks.OnConnect()
	}

	return nil
}

// Disconnect closes the WebSocket connection
func (ws *WebSocketClient) Disconnect() {
	ws.mu.Lock()
	ws.shouldReconnect = false
	ws.mu.Unlock()

	ws.cleanup()

	ws.mu.Lock()
	if ws.conn != nil {
		ws.conn.Close()
		ws.conn = nil
	}
	ws.mu.Unlock()
}

// Subscribe adds asset IDs to the subscription
func (ws *WebSocketClient) Subscribe(assetIDs []string) error {
	ws.mu.Lock()
	ws.options.AssetIDs = append(ws.options.AssetIDs, assetIDs...)
	ws.mu.Unlock()

	if ws.IsConnected() {
		return ws.sendSubscription()
	}

	return nil
}

// Unsubscribe removes asset IDs from the subscription
func (ws *WebSocketClient) Unsubscribe(assetIDs []string) {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	// Filter out the asset IDs to unsubscribe
	filtered := make([]string, 0, len(ws.options.AssetIDs))
	for _, id := range ws.options.AssetIDs {
		shouldKeep := true
		for _, unsubID := range assetIDs {
			if id == unsubID {
				shouldKeep = false
				break
			}
		}
		if shouldKeep {
			filtered = append(filtered, id)
		}
	}
	ws.options.AssetIDs = filtered
}

// IsConnected returns whether the WebSocket is connected
func (ws *WebSocketClient) IsConnected() bool {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.conn != nil
}

// Wait blocks until the WebSocket is disconnected
func (ws *WebSocketClient) Wait() {
	<-ws.done
}

func (ws *WebSocketClient) sendSubscription() error {
	ws.mu.RLock()
	conn := ws.conn
	assetIDs := ws.options.AssetIDs
	ws.mu.RUnlock()

	if conn == nil {
		return fmt.Errorf("not connected")
	}

	message := map[string]interface{}{
		"assets_ids": assetIDs,
		"type":       "market",
	}

	ws.log("Sending subscription:", assetIDs)
	return conn.WriteJSON(message)
}

func (ws *WebSocketClient) handleMessages() {
	defer func() {
		ws.log("Message handler stopped")
		ws.handleDisconnect(websocket.CloseNormalClosure, "Connection closed")
	}()

	for {
		ws.mu.RLock()
		conn := ws.conn
		ws.mu.RUnlock()

		if conn == nil {
			return
		}

		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				ws.handleError(fmt.Errorf("WebSocket error: %w", err))
			}
			return
		}

		if messageType == websocket.TextMessage {
			// Handle PONG
			if string(message) == "PONG" {
				ws.log("Received PONG")
				continue
			}

			ws.processMessage(message)
		}
	}
}

func (ws *WebSocketClient) processMessage(data []byte) {
	// Try to parse as array first
	var messages []json.RawMessage
	if err := json.Unmarshal(data, &messages); err == nil {
		// It's an array
		for _, msgData := range messages {
			ws.parseAndDispatch(msgData)
		}
	} else {
		// It's a single message
		ws.parseAndDispatch(data)
	}
}

func (ws *WebSocketClient) parseAndDispatch(data []byte) {
	msg, err := types.ParseMarketChannelMessage(data)
	if err != nil {
		ws.handleError(fmt.Errorf("failed to parse message: %w", err))
		ws.log("Raw message:", string(data))
		return
	}

	// Call specific handlers based on message type
	switch msg.GetEventType() {
	case types.EventTypeBook:
		if bookMsg, ok := types.AsBookMessage(msg); ok && ws.callbacks.OnBook != nil {
			ws.callbacks.OnBook(bookMsg)
		}
	case types.EventTypePriceChange:
		if pcMsg, ok := types.AsPriceChangeMessage(msg); ok && ws.callbacks.OnPriceChange != nil {
			ws.callbacks.OnPriceChange(pcMsg)
		}
	case types.EventTypeTickSizeChange:
		if tsMsg, ok := types.AsTickSizeChangeMessage(msg); ok && ws.callbacks.OnTickSizeChange != nil {
			ws.callbacks.OnTickSizeChange(tsMsg)
		}
	case types.EventTypeLastTradePrice:
		if ltMsg, ok := types.AsLastTradePriceMessage(msg); ok && ws.callbacks.OnLastTradePrice != nil {
			ws.callbacks.OnLastTradePrice(ltMsg)
		}
	}

	// Call general message handler
	if ws.callbacks.OnMessage != nil {
		ws.callbacks.OnMessage(msg)
	}
}

func (ws *WebSocketClient) pingLoop() {
	ws.mu.Lock()
	ws.pingTicker = time.NewTicker(pingInterval)
	ticker := ws.pingTicker
	ws.mu.Unlock()

	defer ticker.Stop()

	for {
		select {
		case <-ws.done:
			return
		case <-ticker.C:
			ws.mu.RLock()
			conn := ws.conn
			ws.mu.RUnlock()

			if conn != nil {
				if err := conn.WriteMessage(websocket.TextMessage, []byte("PING")); err != nil {
					ws.handleError(fmt.Errorf("failed to send ping: %w", err))
					return
				}
				ws.log("Sent PING")
			}
		}
	}
}

func (ws *WebSocketClient) handleError(err error) {
	if ws.callbacks.OnError != nil {
		ws.callbacks.OnError(err)
	} else {
		ws.log("Error:", err)
	}
}

func (ws *WebSocketClient) handleDisconnect(code int, reason string) {
	ws.cleanup()

	if ws.callbacks.OnDisconnect != nil {
		ws.callbacks.OnDisconnect(code, reason)
	}

	ws.mu.RLock()
	shouldReconnect := ws.shouldReconnect
	autoReconnect := ws.options.AutoReconnect
	ws.mu.RUnlock()

	if shouldReconnect && autoReconnect {
		ws.scheduleReconnect()
	}
}

func (ws *WebSocketClient) scheduleReconnect() {
	ws.mu.Lock()
	if ws.options.MaxReconnectAttempts > 0 && ws.reconnectAttempts >= ws.options.MaxReconnectAttempts {
		ws.mu.Unlock()
		ws.log("Max reconnect attempts reached")
		return
	}

	ws.reconnectAttempts++
	attempt := ws.reconnectAttempts
	delay := ws.options.ReconnectDelay
	ws.mu.Unlock()

	ws.log(fmt.Sprintf("Scheduling reconnect attempt %d...", attempt))

	if ws.callbacks.OnReconnect != nil {
		ws.callbacks.OnReconnect(attempt)
	}

	ws.mu.Lock()
	ws.reconnectTimer = time.AfterFunc(delay, func() {
		ws.log(fmt.Sprintf("Attempting reconnect %d...", attempt))
		if err := ws.Connect(); err != nil {
			ws.log("Reconnect failed:", err)
		}
	})
	ws.mu.Unlock()
}

func (ws *WebSocketClient) cleanup() {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	if ws.pingTicker != nil {
		ws.pingTicker.Stop()
		ws.pingTicker = nil
	}

	if ws.reconnectTimer != nil {
		ws.reconnectTimer.Stop()
		ws.reconnectTimer = nil
	}
}

func (ws *WebSocketClient) log(args ...interface{}) {
	if ws.options.Debug {
		ws.logger.Println(append([]interface{}{"[PolymarketWebSocket]"}, args...)...)
	}
}
