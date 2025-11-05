# Polymarket Go SDK Examples

This directory contains organized examples demonstrating the use of the Polymarket Go SDK.

## Example Categories

### [Data API Examples](./data/)
Examples for using the Polymarket Data API client:
- `data_demo.go` - Comprehensive Data API usage example
- `data_simple_test.go` - Basic Data API functionality test

### [Gamma API Examples](./gamma/)
Examples for using the Polymarket Gamma API client:
- `gamma_example.go` - Gamma API markets, events, and search functionality

### [CLOB Examples](./clob/)
Examples for using the CLOB (Centralized Order Book) client:
- `basic_usage.go` - Basic CLOB client setup and usage
- `wallet_demo.go` - Wallet operations and management

### [WebSocket Examples](./websocket/)
Examples for real-time WebSocket connections:
- `websocket_simple.go` - Basic WebSocket subscription
- `websocket_subscription.go` - Advanced WebSocket handling

### [Proxy Examples](./proxy/)
Examples for proxy configuration and IP verification:
- `proxy_demo.go` - HTTP proxy configuration
- `simple_proxy_demo.go` - Basic proxy setup
- `ip_verification_demo.go` - IP verification with proxy
- `ip_test_demo.go` - IP testing functionality

### [Signature Examples](./signature/)
Examples for cryptographic signatures and authentication:
- `test_sig.go` - Signature generation and testing
- `test_sig_debug.go` - Debug signature functionality

## Running Examples

Each example is in its own folder and can be run independently:

```bash
# Data API examples
cd examples/data
go run data_demo.go

# Gamma API example
cd examples/gamma
go run gamma_example.go

# CLOB examples
cd examples/clob
go run basic_usage.go

# WebSocket examples
cd examples/websocket
go run websocket_simple.go

# Proxy examples
cd examples/proxy
go run proxy_demo.go

# Signature examples
cd examples/signature
go run test_sig.go
```

## Requirements

All examples require:
- Go 1.19 or later
- Valid Polymarket API credentials (for CLOB examples)
- Internet connection (for API access)

## Configuration

Some examples may require environment variables or configuration:
- `POLYMARKET_KEY` - Private key for CLOB operations
- `POLYMARKET_FUNDER` - Funder address for CLOB operations

Refer to individual example folders for specific requirements.

---

## TypeScript Data API Examples (Legacy)

The following TypeScript examples are also available for the Data API:

### `data-api-quickstart.ts`
A simple getting started example that demonstrates the most common use cases.

### `data-api-examples.ts`
Comprehensive examples covering all Data API endpoints.

```bash
# Run the TypeScript examples
bun run examples/data-api-quickstart.ts
bun run examples/data-api-examples.ts
```

## Key Features Demonstrated

### 1. Position Management
```typescript
// Get current positions
const positions = await data.getCurrentPositions({
  user: "0x123...",
  limit: 50,
  sortBy: "SIZE",
  sortDirection: "DESC"
});

// Get closed positions
const closed = await data.getClosedPositions({
  user: "0x123...",
  sortBy: "REALIZEDPNL"
});

// Get all positions at once
const all = await data.getAllPositions("0x123...");
```

### 2. Activity Tracking
```typescript
// Get user activity
const activity = await data.getUserActivity({
  user: "0x123...",
  type: "BUY",
  limit: 100
});

// Filter by date range
const recent = await data.getUserActivity({
  user: "0x123...",
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
});
```

### 3. Portfolio Analytics
```typescript
// Get portfolio summary
const portfolio = await data.getPortfolioSummary("0x123...");
console.log(`Total Value: ${portfolio.totalValue[0]?.value}`);
console.log(`Markets Traded: ${portfolio.marketsTraded.traded}`);

// Get total value
const value = await data.getTotalValue({
  user: "0x123...",
  market: ["0xabc..."] // optional filter
});
```

### 4. Market Analytics
```typescript
// Get top holders
const holders = await data.getTopHolders({
  market: ["0xabc...", "0xdef..."],
  limit: 20,
  minBalance: 10
});

// Get open interest
const oi = await data.getOpenInterest({
  market: ["0xabc..."]
});

// Get live volume
const volume = await data.getLiveVolume({
  id: 12345 // event ID
});
```

## Configuration

The Data SDK supports proxy configuration:

```typescript
const data = new DataSDK({
  proxy: {
    host: "proxy.example.com",
    port: 8080,
    protocol: "http",
    username: "user", // optional
    password: "pass"  // optional
  }
});
```

## Proxy Server Endpoints

When running the Polymarket proxy server, the Data API endpoints are available at:

- `GET /data/health` - Health check
- `GET /data/positions` - Current positions
- `GET /data/positions/closed` - Closed positions
- `GET /data/positions/all` - All positions
- `GET /data/trades` - Trade history
- `GET /data/activity` - User activity
- `GET /data/holders` - Top holders
- `GET /data/portfolio/value` - Portfolio value
- `GET /data/portfolio/markets-traded` - Markets traded count
- `GET /data/portfolio/summary` - Portfolio summary
- `GET /data/analytics/open-interest` - Open interest
- `GET /data/analytics/live-volume` - Live volume

### User-specific convenience endpoints:
- `GET /data/user/:userAddress/portfolio` - User portfolio summary
- `GET /data/user/:userAddress/positions` - User positions
- `GET /data/user/:userAddress/activity` - User activity

## Error Handling

All examples include proper error handling:

```typescript
try {
  const result = await data.getCurrentPositions({ user: "0x123..." });
  console.log("Positions:", result);
} catch (error) {
  console.error("Failed to fetch positions:", error.message);
}
```

## API Documentation

Full API documentation is available at `/docs` when running the proxy server.