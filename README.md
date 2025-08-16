# Polymarket SDK & Proxy Server

[![JSR](https://jsr.io/badges/@hk/polymarket)](https://jsr.io/@hk/polymarket)

A fully typed SDK and proxy server built with Elysia for Polymarket APIs. This package provides both standalone SDK clients and a proxy server with type-safe endpoints for CLOB and Gamma APIs, featuring comprehensive validation and automatic OpenAPI schema generation.

## Motivation & Approach

- Reason: The official Polymarket SDKs in TypeScript and Python aren't fully typed; some return values are `unknown`/`any`.
- Solution: A fully typed SDK plus a translation proxy server with end-to-end type safety and OpenAPI.
- Codegen: Generate SDKs in other languages from the proxy server's OpenAPI schema.
- Transformations: The proxy doesn't always return exactly the same payload as the original API. It normalizes data by parsing and validating fields. For example, some endpoints return an array of strings as a JSON-stringified string; the proxy parses this into a proper typed array for easier consumption and validation.
- Status: Work in progress — not all APIs are included yet.

## Features

- **Dual-Purpose Package**: Standalone SDK clients + Elysia proxy server
- **Unified TypeBox Validation**: Single source of truth for all schema validation using Elysia TypeBox
- **Type Safety**: Full TypeScript typing throughout with no `any` types
- **Standalone SDKs**: Use `PolymarketSDK` and `GammaSDK` directly in your applications
- **Proxy Server**: Optional Elysia server with REST API endpoints
- **OpenAPI Schema Generation**: Automatic Swagger documentation generation
- **CORS Support**: Ready for web application integration
- **Comprehensive Error Handling**: Structured error responses with proper status codes
- **Health Checks**: Built-in health monitoring endpoints
- **Production Ready**: Includes proper logging, validation, and error handling

## Architecture

This package provides two ways to use Polymarket APIs:

### 1. Standalone SDK Clients

- **`PolymarketSDK`**: For CLOB operations (requires credentials)
- **`GammaSDK`**: For Gamma API operations (no credentials required)

### 2. Proxy Server (Optional)

- **Gamma API** (`/gamma/*`) - Market and event data from `gamma-api.polymarket.com`
- **CLOB API** (`/clob/*`) - Trading and price history from Polymarket CLOB client

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
│   └── gamma-client.ts # GammaSDK (Gamma API client)
├── routes/            # Elysia server routes
│   ├── gamma.ts       # Gamma API endpoints
│   └── clob.ts        # CLOB API endpoints
├── types/
│   └── elysia-schemas.ts  # Unified TypeBox schema definitions
└── utils/             # Utility functions
```

### JSR Package Exports (from jsr.json)

- **`.`** → `./src/mod.ts` - Main SDK exports
- **`./proxy`** → `./src/client.ts` - Proxy client
- **`./sdk`** → `./src/sdk/index.ts` - Direct SDK access

## SDK Usage

### Standalone SDK Usage

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

### Type Definitions

All types are exported from the unified schema:

```typescript
import type {
  MarketType,
  EventType,
  MarketQueryType,
  EventQueryType,
  PriceHistoryQueryType,
  PriceHistoryResponseType,
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

## Installation & Setup

### Using as SDK Only

1. **Install from JSR**:

   ```bash
   # Using Deno
   deno add @hk/polymarket

   # Using Bun
   bunx jsr add @hk/polymarket

   # Using npm
   npx jsr add @hk/polymarket
   ```

2. **Use directly in your code**:
   ```typescript
   import { GammaSDK, PolymarketSDK } from "@hk/polymarket";
   // No server setup required!
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

## OpenAPI Schema Generation Plan

The server automatically generates OpenAPI 3.0 schemas that can be used to create type-safe SDKs for other languages:

### Accessing the Schema

1. **Swagger UI**: Visit `/docs` when the server is running
2. **Raw JSON**: Visit `/docs/json` to get the OpenAPI JSON schema

### Generating SDKs from OpenAPI Schema

The generated OpenAPI schema can be used with various code generators:

#### Python SDK Generation

```bash
# Using openapi-generator-cli
npm install -g @openapitools/openapi-generator-cli

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g python \
  -o ./generated/python-client \
  --additional-properties=packageName=polymarket_proxy_client
```

#### Go SDK Generation

```bash
# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g go \
  -o ./generated/go-client \
  --additional-properties=packageName=polymarket
```

#### TypeScript SDK Generation

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/docs/json \
  -g typescript-axios \
  -o ./generated/ts-client
```

## Type Safety & Validation

### Unified TypeBox Schema System

This package uses a **single source of truth** for all type definitions and validation through Elysia TypeBox schemas located in `src/types/elysia-schemas.ts`. This provides:

- **Compile-time type safety**: Full TypeScript types for all API operations
- **Runtime validation**: Automatic request/response validation in proxy server routes
- **OpenAPI generation**: Automatic schema generation for documentation
- **Cross-platform compatibility**: TypeBox schemas work across Bun, Node.js, Deno, and Cloudflare Workers

### Schema Architecture

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

### Benefits Over Duplicate Schemas

Previously, this package had duplicate schema definitions:

- ❌ `sdk/types.ts` (Effect schemas)
- ❌ `types/elysia-schemas.ts` (TypeBox schemas)

Now we have:

- ✅ **Single source**: `types/elysia-schemas.ts` (TypeBox schemas only)
- ✅ **No duplicate maintenance**
- ✅ **Consistent validation** across SDK and server
- ✅ **Smaller bundle size** (removed Effect dependency)

## Usage Examples

### SDK Usage Examples

```typescript
import { GammaSDK, PolymarketSDK, type MarketType } from "@hk/polymarket";

// Using GammaSDK
const gamma = new GammaSDK();
const markets: MarketType[] = await gamma.getMarkets({
  limit: "10",
  active: "true",
});

// Using PolymarketSDK
const polySdk = new PolymarketSDK({
  privateKey: process.env.POLYMARKET_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER!,
});

const priceHistory = await polySdk.getPriceHistory({
  market: "0x123...",
  interval: "1h",
  startDate: "2024-01-01",
});
```

### Proxy Server Usage

```typescript
// Direct HTTP API calls to proxy server
const markets = await fetch(
  "http://localhost:3000/gamma/markets?limit=10&active=true"
).then((res) => res.json());

const priceHistory = await fetch(
  "http://localhost:3000/clob/prices-history?market=0x123&interval=1h",
  {
    headers: {
      "x-polymarket-key": "your_key",
      "x-polymarket-funder": "your_funder",
    },
  }
).then((res) => res.json());
```

### Python (with generated SDK)

```python
import polymarket_proxy_client

client = polymarket_proxy_client.ApiClient()
api = polymarket_proxy_client.GammaAPIApi(client)

# Get markets
markets = api.gamma_markets_get(slug="bitcoin-above-100k")

# Get price history
price_data = api.clob_price_history_token_id_get(
    token_id="0x123",
    interval="1h"
)
```

## Development Plan

### Phase 1: Core Implementation ✅

- [x] Basic Elysia server setup
- [x] Gamma API routes with full typing
- [x] CLOB API routes with full typing
- [x] OpenAPI documentation generation
- [x] CORS and error handling
- [x] **Unified TypeBox schema system**
- [x] **Standalone SDK clients**
- [x] **JSR package publishing support**
- [x] **Eliminated duplicate schemas**
- [x] **Comprehensive caching system**

### Phase 2: SDK Generation

- [ ] Automated SDK generation pipeline for other languages
- [ ] Python SDK with proper typing
- [ ] Go SDK generation
- [ ] Enhanced TypeScript client generation

### Phase 3: Enhanced Features

- [ ] Rate limiting and request throttling
- [ ] Authentication/API key management
- [ ] Monitoring and metrics collection
- [ ] WebSocket support for real-time data
- [ ] Enhanced error recovery mechanisms

### Recent Updates ✅

- **Schema Consolidation**: Migrated from dual Effect + TypeBox schemas to unified TypeBox-only approach
- **Type Safety**: Eliminated all `any` types and improved TypeScript strictness
- **Bundle Optimization**: Removed Effect dependency, reduced package size
- **SDK Architecture**: Clean separation between standalone SDKs and proxy server
- **JSR Support**: Ready for publishing to JavaScript Registry with proper exports

## Contributing

1. Follow the existing TypeScript patterns
2. Ensure all endpoints have proper Elysia type validation
3. Update OpenAPI documentation for new endpoints
4. Test with both development and production builds

## License

MIT
