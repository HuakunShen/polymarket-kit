# WebSocket Subscription Example

This example demonstrates how to connect to Polymarket's WebSocket API to subscribe to real-time market data, similar to the TypeScript `dev.ts` example.

## Features

- **Market Channel Subscription**: Subscribe to real-time order book updates for specific assets
- **User Channel Support**: (Optional) Subscribe to user-specific updates with authentication
- **Automatic Ping/Pong**: Handles WebSocket keep-alive automatically
- **Error Handling**: Robust error handling and connection management
- **Type Safety**: Full Go type safety with structured messages

## Setup

1. **Set Environment Variable**:
   ```bash
   export POLYMARKET_KEY="your_private_key_here"
   ```

2. **Install Dependencies**:
   ```bash
   go get github.com/gorilla/websocket
   ```

3. **Run the Example**:
   ```bash
   go run examples/websocket_subscription.go
   ```

## Configuration

### Asset IDs
The example subscribes to a specific asset ID:
```go
assetIds := []string{
    "60487116984468020978247225474488676749601001829886755968952521846780452448915",
    // Add more asset IDs here
}
```

### Channels

#### Market Channel (`market`)
- Subscribes to order book updates for specified asset IDs
- No authentication required
- Message format: `{"assets_ids": ["..."], "type": "market"}`

#### User Channel (`user`) - Optional
- Subscribes to user-specific updates
- Requires authentication credentials
- Message format: `{"markets": ["..."], "type": "user", "auth": {...}}`

To enable user channel, uncomment the relevant code in `main()`.

## Code Structure

### WebSocketOrderBook
Main struct handling WebSocket connections with:
- Connection management
- Message handling
- Automatic ping/pong
- Graceful shutdown

### Authentication
The example derives API credentials using the existing CLOB client:
```go
apiKey, err := clobClient.DeriveApiKey(&nonce)
```

### Message Types
- **MarketMessage**: For market channel subscriptions
- **UserMessage**: For user channel subscriptions with auth

## Usage Examples

### Basic Market Subscription
```go
marketConnection, err := NewWebSocketOrderBook(marketChannel, wsURL, assetIds, auth)
if err != nil {
    log.Fatal(err)
}
go marketConnection.Run()
```

### Add User Channel (Optional)
```go
userConnection, err := NewWebSocketOrderBook(userChannel, wsURL, conditionIds, auth)
if err != nil {
    log.Fatal(err)
}
go userConnection.Run()
```

## Notes

- The WebSocket connection requires a valid private key with API key generation capabilities
- Asset IDs should be the token IDs you want to monitor
- The connection will automatically handle ping/pong messages every 10 seconds
- Press Ctrl+C to exit the program gracefully

## Differences from TypeScript Version

- Uses `github.com/gorilla/websocket` instead of Node.js `ws`
- Structured message types for compile-time safety
- Explicit error handling with Go idioms
- Context-based connection management