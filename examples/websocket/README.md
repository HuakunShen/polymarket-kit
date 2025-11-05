# WebSocket Examples

This directory contains examples for using real-time WebSocket connections with Polymarket.

## Files

### `websocket_simple.go`
Basic WebSocket subscription example:
- Simple connection setup
- Market data subscription
- Real-time price updates
- Connection management

### `websocket_subscription.go`
Advanced WebSocket handling:
- Multiple subscription types
- Connection recovery and error handling
- Message parsing and filtering
- Performance monitoring

## Running the Examples

```bash
# Run simple WebSocket demo
go run websocket_simple.go

# Run advanced WebSocket subscription
go run websocket_subscription.go
```

## Features Demonstrated

- **Real-time Data**: Live market price updates
- **Subscription Management**: Subscribe/unsubscribe to market data
- **Connection Handling**: Robust connection management
- **Error Recovery**: Automatic reconnection logic
- **Message Processing**: Efficient data parsing and handling

## Requirements

- Go 1.19 or later
- Internet connection with WebSocket support
- Optional: API credentials for private data streams

## Output

The examples will display:
- Real-time price updates
- Market change notifications
- Connection status information
- Subscription confirmations

## Usage Notes

- WebSocket connections require stable internet
- Handle connection drops gracefully
- Monitor data flow for performance
- Consider rate limits for high-frequency updates