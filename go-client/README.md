# Polymarket CLOB Go Client

A Go implementation of the Polymarket CLOB (Central Limit Order Book) client, providing functionality for interacting with the Polymarket trading API.

> **V2 protocol.** This client targets the **V2 CTF Exchange** typed data
> (domain version `"2"`, contracts `0xE111...996B` /
> `0xe2222d27...0F59`). The live CLOB rejects V1-shaped orders with
> `order_version_mismatch`. The official `rs-clob-client`,
> `ts-clob-client`, and `py-clob-client` SDKs are still V1; this Go
> client is aligned with `clob-client-v2` (the canonical V2 reference).
> See [`.journal/2026-05-07-go-client-v2-alignment.md`](../.journal/2026-05-07-go-client-v2-alignment.md)
> for the full migration notes.

## Features

- ✅ **Ethereum Wallet Integration**: Full support for private key management and signing operations
- ✅ **EIP-712 V2 Signing**: Polymarket CTF Exchange V2 typed data (timestamp / metadata / builder)
- ✅ **L1 + L2 Auth**: EIP-712 Level 1 + HMAC Level 2 (URL-safe base64 secrets)
- ✅ **Limit + Market Orders**: GTC / GTD / FOK / FAK with both share-input and USDC-budget builders
- ✅ **Write-Ahead Friendly**: order hash is computed before POST so callers can persist a pending row keyed on the venue ID
- ✅ **All Signature Types**: EOA, POLY_PROXY, POLY_GNOSIS_SAFE, POLY_1271
- ✅ **WebSocket User Channel**: typed events plus raw `json.RawMessage` so no fields are lost
- ✅ **Market Data**: order books, prices, trades, market info, paginated open-orders walk
- ✅ **API Key Management**: create, derive, manage L2 API keys
- ✅ **Type Safety**: comprehensive Go types for all API requests and responses

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
// Get open orders (paginated cursor walk happens internally)
orders, err := clobClient.GetOpenOrders(nil)

// Get a specific order
o, err := clobClient.GetOrder("order_id")

// Get trades with filters
tradeParams := &types.TradeParams{
    Market:  stringPtr("market_id"),
    AssetID: stringPtr("asset_id"),
}
trades, err := clobClient.GetTrades(tradeParams, false, "0")
```

### Placing V2 Orders

#### GTC limit order (input = shares)

```go
import (
    "github.com/HuakunShen/polymarket-kit/go-client/order"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
)

resp, err := clobClient.CreateAndPostOrder(order.LimitOrderOpts{
    TokenID:  "71321045679252212594626385532706912750332728571942532289631379312455583992563",
    Price:    0.50,
    Size:     5,        // 5 shares
    Side:     "BUY",
    NegRisk:  true,     // crypto UpDown markets
    TickSize: "0.01",
    // For Polymarket UI deposits (proxy wallets):
    //   Funder:        "0x...",
    //   SignatureType: uint8(types.SignatureTypePolyProxy),
}, types.OrderTypeGTC)
```

#### Market order — FOK BUY (input = USDC budget)

Mirrors the polymarket.com web UI: the BUY input is **dollars**, not
shares. `Price` is the worst-case cap (typically the current best ask).

```go
signed, err := clobClient.CreateSignedMarketOrder(order.MarketOrderOpts{
    TokenID:  tokenID,
    Side:     "BUY",
    Price:    bestAsk,     // worst-case cap
    Amount:   1.00,        // spend up to $1.00
    NegRisk:  true,
    TickSize: "0.01",
})
if err != nil { return err }
resp, err := clobClient.PostSignedOrder(signed, types.OrderTypeFOK)
```

#### Write-ahead (persist a pending row before POST)

`SignedOrderResult.OrderHash` is the venue order ID. It's computed
locally during signing, **before** any network call, so callers can
write a pending DB row keyed on the hash and survive crashes mid-POST.

```go
signed, err := clobClient.CreateSignedLimitOrder(opts)
if err != nil { return err }

// Persist {client_order_id, venue_order_id: signed.OrderHash, status: "submitting"}
db.InsertPending(clientOrderID, signed.OrderHash)

resp, err := clobClient.PostSignedOrder(signed, types.OrderTypeGTC)
db.UpdateStatus(clientOrderID, statusFor(resp, err))
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

- **V2 Authentication**: EIP-712 V2 signing + HMAC L2 (URL-safe base64 secrets)
- **Wallet Operations**: Wallet management and signing (EOA + proxy / Gnosis Safe / 1271)
- **Public Endpoints**: Server time, markets, order books, prices
- **API Key Management**: Create, derive, list, and delete L2 API keys
- **Order Builder**: GTC / GTD limit + FOK / FAK market (USDC-budget BUY)
- **Order Lifecycle**: Place, cancel, cancel-all, query, paginated open-orders walk
- **WebSocket User Channel**: Typed events with raw `json.RawMessage` passthrough
- **Market Data**: Trades, orders, market info
- **Tests**: V2 EIP-712 golden vector, HMAC URL-safe base64 vector, rounding parity

### 📋 Planned

- Batch order posting (`POST /orders`)
- `cancel-market-orders` endpoint
- Balance and allowance management
- Rewards endpoints
- Notification management
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