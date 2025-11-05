package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	privateKey := os.Getenv("POLYMARKET_KEY")
	if privateKey == "" {
		log.Fatal("POLYMARKET_KEY environment variable is required")
	}

	// Create CLOB client
	config := &client.ClientConfig{
		Host:          "https://clob.polymarket.com",
		ChainID:       types.ChainPolygon,
		PrivateKey:    privateKey,
		UseServerTime: true,
		Timeout:       30 * time.Second,
	}

	clobClient, err := client.NewClobClient(config)
	if err != nil {
		log.Fatalf("Failed to create CLOB client: %v", err)
	}

	fmt.Println("✅ CLOB client created successfully")

	// Create WebSocket client
	wsClient := client.NewWebSocketClient(clobClient, &client.WebSocketClientOptions{
		AssetIDs: []string{
			"60487116984468020978247225474488676749601001829886755968952521846780452448915",
		},
		AutoReconnect:        true,
		ReconnectDelay:       5 * time.Second,
		MaxReconnectAttempts: 10,
		Debug:                true,
	})

	// Register event handlers
	wsClient.On(&client.WebSocketCallbacks{
		OnConnect: func() {
			fmt.Println("✅ Connected to Polymarket WebSocket")
		},

		OnBook: func(msg *types.BookMessage) {
			fmt.Printf("📚 Book Update - Market: %s...\n", msg.Market[:10])
			fmt.Printf("   Bids: %d, Asks: %d\n", len(msg.Bids), len(msg.Asks))

			if len(msg.Bids) > 0 {
				bestBid := msg.Bids[len(msg.Bids)-1]
				fmt.Printf("   Best Bid: %s (%s)\n", bestBid.Price, bestBid.Size)
			}
			if len(msg.Asks) > 0 {
				bestAsk := msg.Asks[0]
				fmt.Printf("   Best Ask: %s (%s)\n", bestAsk.Price, bestAsk.Size)
			}
		},

		OnPriceChange: func(msg *types.PriceChangeMessage) {
			fmt.Printf("💹 Price Change - %d change(s)\n", len(msg.PriceChanges))
			for _, change := range msg.PriceChanges {
				fmt.Printf("   %s @ %s (size: %s)\n", change.Side, change.Price, change.Size)
			}
		},

		OnTickSizeChange: func(msg *types.TickSizeChangeMessage) {
			fmt.Printf("📏 Tick Size Changed: %s → %s\n", msg.OldTickSize, msg.NewTickSize)
		},

		OnLastTradePrice: func(msg *types.LastTradePriceMessage) {
			fmt.Printf("💰 Trade: %s @ %s (size: %s)\n", msg.Side, msg.Price, msg.Size)
		},

		OnError: func(err error) {
			fmt.Printf("❌ WebSocket Error: %v\n", err)
		},

		OnDisconnect: func(code int, reason string) {
			fmt.Printf("👋 Disconnected: %d - %s\n", code, reason)
		},

		OnReconnect: func(attempt int) {
			fmt.Printf("🔄 Reconnecting... (attempt %d)\n", attempt)
		},
	})

	// Connect to WebSocket
	if err := wsClient.Connect(); err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}

	fmt.Println("📡 Listening for market data... Press Ctrl+C to exit")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan

	fmt.Println("\n🛑 Shutting down...")
	wsClient.Disconnect()
	fmt.Println("✅ Disconnected gracefully")
}
