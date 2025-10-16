package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

const (
	host          = "https://clob.polymarket.com"
	wsURL         = "wss://ws-subscriptions-clob.polymarket.com"
	marketChannel = "market"
	userChannel   = "user"
	pingInterval  = 10 * time.Second
)

// AuthCredentials represents authentication credentials for WebSocket
type AuthCredentials struct {
	APIKey     string `json:"apiKey"`
	Secret     string `json:"secret"`
	Passphrase string `json:"passphrase"`
}

// MarketMessage represents a market channel message
type MarketMessage struct {
	AssetIDs []string `json:"assets_ids"`
	Type     string   `json:"type"`
}

// UserMessage represents a user channel message
type UserMessage struct {
	Markets []string        `json:"markets"`
	Type    string          `json:"type"`
	Auth    AuthCredentials `json:"auth"`
}

// WebSocketOrderBook handles WebSocket connections for market data
type WebSocketOrderBook struct {
	channelType string
	data        []string
	auth        *AuthCredentials
	conn        *websocket.Conn
	pingTicker  *time.Ticker
	done        chan struct{}
}

// NewWebSocketOrderBook creates a new WebSocket order book connection
func NewWebSocketOrderBook(channelType, url string, data []string, auth *AuthCredentials) (*WebSocketOrderBook, error) {
	fullURL := fmt.Sprintf("%s/ws/%s", url, channelType)

	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to WebSocket: %w", err)
	}

	ws := &WebSocketOrderBook{
		channelType: channelType,
		data:        data,
		auth:        auth,
		conn:        conn,
		pingTicker:  time.NewTicker(pingInterval),
		done:        make(chan struct{}),
	}

	// Set up ping handler
	conn.SetPongHandler(func(appData string) error {
		fmt.Println("Received pong")
		return nil
	})

	return ws, nil
}

// Run starts the WebSocket connection and message handling
func (ws *WebSocketOrderBook) Run() {
	fmt.Printf("WebSocket connected for %s channel\n", ws.channelType)

	// Send initial subscription message
	ws.sendSubscriptionMessage()

	// Start message handler
	go ws.handleMessages()

	// Start ping loop
	go ws.pingLoop()

	// Wait for done signal
	<-ws.done
}

// sendSubscriptionMessage sends the initial subscription message
func (ws *WebSocketOrderBook) sendSubscriptionMessage() {
	var message interface{}

	switch ws.channelType {
	case marketChannel:
		message = MarketMessage{
			AssetIDs: ws.data,
			Type:     marketChannel,
		}
	case userChannel:
		if ws.auth == nil {
			log.Fatal("Authentication credentials required for user channel")
		}
		message = UserMessage{
			Markets: ws.data,
			Type:    userChannel,
			Auth:    *ws.auth,
		}
	default:
		log.Fatalf("Invalid channel type: %s", ws.channelType)
	}

	jsonMessage, err := json.Marshal(message)
	if err != nil {
		log.Fatalf("Failed to marshal subscription message: %v", err)
	}

	err = ws.conn.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		log.Fatalf("Failed to send subscription message: %v", err)
	}
}

// handleMessages handles incoming WebSocket messages
func (ws *WebSocketOrderBook) handleMessages() {
	defer close(ws.done)

	for {
		select {
		case <-ws.done:
			return
		default:
			messageType, message, err := ws.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					log.Printf("WebSocket error: %v", err)
				} else {
					fmt.Printf("WebSocket closed: %v\n", err)
				}
				return
			}

			if messageType == websocket.TextMessage {
				// Handle PONG message
				if string(message) == "PONG" {
					fmt.Println("Received PONG")
					continue
				}

				// Try to parse as market channel message
				ws.handleMarketMessage(message)
			} else if messageType == websocket.PongMessage {
				fmt.Println("Received pong message")
			}
		}
	}
}

// handleMarketMessage parses and handles market channel messages
func (ws *WebSocketOrderBook) handleMarketMessage(data []byte) {
	// WebSocket may send an array of messages
	// Try to parse as array first
	var messages []json.RawMessage
	if err := json.Unmarshal(data, &messages); err == nil {
		// It's an array
		for i, msgData := range messages {
			ws.parseAndPrintMessage(msgData, i)
		}
	} else {
		// It's a single message
		ws.parseAndPrintMessage(data, -1)
	}
}

