// Example: Place a V2 FOK market BUY using a USDC budget (matches the
// polymarket.com web UI "spend $X" flow), then list open orders.
//
// Usage:
//
//	POLYMARKET_PRIVATE_KEY=0x... go run main.go <token_id> <price_cap> <usdc_amount>
//
// Example (spend up to $1.00, capped at 0.83):
//
//	POLYMARKET_PRIVATE_KEY=0x... go run main.go \
//	  71321045679252212594626385532706912750332728571942532289631379312455583992563 \
//	  0.83 1.00
//
// Notes:
//   - For BUY, Amount is the USDC budget. For SELL, Amount is the share count.
//   - Price acts as a worst-case cap (FAK) or exact-fill price (FOK). Pass the
//     current best ask for BUY (best bid for SELL).
//   - For Polymarket UI deposits set Funder + SignatureType:
//       Funder:        "0x...",
//       SignatureType: uint8(types.SignatureTypePolyProxy),
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
		log.Fatal("Usage: go run main.go <token_id> <price_cap> <usdc_amount>")
	}

	tokenID := os.Args[1]
	priceCap, err := strconv.ParseFloat(os.Args[2], 64)
	if err != nil {
		log.Fatalf("Invalid price: %v", err)
	}
	amount, err := strconv.ParseFloat(os.Args[3], 64)
	if err != nil {
		log.Fatalf("Invalid amount: %v", err)
	}

	privateKey := os.Getenv("POLYMARKET_PRIVATE_KEY")
	if privateKey == "" {
		log.Fatal("POLYMARKET_PRIVATE_KEY env var required")
	}

	client, err := pmclient.NewClobClient(&pmclient.ClientConfig{
		Host:       "https://clob.polymarket.com",
		ChainID:    types.ChainPolygon,
		PrivateKey: privateKey,
	})
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	fmt.Println("Deriving API credentials...")
	creds, err := client.DeriveApiKey(nil)
	if err != nil {
		creds, err = client.CreateApiKey(nil)
		if err != nil {
			log.Fatalf("Failed to derive/create API key: %v", err)
		}
	}
	client.SetApiCreds(creds)
	fmt.Printf("API key: %s...\n", creds.Key[:8])

	fmt.Printf("\nPlacing FOK market BUY: token=%s... priceCap=%.4f budget=$%.2f\n",
		tokenID[:min(20, len(tokenID))], priceCap, amount)

	signed, err := client.CreateSignedMarketOrder(order.MarketOrderOpts{
		TokenID:  tokenID,
		Side:     "BUY",
		Price:    priceCap,
		Amount:   amount, // USDC budget for BUY
		NegRisk:  true,
		TickSize: "0.01",
	})
	if err != nil {
		log.Fatalf("Failed to build market order: %v", err)
	}
	fmt.Printf("Pre-sign hash (venue order ID): %s\n", signed.OrderHash)

	resp, err := client.PostSignedOrder(signed, types.OrderTypeFOK)
	if err != nil {
		log.Fatalf("Post failed: %v", err)
	}
	fmt.Printf("Result: success=%v orderID=%s status=%s makingAmount=%s takingAmount=%s\n",
		resp.Success, resp.OrderID, resp.Status, resp.MakingAmount, resp.TakingAmount)
	if !resp.Success {
		fmt.Printf("Error: %s\n", resp.ErrorMsg)
		return
	}

	orders, err := client.GetOpenOrders(nil)
	if err != nil {
		fmt.Printf("Get orders failed: %v\n", err)
	} else {
		fmt.Printf("\nOpen orders: %d\n", len(orders))
	}
}
