package main

import (
	"fmt"
	"log"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
	// Create client configuration for public access (no authentication required)
	config := &client.ClientConfig{
		Host:          "https://clob.polymarket.com",
		ChainID:       types.ChainPolygon, // 137 for Polygon
		PrivateKey:    "",                 // Empty - public access only
		UseServerTime: true,
		Timeout:       30 * time.Second, // 30 seconds timeout
	}

	// Create CLOB client
	clobClient, err := client.NewClobClient(config)
	if err != nil {
		log.Fatalf("Failed to create CLOB client: %v", err)
	}

	fmt.Println("✅ CLOB client created successfully (public access)")

	// Test public endpoints
	fmt.Println("\n🔍 Testing public endpoints...")

	// Test server time
	serverTime, err := clobClient.GetServerTime()
	if err != nil {
		log.Printf("Failed to get server time: %v", err)
	} else {
		fmt.Printf("Server time: %d\n", serverTime)
	}

	// Test get OK
	ok, err := clobClient.GetOK()
	if err != nil {
		log.Printf("Failed to get OK status: %v", err)
	} else {
		fmt.Printf("API OK status: %v\n", ok)
	}

	// Get markets (use empty string for first page, not "0")
	markets, err := clobClient.GetMarkets("")
	if err != nil {
		log.Printf("Failed to get markets: %v", err)
	} else {
		fmt.Printf("Markets count: %d\n", markets.Count)
		if markets.NextCursor != "" && markets.NextCursor != "-1" {
			fmt.Printf("Next cursor: %s\n", markets.NextCursor)
		}
	}

	// Test price history (public endpoint, no auth required)
	fmt.Println("\n📊 Testing price history...")
	marketID := "57181707577674388642832601979687221301285295927772482724509880786283615182953"

	// Example 1: Using interval
	interval := types.PriceHistoryIntervalMax
	priceHistoryParams := types.PriceHistoryFilterParams{
		Market:   &marketID,
		Interval: &interval,
	}
	data1, err := clobClient.GetPricesHistory(priceHistoryParams)
	fmt.Println(data1)
	if err != nil {
		log.Printf("Failed to get price history with interval: %v", err)
	} else {
		fmt.Printf("Price history (with interval) retrieved successfully\n")
	}

	// Example 2: Using date range (similar to TypeScript example)
	// Parse dates to timestamps
	startDate, err := time.Parse("2006-01-02", "2025-11-20")
	if err != nil {
		log.Printf("Failed to parse start date: %v", err)
	} else {
		endDate, err := time.Parse("2006-01-02", "2025-11-23")
		if err != nil {
			log.Printf("Failed to parse end date: %v", err)
		} else {
			startTs := startDate.Unix()
			endTs := endDate.Unix()
			priceHistoryParams2 := types.PriceHistoryFilterParams{
				Market:  &marketID,
				StartTs: &startTs,
				EndTs:   &endTs,
			}
			data2, err := clobClient.GetPricesHistory(priceHistoryParams2)
			fmt.Println(data2)
			if err != nil {
				log.Printf("Failed to get price history with date range: %v", err)
			} else {
				fmt.Printf("Price history (with date range) retrieved successfully\n")
				fmt.Printf("  Date range: %s to %s\n", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
			}
		}
	}

	fmt.Println("\n✅ Example completed successfully!")
}
