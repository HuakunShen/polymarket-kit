package main

import (
	"fmt"
	"log"

	"github.com/HuakunShen/polymarket-kit/go-client/data"
)

func main() {
	fmt.Println("🔍 Testing Polymarket Data API Go Client")

	// Initialize the Data SDK
	dataSDK := data.NewDataSDK(nil)

	// Test user wallet address
	userAddress := "0x9fc4da94a5175e9c1a0eaca45bb2d6f7a0d27bb2"

	// Test health check
	fmt.Println("\n📡 Testing health check...")
	health, err := dataSDK.GetHealth()
	if err != nil {
		log.Printf("❌ Health check failed: %v", err)
		return
	}
	fmt.Printf("✅ Health check passed: %s\n", health.Data)

	// Test getting a single position
	fmt.Println("\n📊 Testing position retrieval...")
	limit := 1
	positions, err := dataSDK.GetCurrentPositions(&data.PositionsQuery{
		User:  &userAddress,
		Limit: &limit,
	})
	if err != nil {
		log.Printf("❌ Failed to get positions: %v", err)
		return
	}

	if len(positions) == 0 {
		fmt.Println("ℹ️  No positions found for this user")
	} else {
		fmt.Printf("✅ Successfully retrieved position:\n")
		pos := positions[0]
		fmt.Printf("  Title: %s\n", pos.Title)
		fmt.Printf("  Size: %.2f\n", pos.Size)
		fmt.Printf("  Current Value: %.2f\n", pos.CurrentValue)
		fmt.Printf("  Cash PnL: %.2f\n", pos.CashPnl)
		fmt.Printf("  Percent PnL: %.2f%%\n", pos.PercentPnl)
		fmt.Printf("  Asset: %s\n", pos.Asset)
		fmt.Printf("  Condition ID: %s\n", pos.ConditionID)
	}

	fmt.Println("\n✅ Data API Go client test completed successfully!")
	fmt.Println("🎉 The Go Data API client is ready for use!")
}