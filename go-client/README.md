# Polymarket CLOB Go Client

A Go implementation of the Polymarket CLOB (Central Limit Order Book) client, providing functionality for interacting with the Polymarket trading API.

## Features

- ✅ **Ethereum Wallet Integration**: Full support for private key management and signing operations
- ✅ **EIP-712 Authentication**: Complete implementation of EIP-712 typed data signing for Level 1 authentication
- ✅ **HMAC Authentication**: Secure HMAC-based authentication for API operations (Level 2)
- ✅ **Order Management**: Create, post, cancel, and query orders
- ✅ **Market Data**: Access order books, prices, trades, and market information
- ✅ **API Key Management**: Create, derive, and manage API keys
- ✅ **Type Safety**: Comprehensive Go types for all API requests and responses

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

    "github.com/HuakunShen/polymarket-kit/go-client/client"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
    // Initialize client configuration
    config := &client.ClientConfig{
        Host:          "https://clob.polymarket.com",
        ChainID:       types.ChainPolygon, // 137 for Polygon
        PrivateKey:    "0x_your_private_key_here",
        UseServerTime: true,
    }

    // Create CLOB client
    clobClient, err := client.NewClobClient(config)
    if err != nil {
        log.Fatalf("Failed to create client: %v", err)
    }

    // Test API connectivity
    ok, err := clobClient.GetOK()
    if err != nil {
        log.Fatalf("API connectivity test failed: %v", err)
    }

    fmt.Printf("API Status: %v\n", ok)

    // Get markets
    markets, err := clobClient.GetMarkets("0")
    if err != nil {
        log.Printf("Failed to get markets: %v", err)
    } else {
        fmt.Printf("Found %d markets\n", markets.Count)
    }
}
```

## Authentication

### Level 1 Authentication (EIP-712)

Used for creating API keys. The client automatically handles EIP-712 signature generation:

```go
// Create API key
apiKey, err := clobClient.CreateApiKey(nil)
if err != nil {
    log.Printf("Failed to create API key: %v", err)
} else {
    fmt.Printf("API Key: %s\n", apiKey.Key)
    // Store apiKey.Key, apiKey.Secret, and apiKey.Passphrase securely
}
```

### Level 2 Authentication (HMAC)

Used for API operations. Configure your client with API credentials:

```go
config := &client.ClientConfig{
    Host:       "https://clob.polymarket.com",
    ChainID:    types.ChainPolygon,
    PrivateKey: "0x_your_private_key",
    APIKey: &types.ApiKeyCreds{
        Key:        "your_api_key",
        Secret:     "your_api_secret",
        Passphrase: "your_api_passphrase",
    },
}

clobClient, _ := client.NewClobClient)
```

## Key Operations

### Market Data

```go
// Get order book for a token
orderBook, err := clobClient.GetOrderBook("0x_token_id")

// Get tick size
tickSize, err := clobClient.GetTickSize("0x_token_id")

// Get trades
trades, err := clobClient.GetTrades(nil, true, "0") // Get first page only
```

### API Key Management

```go
// Create new API key
apiKey, err := clobClient.CreateApiKey(nil)

// Derive existing API key
apiKey, err := clobClient.DeriveApiKey(nil)

// Get all API keys
apiKeys, err := clobClient.GetApiKeys()

// Delete API key
result, err := clobClient.DeleteApiKey()
```

### Order Management

```go
// Get open orders
orders, err := clobClient.GetOpenOrders(nil, true, "0")

// Get specific order
order, err := clobClient.GetOrder("order_id")

// Get trades with filters
tradeParams := &types.TradeParams{
    Market:  stringPtr("market_id"),
    AssetID: stringPtr("asset_id"),
}
trades, err := clobClient.GetTrades(tradeParams, false, "0")
```

## Wallet Operations

The client includes comprehensive wallet functionality:

```go
import "github.com/HuakunShen/polymarket-kit/go-client/auth"

// Create wallet from private key
wallet, err := auth.NewWalletFromHex("0x_private_key")

// Sign messages
message := []byte("Hello, Polymarket!")
signature, err := wallet.SignMessage(message)

// Verify signatures
valid, err := auth.VerifyMessageSignature(message, signature, wallet.GetAddress())

// Create random wallet
wallet, err := auth.NewRandomWallet()
```

## Configuration Options

```go
type ClientConfig struct {
    Host          string                // API host URL
    ChainID       types.Chain          // Blockchain chain ID
    PrivateKey    string                // Private key for signing
    APIKey        *types.ApiKeyCreds    // API credentials (optional)
    BuilderConfig *auth.BuilderConfig  // Builder config (optional)
    GeoBlockToken string                // Geo-blocking token (optional)
    UseServerTime bool                 // Use server time for signatures
    Timeout       time.Duration         // HTTP request timeout
}
```

## Error Handling

The client provides detailed error messages for debugging:

```go
markets, err := clobClient.GetMarkets("0")
if err != nil {
    // Errors include detailed context
    log.Printf("Failed to get markets: %v", err)
    return
}
```

## Development Status

### ✅ Completed Features

- **Authentication**: Full EIP-712 and HMAC authentication support
- **Wallet Operations**: Complete wallet management and signing
- **Public Endpoints**: Server time, markets, order books, prices
- **API Key Management**: Create, derive, list, and delete API keys
- **Market Data**: Trades, orders, market information
- **HTTP Client**: Robust HTTP client with proper error handling

### 🚧 In Progress

- Order creation and posting
- Advanced order types (market orders, GTD orders)
- Builder authentication
- WebSocket streaming
- Comprehensive tests

### 📋 Planned

- Balance and allowance management
- Rewards endpoints
- Notification management
- Performance optimizations
- Rate limiting

## Dependencies

- `github.com/ethereum/go-ethereum` - Ethereum cryptography and utilities
- Standard library packages only - no external dependencies beyond geth

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Security Notice

- **Never commit private keys or API credentials to version control**
- **Use environment variables or secure configuration management**
- **Validate all inputs and handle errors appropriately**
- **Use HTTPS endpoints in production**

## Support

For issues and questions:
- Create an issue on GitHub
- Review the examples directory
- Check the Polymarket API documentation