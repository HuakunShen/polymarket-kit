package main

import (
	"fmt"
	"log"

	"github.com/HuakunShen/polymarket-kit/go-client/data"
)

func main() {
	fmt.Println("🚀 Polymarket Data API Go Client Example\n")

	// Initialize the Data SDK
	dataSDK := data.NewDataSDK(nil)

	// Example user wallet address
	userAddress := "0x9fc4da94a5175e9c1a0eaca45bb2d6f7a0d27bb2"

	// 1. Health Check
	fmt.Println("1. Checking API health...")
	health, err := dataSDK.GetHealth()
	if err != nil {
		log.Printf("❌ Health check failed: %v", err)
	} else {
		fmt.Printf("✅ API Status: %s\n", health.Data)
	}

	// 2. Get Current Positions
	fmt.Println("\n2. Fetching current positions...")
	limit := 5
	positions, err := dataSDK.GetCurrentPositions(&data.PositionsQuery{
		User:  &userAddress,
		Limit: &limit,
	})
	if err != nil {
		log.Printf("❌ Failed to fetch positions: %v", err)
	} else {
		fmt.Printf("✅ Found %d current positions:\n", len(positions))
		for i, pos := range positions {
			if i >= 3 { // Show first 3 positions
				break
			}
			fmt.Printf("  %d. %s\n", i+1, pos.Title)
			fmt.Printf("     Size: %.2f, PnL: %.2f (%.2f%%)\n", pos.Size, pos.CashPnl, pos.PercentPnl)
			fmt.Printf("     Current Price: %.4f\n", pos.CurPrice)
		}
	}

	// 3. Get User Activity
	fmt.Println("\n3. Fetching recent user activity...")
	activityLimit := 10
	activity, err := dataSDK.GetUserActivity(&data.UserActivityQuery{
		User:  &userAddress,
		Limit: &activityLimit,
	})
	if err != nil {
		log.Printf("❌ Failed to fetch activity: %v", err)
	} else {
		fmt.Printf("✅ Found %d activity entries:\n", len(activity))
		for i, act := range activity {
			if i >= 3 { // Show first 3 activities
				break
			}
			fmt.Printf("  %d. %s %.6f of %s\n", i+1, act.Type, act.Size, act.Outcome)
			if act.Price != nil {
				fmt.Printf("     Price: %.6f\n", *act.Price)
			}
		}
	}

	// 4. Get Trades
	fmt.Println("\n4. Fetching trades...")
	tradesLimit := 5
	trades, err := dataSDK.GetTrades(&data.TradesQuery{
		User:  &userAddress,
		Limit: &tradesLimit,
	})
	if err != nil {
		log.Printf("❌ Failed to fetch trades: %v", err)
	} else {
		fmt.Printf("✅ Found %d trades:\n", len(trades))
		for i, trade := range trades {
			if i >= 3 { // Show first 3 trades
				break
			}
			fmt.Printf("  %d. %s %.6f at %.6f\n", i+1, trade.Side, trade.Size, trade.Price)
		}
	}

	// 5. Get Portfolio Summary
	fmt.Println("\n5. Getting portfolio summary...")
	portfolio, err := dataSDK.GetPortfolioSummary(userAddress)
	if err != nil {
		log.Printf("❌ Failed to get portfolio summary: %v", err)
	} else {
		fmt.Println("✅ Portfolio Summary:")
		if len(portfolio.TotalValue) > 0 {
			fmt.Printf("  Total Value: %.2f\n", portfolio.TotalValue[0].Value)
		}
		fmt.Printf("  Markets Traded: %d\n", portfolio.MarketsTraded.Traded)
		fmt.Printf("  Current Positions: %d\n", len(portfolio.CurrentPositions))
	}

	// 6. Get Total Value
	fmt.Println("\n6. Getting total portfolio value...")
	totalValue, err := dataSDK.GetTotalValue(&data.TotalValueQuery{
		User: &userAddress,
	})
	if err != nil {
		log.Printf("❌ Failed to get total value: %v", err)
	} else {
		fmt.Printf("✅ Total Value:\n")
		for _, value := range totalValue {
			fmt.Printf("  User: %s, Value: %.2f\n", value.User, value.Value)
		}
	}

	// 7. Get Total Markets Traded
	fmt.Println("\n7. Getting total markets traded...")
	marketsTraded, err := dataSDK.GetTotalMarketsTraded(&data.TotalMarketsTradedQuery{
		User: &userAddress,
	})
	if err != nil {
		log.Printf("❌ Failed to get markets traded: %v", err)
	} else {
		fmt.Printf("✅ Markets Traded: %d\n", marketsTraded.Traded)
		fmt.Printf("  User: %s\n", marketsTraded.User)
	}

	// 8. Get All Positions (both current and closed)
	fmt.Println("\n8. Getting all positions...")
	allPositions, err := dataSDK.GetAllPositions(userAddress, &struct {
		Limit          *int
		Offset         *int
		SortBy         *string
		SortDirection  *string
	}{
		Limit: &limit,
	})
	if err != nil {
		log.Printf("❌ Failed to get all positions: %v", err)
	} else {
		fmt.Printf("✅ All Positions Summary:\n")
		fmt.Printf("  Current: %d positions\n", len(allPositions.Current))
		fmt.Printf("  Closed: %d positions\n", len(allPositions.Closed))
	}

	fmt.Println("\n✅ Data API example completed successfully!")
}