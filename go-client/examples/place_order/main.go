// Example: Place and cancel a GTC limit order on Polymarket.
//
// Usage:
//
//	POLYMARKET_PRIVATE_KEY=0x... go run main.go <token_id> <price> <size>
//
// Example:
//
//	POLYMARKET_PRIVATE_KEY=0x... go run main.go \
//	  71321045679252212594626385532706912750332728571942532289631379312455583992563 \
//	  0.01 10.0
package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	pmclient "github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/order"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
	if len(os.Args) < 4 {
		log.Fatal("Usage: go run main.go <token_id> <price> <size>")
	}

	tokenID := os.Args[1]
	price, err := strconv.ParseFloat(os.Args[2], 64)
	if err != nil {
		log.Fatalf("Invalid price: %v", err)
	}
	size, err := strconv.ParseFloat(os.Args[3], 64)
	if err != nil {
		log.Fatalf("Invalid size: %v", err)
	}

	privateKey := os.Getenv("POLYMARKET_PRIVATE_KEY")
	if privateKey == "" {
		log.Fatal("POLYMARKET_PRIVATE_KEY env var required")
	}

	// 创建 CLOB client
	client, err := pmclient.NewClobClient(&pmclient.ClientConfig{
		Host:       "https://clob.polymarket.com",
		ChainID:    137,
		PrivateKey: privateKey,
	})
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// 1. Derive API credentials
	fmt.Println("Deriving API credentials...")
	creds, err := client.DeriveApiKey(nil)
	if err != nil {
		// Try create if derive fails
		creds, err = client.CreateApiKey(nil)
		if err != nil {
			log.Fatalf("Failed to derive/create API key: %v", err)
		}
	}
	client.SetApiCreds(creds)
	fmt.Printf("API key: %s...\n", creds.Key[:8])

	// 2. Place GTC limit order
	fmt.Printf("\nPlacing GTC limit BUY: token=%s... price=%.4f size=%.1f\n",
		tokenID[:min(20, len(tokenID))], price, size)

	resp, err := client.CreateAndPostOrder(order.LimitOrderOpts{
		TokenID: tokenID,
		Price:   price,
		Size:    size,
		Side:    "BUY",
		NegRisk: true,
	}, types.OrderTypeGTC)
	if err != nil {
		log.Fatalf("Failed to place order: %v", err)
	}
	fmt.Printf("Result: success=%v orderID=%s status=%s\n",
		resp.Success, resp.OrderID, resp.Status)

	if !resp.Success {
		fmt.Printf("Error: %s\n", resp.ErrorMsg)
		return
	}

	// 3. Query order status
	fmt.Println("\nQuerying order status...")
	orderInfo, err := client.GetOrder(resp.OrderID)
	if err != nil {
		fmt.Printf("Query failed: %v\n", err)
	} else {
		fmt.Printf("Status: %s matched: %s\n", orderInfo.Status, orderInfo.SizeMatched)
	}

	// 4. Cancel the order
	fmt.Printf("\nCancelling order %s...\n", resp.OrderID[:min(16, len(resp.OrderID))])
	if err := client.CancelOrder(resp.OrderID); err != nil {
		fmt.Printf("Cancel failed: %v\n", err)
	} else {
		fmt.Println("Cancelled successfully")
	}

	// 5. List open orders
	orders, err := client.GetOpenOrders(nil)
	if err != nil {
		fmt.Printf("Get orders failed: %v\n", err)
	} else {
		fmt.Printf("\nOpen orders: %d\n", len(orders))
	}
}
