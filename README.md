# Polymarket SDK & Proxy Server

[![JSR](https://jsr.io/badges/@hk/polymarket)](https://jsr.io/@hk/polymarket)

A fully typed SDK and proxy server built with Elysia for Polymarket APIs. This package provides standalone SDK clients, WebSocket real-time streaming, and a proxy server with type-safe endpoints for CLOB and Gamma APIs, featuring comprehensive validation and automatic OpenAPI schema generation. Available in TypeScript, Python, and Go.

## Features

- **Fully Typed SDK**: Complete TypeScript support with no `any` types
- **WebSocket Client**: Real-time market data streaming with auto-reconnection
- **Proxy Server**: REST API with OpenAPI documentation
- **MCP Server**: Model Context Protocol server for AI interactions
- **Type Safety**: End-to-end type validation and transformation
- **Multiple Runtimes**: Supports Bun, Node.js, Deno, and Cloudflare Workers
- **Multi-Language Support**: TypeScript, Python, and Go clients with identical APIs

## Motivation & Approach

- Reason: The official Polymarket SDKs in TypeScript and Python aren't fully typed; some return values are `unknown`/`any`.
- Solution: A fully typed SDK plus a translation proxy server with end-to-end type safety and OpenAPI.
- Codegen: Generate SDKs in other languages from the proxy server's OpenAPI schema.
- Transformations: The proxy doesn't always return exactly the same payload as the original API. It normalizes data by parsing and validating fields. For example, some endpoints return an array of strings as a JSON-stringified string; the proxy parses this into a proper typed array for easier consumption and validation.
- Status: Work in progress — not all APIs are included yet.

## Architecture

This package provides two ways to use Polymarket APIs:

### 1. Standalone SDK Clients

- **`PolymarketSDK`**: For CLOB operations (requires credentials) — TypeScript
- **`GammaSDK`**: For Gamma API operations (no credentials required) — TypeScript
- **`DataSDK`**: For user positions, trades, and activity data — TypeScript
- **`PolymarketWebSocketClient`**: For real-time market data streaming — TypeScript
- **`GammaClient`**: Gamma API client — Python
- **`ClobClient`**: CLOB price history client — Python
- **`TradingClient`**: Order placement and management — Python
- **`PolymarketWebSocket`**: Async WebSocket for market and user channels — Python
- **`WebSocketClient`**: For real-time market data streaming — Go
- **`RedundantWSPool`**: Redundant parallel connections with message deduplication — Go

### 2. Proxy Server (Optional)

- **Gamma API** (`/gamma/*`) - Market and event data from `gamma-api.polymarket.com`
- **CLOB API** (`/clob/*`) - Trading and price history from Polymarket CLOB client
- **Data API** (`/data/*`) - User positions, trades, and activity data

### Directory Structure

```
src/
├── mod.ts             # Main SDK exports (JSR entry point)
├── index.ts           # Elysia server entry point
├── client.ts          # Proxy client (referenced in JSR)
├── run.ts             # Server runner for development
├── sdk/               # Standalone SDK clients
│   ├── index.ts       # SDK exports
│   ├── client.ts      # PolymarketSDK (CLOB client)
│   ├── gamma-client.ts # GammaSDK (Gamma API client)
│   ├── data-client.ts  # DataSDK (Data API client)
│   └── websocket-client.ts # WebSocket client for real-time data
├── routes/            # Elysia server routes
│   ├── gamma.ts       # Gamma API endpoints
│   ├── clob.ts        # CLOB API endpoints
│   └── data.ts        # Data API endpoints
├── types/
│   ├── elysia-schemas.ts  # Unified TypeBox schema definitions
│   └── websocket-schemas.ts # WebSocket message schemas (Zod)
└── utils/             # Utility functions

py-src/
└── polymarket_kit/
    ├── __init__.py        # Package exports
    ├── profile.py         # Wallet address extraction from usernames
    ├── gamma/             # Gamma API client (GammaClient, GammaSDK)
    ├── clob/              # CLOB client (ClobClient, TradingClient)
    ├── data/              # Data API client (DataSDK)
    └── ws/                # Async WebSocket client (PolymarketWebSocket)

go-client/
├── auth/              # Ethereum wallet & signing
├── client/            # CLOB client implementation
│   ├── clob_client.go          # Main API client
│   ├── websocket_client.go     # Market WebSocket
│   ├── user_ws.go              # User channel WebSocket
│   ├── orders.go               # Order building & placement
│   ├── ws_pool.go              # Redundant WebSocket pool
│   └── aggregator.go           # Message deduplication
├── order/             # Order building utilities
├── realtime/          # Real-time data client
├── data/              # Data API client
├── gamma/             # Gamma API client
└── examples/          # Comprehensive usage examples
```

### JSR Package Exports (from jsr.json)

- **`.`** → `./src/mod.ts` - Main SDK exports
- **`./proxy`** → `./src/client.ts` - Proxy client
- **`./sdk`** → `./src/sdk/index.ts` - Direct SDK access

## SDK Usage

### TypeScript SDK

#### Using GammaSDK (No credentials required)

```typescript
import { GammaSDK } from "@hk/polymarket";

const gammaSDK = new GammaSDK();

// Get all active markets
const markets = await gammaSDK.getActiveMarkets();

// Get markets with filtering
const filteredMarkets = await gammaSDK.getMarkets({
  limit: "10",
  active: "true",
  volume_num_min: "1000",
});

// Get specific market by slug
const market = await gammaSDK.getMarketBySlug("bitcoin-above-100k");

// Get events with filtering
const events = await gammaSDK.getEvents({
  limit: "5",
  active: "true",
  end_date_min: "2024-01-01",
});
```

#### Using PolymarketSDK (Requires credentials)

```typescript
import { PolymarketSDK } from "@hk/polymarket";

const polymarketSDK = new PolymarketSDK({
  privateKey: "your_private_key",
  funderAddress: "your_funder_address",
});

// Get price history for a market
const priceHistory = await polymarketSDK.getPriceHistory({
  market: "0x123...", // CLOB token ID
  interval: "1h",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});

// Check CLOB connection health
const health = await polymarketSDK.healthCheck();
```

### Python SDK

#### Installation

```bash
# Using uv (recommended)
uv add polymarket-kit

# Using pip
pip install polymarket-kit
```

#### Using GammaClient (No credentials required)

```python
from polymarket_kit import GammaSDK

gamma = GammaSDK()

# Get markets
markets = gamma.get_markets(limit=10, active=True)

# Get events
events = gamma.get_events(limit=5, active=True)

# Get market by slug
market = gamma.get_market_by_slug("bitcoin-above-100k")
```

#### Using TradingClient (Order placement)

```python
import asyncio
from polymarket_kit import TradingClient

async def main():
    client = TradingClient(
        private_key="your_private_key",
        funder="your_funder_address",
    )

    # Initialize and derive API credentials
    creds = await client.initialize()

    # Place a GTC limit buy order
    resp = await client.place_limit_order(
        token_id="60487116984468020978247225474488676749601001829886755968952521846780452448915",
        price=0.45,
        size=10.0,
        side="BUY",
    )
    print(f"Order placed: {resp.order_id}, status={resp.status}")

    # Query open orders
    open_orders = await client.get_open_orders()

    # Cancel an order
    await client.cancel_order(resp.order_id)

asyncio.run(main())
```

#### Python WebSocket (Market channel)

```python
import asyncio
from polymarket_kit import PolymarketWebSocket
from polymarket_kit.ws import BookMessage, PriceChangeMessage, LastTradePriceMessage

async def main():
    ws = PolymarketWebSocket("market")

    ws.on_book = lambda msg: print(f"Book: bids={len(msg.bids)} asks={len(msg.asks)}")
    ws.on_price_change = lambda msg: print(f"Price change: {len(msg.price_changes)} changes")
    ws.on_last_trade = lambda msg: print(f"Trade: {msg.side} @ {msg.price}")
    ws.on_connect = lambda: print("Connected!")

    await ws.connect()
    await ws.subscribe([
        "60487116984468020978247225474488676749601001829886755968952521846780452448915"
    ])

    await asyncio.Event().wait()  # run forever

asyncio.run(main())
```

#### Python WebSocket (User channel)

```python
import asyncio
from polymarket_kit import PolymarketWebSocket, ApiCreds

async def main():
    creds = ApiCreds(
        api_key="your_api_key",
        secret="your_secret",
        passphrase="your_passphrase",
    )

    ws = PolymarketWebSocket("user", api_creds=creds)
    ws.on_order = lambda evt: print(f"Order event: {evt}")
    ws.on_trade = lambda evt: print(f"Trade event: {evt}")

    await ws.connect()
    await asyncio.Event().wait()

asyncio.run(main())
```

## WebSocket Real-Time Data

Stream real-time market data with automatic authentication, reconnection, and type-safe message handling.

### TypeScript WebSocket Client

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { PolymarketWebSocketClient } from "@hk/polymarket";

const signer = new Wallet(process.env.POLYMARKET_KEY!);
const clobClient = new ClobClient("https://clob.polymarket.com", 137, signer);

// Create WebSocket client with asset IDs to subscribe to
const ws = new PolymarketWebSocketClient(clobClient, {
  assetIds: ["60487116984468020978247225474488676749601001829886755968952521846780452448915"],
  autoReconnect: true,
  debug: true,
});

// Register event handlers
ws.on({
  onBook: (msg) => {
    console.log(`Book Update - Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`);
  },
  onPriceChange: (msg) => {
    console.log(`Price Change - ${msg.price_changes.length} changes`);
  },
  onLastTradePrice: (msg) => {
    console.log(`Trade: ${msg.side} @ ${msg.price}`);
  },
  onError: (error) => console.error("Error:", error),
  onConnect: () => console.log("Connected!"),
});

await ws.connect();
```

### Go WebSocket Client

```go
import (
    "github.com/HuakunShen/polymarket-kit/go-client/client"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
)

config := &client.ClientConfig{
    Host:       "https://clob.polymarket.com",
    ChainID:    types.ChainPolygon,
    PrivateKey: os.Getenv("POLYMARKET_KEY"),
}

clobClient, _ := client.NewClobClient(config)

wsClient := client.NewWebSocketClient(clobClient, &client.WebSocketClientOptions{
    AssetIDs: []string{
        "60487116984468020978247225474488676749601001829886755968952521846780452448915",
    },
    AutoReconnect: true,
    Debug:         true,
})

wsClient.On(&client.WebSocketCallbacks{
    OnBook: func(msg *types.BookMessage) {
        fmt.Printf("Book Update - Bids: %d, Asks: %d\n", len(msg.Bids), len(msg.Asks))
    },
    OnLastTradePrice: func(msg *types.LastTradePriceMessage) {
        fmt.Printf("Trade: %s @ %s\n", msg.Side, msg.Price)
    },
    OnError: func(err error) {
        fmt.Printf("Error: %v\n", err)
    },
})

wsClient.Connect()
```

### Go Redundant WebSocket Pool

For high-availability scenarios, use `RedundantWSPool` which maintains N parallel connections with automatic message deduplication:

```go
pool := client.NewRedundantWSPool(&client.PoolConfig{
    Redundancy:   3,           // 3 parallel connections
    DedupTTL:     60 * time.Second,
    OnMessage: func(msg []byte) {
        // deduplicated message callback
        fmt.Println(string(msg))
    },
})

ctx := context.Background()
pool.Start(ctx)
pool.Subscribe([]string{"asset_id_1", "asset_id_2"})
```

### WebSocket Features

- **Automatic Authentication** - Handles API key derivation automatically
- **Type-Safe Messages** - Full validation and typing for all message types
- **Auto-Reconnection** - Configurable reconnection with exponential backoff
- **Event Handlers** - Clean callback API for each message type
- **User Channel** - Authenticated order/trade event streaming (Python & Go)
- **Redundant Pool** - Multiple parallel connections with deduplication (Go)
- **Debug Logging** - Optional detailed logging for troubleshooting

### Message Types

The WebSocket client handles these message types:

1. **Book Messages** - Full orderbook snapshots and updates
2. **Price Change Messages** - Real-time price level changes
3. **Tick Size Change Messages** - Minimum tick size updates
4. **Last Trade Price Messages** - Trade execution events
5. **Order Events** - Order placement/fill events (user channel)
6. **Trade Events** - Trade execution events (user channel)

See [WebSocket Client Documentation](./docs/WEBSOCKET_CLIENT.md) for detailed API reference and examples.

### Type Definitions

All types are exported from the unified schema:

```typescript
import type {
  // Market & Event Types
  MarketType,
  EventType,
  MarketQueryType,
  EventQueryType,
  PriceHistoryQueryType,
  PriceHistoryResponseType,

  // WebSocket Types
  MarketChannelMessage,
  BookMessage,
  PriceChangeMessage,
  TickSizeChangeMessage,
  LastTradePriceMessage,
  WebSocketClientOptions,
  WebSocketClientCallbacks,
} from "@hk/polymarket";
```

## Proxy Server API Endpoints

### System Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Global health check
- `GET /docs` - Swagger/OpenAPI documentation

### Gamma API Endpoints

- `GET /gamma/markets` - Get markets with comprehensive filtering
  - Query params: `limit`, `offset`, `order`, `ascending`, `id`, `slug`, `archived`, `active`, `closed`, `clob_token_ids`, `condition_ids`, `liquidity_num_min`, `liquidity_num_max`, `volume_num_min`, `volume_num_max`, `start_date_min`, `start_date_max`, `end_date_min`, `end_date_max`, `tag_id`, `related_tags`
- `GET /gamma/events` - Get events with comprehensive filtering
  - Query params: `limit`, `offset`, `order`, `ascending`, `id`, `slug`, `archived`, `active`, `closed`, `liquidity_min`, `liquidity_max`, `volume_min`, `volume_max`, `start_date_min`, `start_date_max`, `end_date_min`, `end_date_max`, `tag`, `tag_id`, `related_tags`, `tag_slug`

### CLOB API Endpoints

- `GET /clob/prices-history` - Get price history for a market token
  - Required query param: `market` (CLOB token ID)
  - Time range options: `startTs`, `endTs` (Unix timestamps) OR `startDate`, `endDate` (ISO strings)
  - Interval option: `interval` (1m, 1h, 6h, 1d, 1w, max)
  - Data resolution: `fidelity` (resolution in minutes)
  - Headers: `x-polymarket-key`, `x-polymarket-funder` (required in production)
- `GET /clob/health` - CLOB client connection health check
- `GET /clob/cache/stats` - Get cache statistics for SDK instances and CLOB clients
- `DELETE /clob/cache` - Clear all caches

### Data API Endpoints

- `GET /data/positions` - Get user positions
- `GET /data/closed-positions` - Get closed positions
- `GET /data/trades` - Get user trades
- `GET /data/activity` - Get user activity
- `GET /data/holders` - Get market holders
- `GET /data/top-holders` - Get top holders for a market
- `GET /data/total-value` - Get total portfolio value
- `GET /data/markets-traded` - Get total markets traded count
- `GET /data/open-interest` - Get open interest
- `GET /data/live-volume` - Get live trading volume
- `GET /data/health` - Data API health check

## Installation & Setup

### Python SDK

```bash
# Using uv
uv add polymarket-kit

# Using pip
pip install polymarket-kit
```

Requires Python >= 3.12.

### TypeScript SDK

```bash
# Using Deno
deno add @hk/polymarket

# Using Bun
bunx jsr add @hk/polymarket

# Using npm
npx jsr add @hk/polymarket
```

### Running the Proxy Server

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Environment Variables**:

   ```bash
   # Required for CLOB API endpoints
   POLYMARKET_KEY=your_private_key_here
   POLYMARKET_FUNDER=your_funder_address

   # Optional
   PORT=3000  # defaults to 3000
   SDK_CACHE_MAX_SIZE=50  # defaults to 50
   SDK_CACHE_TTL_HOURS=1  # defaults to 1
   CLOB_CLIENT_CACHE_MAX_SIZE=100  # defaults to 100
   CLOB_CLIENT_CACHE_TTL_MINUTES=30  # defaults to 30
   ```

3. **Development**:

   ```bash
   bun run dev
   ```

4. **Production**:

   ```bash
   bun run src/index.ts
   ```

5. **Deploy to Cloudflare Workers** (optional):
   ```bash
   bun run deploy
   ```

## OpenAPI Schema Generation

The server automatically generates OpenAPI 3.0 schemas that can be used to create type-safe SDKs for other languages.

### Accessing the Schema

1. **Swagger UI**: Visit `/docs` when the server is running
2. **Raw JSON**: Visit `/docs/json` to get the OpenAPI JSON schema

### Generating SDKs from OpenAPI Schema

```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g python \
  -o ./generated/python-client \
  --additional-properties=packageName=polymarket_proxy_client

# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g go \
  -o ./generated/go-client \
  --additional-properties=packageName=polymarket

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g typescript-axios \
  -o ./generated/ts-client
```

## Type Safety & Validation

### TypeScript: Unified TypeBox Schema System

All types are defined in `src/types/elysia-schemas.ts` using TypeBox — a single source of truth for compile-time types, runtime validation, and OpenAPI generation.

```typescript
// All schemas are defined once in elysia-schemas.ts
export const MarketSchema = t.Object({
  id: t.String(),
  question: t.String(),
  // ... comprehensive type definitions
});

// Types are automatically derived
export type MarketType = typeof MarketSchema.static;
```

### Python: Pydantic Models

All Python types are defined as Pydantic models, providing runtime validation and IDE auto-completion.

## MCP Server

The Model Context Protocol (MCP) server provides a natural language interface to Polymarket data for AI models and assistants.

### Starting the MCP Server

```bash
bun run src/mcp/polymarket.ts
```

### Available Tools

- **Market Analysis**: `get_markets`, `get_market_by_id`, `get_market_by_slug`
- **Event Management**: `get_events`, `get_event_by_id`, `get_event_markdown`
- **Search & Discovery**: `search_polymarket`, `get_tags`
- **Analytics**: `get_market_trends`, `get_popular_markets`

### Integration with AI Clients

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "bun",
      "args": ["run", "path/to/polymarket-kit/src/mcp/polymarket.ts"]
    }
  }
}
```

See [GEMINI.md](./GEMINI.md) for detailed usage examples and integration guides.

## Development Plan

### Phase 1: Core Implementation ✅

- [x] Basic Elysia server setup
- [x] Gamma API routes with full typing
- [x] CLOB API routes with full typing
- [x] Data API routes with full typing
- [x] OpenAPI documentation generation
- [x] CORS and error handling
- [x] Unified TypeBox schema system
- [x] Standalone SDK clients (TypeScript)
- [x] Python SDK (GammaClient, ClobClient, TradingClient, WebSocket)
- [x] JSR package publishing support
- [x] Eliminated duplicate schemas
- [x] Comprehensive caching system

### Phase 2: Advanced Features ✅

- [x] WebSocket support for real-time data (TypeScript, Python, Go)
- [x] Type-safe WebSocket message schemas
- [x] Auto-reconnection and error handling
- [x] User channel WebSocket (authenticated order/trade events)
- [x] Redundant WebSocket pool with message deduplication (Go)
- [x] Order placement with EIP-712 signing (Python, Go)
- [x] Profile wallet address extraction (Python)

### Phase 3: In Progress

- [ ] Rate limiting and request throttling
- [ ] Authentication/API key management
- [ ] Monitoring and metrics collection
- [ ] Enhanced error recovery mechanisms
- [ ] Automated SDK generation pipeline

## Contributing

1. Follow the existing TypeScript patterns
2. Ensure all endpoints have proper Elysia type validation
3. Update OpenAPI documentation for new endpoints
4. Test with both development and production builds

## License

MIT