// parseAndPrintMessage parses a single message and prints it
func (ws *WebSocketOrderBook) parseAndPrintMessage(data []byte, index int) {
	msg, err := types.ParseMarketChannelMessage(data)
	if err != nil {
		log.Printf("Failed to parse message: %v", err)
		log.Printf("Raw message: %s", string(data))
		return
	}

	prefix := ""
	if index >= 0 {
		prefix = fmt.Sprintf("[%d] ", index)
	}

	switch msg.GetEventType() {
	case types.EventTypeBook:
		if bookMsg, ok := types.AsBookMessage(msg); ok {
			fmt.Printf("%s📚 Book Update - Market: %s, Asset: %s, Bids: %d, Asks: %d, Hash: %s\n",
				prefix, bookMsg.Market[:10]+"...", bookMsg.AssetID[:10]+"...",
				len(bookMsg.Bids), len(bookMsg.Asks), bookMsg.Hash[:10]+"...")
		}

	case types.EventTypePriceChange:
		if pcMsg, ok := types.AsPriceChangeMessage(msg); ok {
			fmt.Printf("%s💹 Price Change - Market: %s, Changes: %d\n",
				prefix, pcMsg.Market[:10]+"...", len(pcMsg.PriceChanges))
			for _, change := range pcMsg.PriceChanges {
				fmt.Printf("    %s @ %s (size: %s) - Best Bid: %s, Best Ask: %s\n",
					change.Side, change.Price, change.Size, change.BestBid, change.BestAsk)
			}
		}

	case types.EventTypeTickSizeChange:
		if tsMsg, ok := types.AsTickSizeChangeMessage(msg); ok {
			fmt.Printf("%s📏 Tick Size Change - Market: %s, %s -> %s\n",
				prefix, tsMsg.Market[:10]+"...", tsMsg.OldTickSize, tsMsg.NewTickSize)
		}

	case types.EventTypeLastTradePrice:
		if ltMsg, ok := types.AsLastTradePriceMessage(msg); ok {
			fmt.Printf("%s💰 Trade - Market: %s, %s @ %s (size: %s)\n",
				prefix, ltMsg.Market[:10]+"...", ltMsg.Side, ltMsg.Price, ltMsg.Size)
		}
	}
}

// pingLoop sends periodic ping messages
func (ws *WebSocketOrderBook) pingLoop() {
	for {
		select {
		case <-ws.done:
			return
		case <-ws.pingTicker.C:
			err := ws.conn.WriteMessage(websocket.TextMessage, []byte("PING"))
			if err != nil {
				log.Printf("Failed to send ping: %v", err)
				return
			}
			fmt.Println("Sent ping")
		}
	}
}

// Close closes the WebSocket connection
func (ws *WebSocketOrderBook) Close() {
	ws.pingTicker.Stop()
	close(ws.done)
	ws.conn.Close()
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// Get private key from environment
	privateKey := os.Getenv("POLYMARKET_KEY")
	if privateKey == "" {
		log.Fatal("POLYMARKET_KEY environment variable is required")
	}

	// Create client configuration
	config := &client.ClientConfig{
		Host:          host,
		ChainID:       types.ChainPolygon,
		PrivateKey:    privateKey,
		UseServerTime: true,
		Timeout:       30 * 0,
	}

	// Create CLOB client
	clobClient, err := client.NewClobClient(config)
	if err != nil {
		log.Fatalf("Failed to create CLOB client: %v", err)
	}

	fmt.Println("✅ CLOB client created successfully")

	// Create or derive API credentials (similar to TypeScript's createOrDeriveApiKey)
	fmt.Println("🔐 Creating API key...")
	var nonce uint64 = 0 // Use 0 as default nonce
	apiKey, err := clobClient.CreateApiKey(&nonce)
	if err != nil {
		log.Printf("Failed to create API key: %v", err)
		fmt.Println("Note: This might fail if you already have an API key. Trying to derive existing key...")

		// Try to derive the key instead
		apiKey, err = clobClient.DeriveApiKey(&nonce)
		if err != nil {
			log.Printf("Failed to derive API key: %v", err)
			log.Fatalf("Unable to create or derive API key. Please ensure your account is set up correctly.")
		}
	}

	fmt.Printf("Derived API Key: %s\n", apiKey.Key)

	// WebSocket configuration
	assetIds := []string{
		"60487116984468020978247225474488676749601001829886755968952521846780452448915",
		// You can add more asset IDs here
		// "109681959945973300464568698402968596289258214226684818748321941747028805721376",
	}

	// Create authentication credentials
	auth := &AuthCredentials{
		APIKey:     apiKey.Key,
		Secret:     apiKey.Secret,
		Passphrase: apiKey.Passphrase,
	}

	// Create and run market connection
	fmt.Println("\n📡 Connecting to market channel...")
	marketConnection, err := NewWebSocketOrderBook(marketChannel, wsURL, assetIds, auth)
	if err != nil {
		log.Fatalf("Failed to create market connection: %v", err)
	}

	// Run market connection in a goroutine
	go marketConnection.Run()

	// Uncomment to also run user connection
	// fmt.Println("\n👤 Connecting to user channel...")
	// var conditionIds []string // Add condition IDs if needed for user channel
	// userConnection, err := NewWebSocketOrderBook(userChannel, wsURL, conditionIds, auth)
	// if err != nil {
	// 	log.Fatalf("Failed to create user connection: %v", err)
	// }
	// go userConnection.Run()

	// Wait for interrupt signal to gracefully shutdown
	fmt.Println("WebSocket connections established. Press Ctrl+C to exit...")

	// Simple wait loop (in production, you'd handle signals properly)
	select {}
}
