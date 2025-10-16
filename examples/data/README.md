# Data API Examples

This directory contains examples for using the Polymarket Data API Go client.

## Files

### `data_demo.go`
Comprehensive example demonstrating all Data API features:
- API health check
- Current positions fetching
- User activity and trade history
- Portfolio analytics and summary
- Market analytics (open interest, live volume)
- Concurrent API calls for performance

### `data_simple_test.go`
Basic functionality test for the Data API client:
- Simple health check
- Position retrieval with error handling

## Running the Examples

```bash
# Run the comprehensive demo
go run data_demo.go

# Run the simple test
go run data_simple_test.go
```

## Features Demonstrated

- **Position Management**: Current and closed positions
- **Activity Tracking**: User trades and transaction history
- **Portfolio Analytics**: Total value, markets traded, PnL calculations
- **Market Analytics**: Top holders, open interest, live volume
- **Error Handling**: Comprehensive error checking and logging
- **Concurrent Requests**: Optimized parallel API calls

## Requirements

- Go 1.19 or later
- Internet connection (no API keys required for Data API)

## Output

The examples will display:
- Portfolio value and PnL information
- Recent trading activity
- Market positions and analytics
- Real-time API responses