// Example: Connect to Polymarket user channel WebSocket.
//
// Usage:
//
//	POLYMARKET_API_KEY=... POLYMARKET_API_SECRET=... POLYMARKET_API_PASSPHRASE=... go run main.go
//
// Prints order and trade events for your account in real-time.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"

	"github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
	apiKey := os.Getenv("POLYMARKET_API_KEY")
	apiSecret := os.Getenv("POLYMARKET_API_SECRET")
	passphrase := os.Getenv("POLYMARKET_API_PASSPHRASE")

	if apiKey == "" || apiSecret == "" || passphrase == "" {
		log.Fatal("POLYMARKET_API_KEY, POLYMARKET_API_SECRET, POLYMARKET_API_PASSPHRASE required")
	}

	creds := &types.ApiKeyCreds{
		Key:        apiKey,
		Secret:     apiSecret,
		Passphrase: passphrase,
	}

	ws, err := client.NewUserWSClient(client.UserWSConfig{
		APICreds: creds,
		OnOrder: func(evt *types.OrderEvent) {
			fmt.Printf("[ORDER] %s id=%s side=%s price=%s size=%s matched=%s status=%s\n",
				evt.Type, evt.ID[:min(16, len(evt.ID))], evt.Side, evt.Price, evt.OriginalSize, evt.SizeMatched, evt.Status)
		},
		OnTrade: func(evt *types.TradeEvent) {
			fmt.Printf("[TRADE] %s id=%s side=%s price=%s size=%s role=%s\n",
				evt.Status, evt.ID[:min(16, len(evt.ID))], evt.Side, evt.Price, evt.Size, evt.TraderSide)
		},
		OnConnect: func() {
			fmt.Println("✓ Connected to user channel")
		},
		OnDisconnect: func() {
			fmt.Println("✗ Disconnected")
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	fmt.Println("Listening for order/trade events. Ctrl+C to stop.")
	if err := ws.Start(ctx); err != nil && ctx.Err() == nil {
		log.Fatal(err)
	}
	fmt.Println("Done.")
}
