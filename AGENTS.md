# Polymarket Kit — SDK + Proxy Server

Dual-purpose package: standalone SDKs + optional Elysia proxy server. Available in TypeScript, Python, and Go.

## ARCHITECTURE

```
polymarket-kit/
├── src/                    # TypeScript (Elysia server + SDKs)
│   ├── index.ts           # Server entry
│   ├── sdk/               # Standalone clients
│   │   ├── gamma-client.ts    # Gamma API (no auth)
│   │   ├── client.ts          # CLOB API (requires key+funder)
│   │   └── websocket-client.ts # Real-time orderbook
│   ├── routes/            # Proxy endpoints
│   │   ├── gamma.ts       # GET /gamma/markets, /gamma/events
│   │   └── clob.ts        # GET /clob/prices-history
│   └── types/             # TypeBox schemas (single source of truth)
├── py-src/                # Python SDK
│   └── polymarket_kit/
│       ├── gamma/client.py    # GammaClient (httpx)
│       └── clob/client.py     # ClobClient (httpx)
└── go-client/             # Go SDK
    ├── client/            # CLOB client + WebSocket
    └── types/             # Core types
```

## SDK USAGE

### TypeScript (GammaSDK — no auth required)

```typescript
import { GammaSDK } from "@hk/polymarket";

const gamma = new GammaSDK({ proxy: { host: "localhost", port: 8080 } });
const markets = await gamma.getMarkets({ limit: "10", active: "true" });
const market = await gamma.getMarketBySlug("bitcoin-above-100k");
```

### TypeScript (PolymarketSDK — requires credentials)

```typescript
import { PolymarketSDK } from "@hk/polymarket";

const poly = new PolymarketSDK({
  privateKey: process.env.POLYMARKET_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER!,
});
const history = await poly.getPriceHistory({ market: "0x123", interval: "1h" });
```

### Python (GammaClient)

```python
from polymarket_kit import GammaClient

with GammaClient(proxy="http://localhost:8080") as client:
    markets = client.get_markets(limit=10, active=True)
```

### Python (ClobClient)

```python
from polymarket_kit import ClobClient

with ClobClient() as client:
    history = client.get_price_history(market="0x123", interval="1h")
```

### Go (ClobClient)

```go
import "github.com/HuakunShen/polymarket-kit/go-client/client"

c, _ := client.NewClobClient(&client.ClientConfig{
    Host:       "https://clob.polymarket.com",
    ChainID:    types.ChainPolygon,
    PrivateKey: os.Getenv("POLYMARKET_KEY"),
})
```

## WEBSOCKET (Real-Time Data)

```typescript
import { PolymarketWebSocketClient } from "@hk/polymarket";

const ws = new PolymarketWebSocketClient(clobClient, {
  assetIds: ["60487..."],
  autoReconnect: true,
});

ws.on({
  onBook: (msg) =>
    console.log(`Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`),
  onPriceChange: (msg) => console.log(`${msg.price_changes.length} changes`),
});

await ws.connect();
```

## PROXY SERVER API

| Endpoint                   | Description                  |
| -------------------------- | ---------------------------- |
| `GET /gamma/markets`       | Query markets with filtering |
| `GET /gamma/events`        | Query events with filtering  |
| `GET /clob/prices-history` | Price history for token      |
| `GET /docs`                | Swagger/OpenAPI UI           |

## BUILD & TEST

```bash
bun install
bun run dev           # Hot-reload server
bun run build         # Build CLI
bun test              # Run tests
bun run format        # Biome format
bun run deploy        # Deploy to Cloudflare Workers
```

## CREDENTIALS

Required for CLOB operations:

- `POLYMARKET_KEY` — Polygon wallet private key (0x...)
- `POLYMARKET_FUNDER` — Proxy/funder address (optional)
- `POLYMARKET_SIGNATURE_TYPE` — 0=EOA, 1=Magic, 2=Contract

## ANTI-PATTERNS

- **DO NOT** log sensitive headers (POLYMARKET_KEY)
- **DO NOT** commit `.env` files
- **DO NOT** use `any` types — all schemas via TypeBox
