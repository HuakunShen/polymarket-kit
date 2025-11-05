# Polymarket Data API Go Client

A fully typed Go client for the Polymarket Data API (`https://data-api.polymarket.com`). This client provides access to user data, positions, trades, activity, and market analytics.

## Features

- **Complete API Coverage**: All documented Data API endpoints
- **Type Safety**: Full Go type definitions with struct tags
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Proxy Support**: HTTP/HTTPS proxy configuration
- **Parallel Requests**: Optimized concurrent API calls for convenience methods
- **Query Builder**: Automatic URL and query parameter construction

## Installation

```bash
go get github.com/HuakunShen/polymarket-kit/go-client
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"

    "github.com/HuakunShen/polymarket-kit/go-client/data"
)

func main() {
    // Initialize the Data SDK
    dataSDK := data.NewDataSDK(nil)

    // Get current positions for a user
    positions, err := dataSDK.GetCurrentPositions(&data.PositionsQuery{
        User:  stringPtr("0x9fc4da94a5175e9c1a0eaca45bb2d6f7a0d27bb2"),
        Limit: intPtr(10),
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Found %d positions\n", len(positions))
    for _, pos := range positions {
        fmt.Printf("- %s: %.2f shares, PnL: %.2f\n", pos.Title, pos.Size, pos.CashPnl)
    }
}

func stringPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }
```

## API Methods

### Health Check
```go
health, err := dataSDK.GetHealth()
```

### Positions
```go
// Current positions
positions, err := dataSDK.GetCurrentPositions(&data.PositionsQuery{
    User: &user,
    Limit: &limit,
    SortBy: stringPtr("SIZE"),
    SortDirection: stringPtr("DESC"),
})

// Closed positions
closed, err := dataSDK.GetClosedPositions(&data.ClosedPositionsQuery{
    User: &user,
    Limit: &limit,
})

// All positions (concurrent)
all, err := dataSDK.GetAllPositions(user, &struct {
    Limit         *int
    Offset        *int
    SortBy        *string
    SortDirection *string
}{
    Limit: &limit,
})
```

### Trades
```go
trades, err := dataSDK.GetTrades(&data.TradesQuery{
    User:  &user,
    Side:  stringPtr("BUY"),
    Limit: &limit,
})
```

### User Activity
```go
activity, err := dataSDK.GetUserActivity(&data.UserActivityQuery{
    User:  &user,
    Type:  stringPtr("BUY"),
    Limit: &limit,
})
```

### Portfolio Analytics
```go
// Total value
value, err := dataSDK.GetTotalValue(&data.TotalValueQuery{
    User: &user,
})

// Markets traded count
traded, err := dataSDK.GetTotalMarketsTraded(&data.TotalMarketsTradedQuery{
    User: &user,
})

// Portfolio summary (concurrent)
portfolio, err := dataSDK.GetPortfolioSummary(user)
fmt.Printf("Total Value: %.2f\n", portfolio.TotalValue[0].Value)
fmt.Printf("Markets Traded: %d\n", portfolio.MarketsTraded.Traded)
```

### Market Analytics
```go
// Top holders
holders, err := dataSDK.GetTopHolders(&data.TopHoldersQuery{
    Market: []string{"0xabc...", "0xdef..."},
    Limit:  intPtr(20),
})

// Open interest
oi, err := dataSDK.GetOpenInterest(&data.OpenInterestQuery{
    Market: []string{"0xabc..."},
})

// Live volume
volume, err := dataSDK.GetLiveVolume(&data.LiveVolumeQuery{
    ID: 12345,
})
```

## Configuration

### Proxy Support
```go
config := &data.DataSDKConfig{
    Proxy: &data.ProxyConfig{
        Host:     "proxy.example.com",
        Port:     8080,
        Username: stringPtr("user"),
        Password: stringPtr("pass"),
        Protocol: stringPtr("http"),
    },
}

dataSDK := data.NewDataSDK(config)
```

## Data Types

### Position
```go
type Position struct {
    ProxyWallet      string  `json:"proxyWallet"`
    Asset            string  `json:"asset"`
    ConditionID      string  `json:"conditionId"`
    Size             float64 `json:"size"`
    AvgPrice         float64 `json:"avgPrice"`
    InitialValue     float64 `json:"initialValue"`
    CurrentValue     float64 `json:"currentValue"`
    CashPnl          float64 `json:"cashPnl"`
    PercentPnl       float64 `json:"percentPnl"`
    TotalBought      float64 `json:"totalBought"`
    RealizedPnl      float64 `json:"realizedPnl"`
    PercentRealizedPnl float64 `json:"percentRealizedPnl"`
    CurPrice         float64 `json:"curPrice"`
    Redeemable       bool    `json:"redeemable"`
    Mergeable        bool    `json:"mergeable"`
    Title            string  `json:"title"`
    Slug             string  `json:"slug"`
    Icon             string  `json:"icon"`
    EventID          string  `json:"eventId"`
    EventSlug        string  `json:"eventSlug"`
    Outcome          string  `json:"outcome"`
    OutcomeIndex     int     `json:"outcomeIndex"`
    OppositeOutcome  string  `json:"oppositeOutcome"`
    OppositeAsset    string  `json:"oppositeAsset"`
    EndDate          *string `json:"endDate,omitempty"`
    NegativeRisk     *bool   `json:"negativeRisk,omitempty"`
}
```

### Trade
```go
type DataTrade struct {
    ProxyWallet     string `json:"proxyWallet"`
    Side            string `json:"side"` // "BUY" or "SELL"
    ConditionID     string `json:"conditionId"`
    Outcome         string `json:"outcome"`
    Market          string `json:"market"`
    Size            string `json:"size"`
    Price           string `json:"price"`
    Fee             string `json:"fee"`
    Timestamp       string `json:"timestamp"`
    TransactionHash string `json:"transactionHash"`
    Maker           string `json:"maker"`
    Taker           string `json:"taker"`
    AssetID         string `json:"assetId"`
}
```

## Examples

See the `examples/` directory for complete working examples:

- `data_example.go` - Comprehensive usage example
- `data_simple_test.go` - Basic functionality test

## Running Examples

```bash
# Run the comprehensive example
go run examples/data_example.go

# Run the simple test
go run examples/data_simple_test.go
```

## Error Handling

All methods return both the result and an error. Always check for errors:

```go
positions, err := dataSDK.GetCurrentPositions(query)
if err != nil {
    log.Printf("Failed to get positions: %v", err)
    return
}
// Use positions safely
```

## Performance Tips

1. Use pointers for optional query parameters to avoid sending unnecessary data
2. Leverage the convenience methods like `GetPortfolioSummary()` and `GetAllPositions()` for concurrent API calls
3. Set appropriate limits for large datasets
4. Use the `Limit` parameter to paginate large result sets