# CLOB API Examples

This directory contains examples demonstrating different authentication methods and usage patterns for the Polymarket CLOB SDK.

## Examples

### 1. Public Access (`public-access.ts`)

Demonstrates how to use the SDK for public operations that don't require authentication:

- Price history fetching
- Order book retrieval
- Midpoint price queries
- Trade history

**Usage:**

```bash
bun run examples/clob/public-access.ts
```

### 2. BuilderConfig Authentication (`builder-config-auth.ts`)

Shows how to use the new BuilderConfig authentication method:

- Local builder credentials
- Remote builder service
- Authenticated operations

**Environment Variables:**

```bash
# For local builder credentials
POLY_BUILDER_API_KEY=your_api_key
POLY_BUILDER_SECRET=your_secret
POLY_BUILDER_PASSPHRASE=your_passphrase

# For remote builder service
POLY_BUILDER_SERVICE_URL=http://localhost:3000/sign
POLY_BUILDER_SERVICE_TOKEN=optional_auth_token
```

**Usage:**

```bash
bun run examples/clob/builder-config-auth.ts
```

### 3. Legacy Authentication (`legacy-auth.ts`)

Demonstrates the deprecated legacy authentication method:

- Private key and funder address
- Backward compatibility

**Environment Variables:**

```bash
POLYMARKET_KEY=0x_your_private_key
POLYMARKET_FUNDER=0x_your_funder_address
```

**Usage:**

```bash
bun run examples/clob/legacy-auth.ts
```

### 4. HTTP Proxy Configuration (`http-proxy.ts`)

Shows how to configure HTTP proxy for SDK requests:

- Public proxy usage
- Authenticated proxy usage
- Proxy authentication

**Usage:**

```bash
bun run examples/clob/http-proxy.ts
```

## Authentication Methods Comparison

| Method                 | Security | Setup Complexity | Recommended                   |
| ---------------------- | -------- | ---------------- | ----------------------------- |
| Public Access          | Low      | None             | ✅ For public data only       |
| BuilderConfig (Local)  | High     | Medium           | ✅ Recommended for production |
| BuilderConfig (Remote) | High     | Low              | ✅ Recommended for production |
| Legacy                 | Medium   | Low              | ⚠️ Deprecated                 |

## Migration Guide

### From Legacy to BuilderConfig

**Old way:**

```typescript
const sdk = new PolymarketSDK({
  privateKey: "0x...",
  funderAddress: "0x...",
});
```

**New way (Remote Builder):**

```typescript
const builderConfig = new BuilderConfig({
  remoteBuilderConfig: {
    url: "http://localhost:3000/sign",
  },
});

const sdk = new PolymarketSDK({
  builderConfig,
});
```

**New way (Local Builder):**

```typescript
const builderConfig = new BuilderConfig({
  localBuilderCreds: {
    key: "your_api_key",
    secret: "your_secret",
    passphrase: "your_passphrase",
  },
});

const sdk = new PolymarketSDK({
  builderConfig,
});
```

## Common Use Cases

### Price History Analysis

```typescript
const sdk = new PolymarketSDK(); // Public access
const history = await sdk.getPriceHistory({
  market: "token_id",
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  interval: "1d",
});
```

### Real-time Market Data

```typescript
const sdk = new PolymarketSDK(); // Public access
const [book, midpoint, trades] = await Promise.all([
  sdk.getBook("token_id"),
  sdk.getMidpoint("token_id"),
  sdk.getTrades({ market: "token_id" }, true),
]);
```

### Authenticated Trading

```typescript
const builderConfig = new BuilderConfig({
  remoteBuilderConfig: { url: "http://localhost:3000/sign" },
});
const sdk = new PolymarketSDK({ builderConfig });

// Now you can perform authenticated operations
const health = await sdk.healthCheck();
```

## Error Handling

All examples include proper error handling:

```typescript
try {
  const result = await sdk.someOperation();
  console.log("✅ Success:", result);
} catch (error) {
  console.error(
    "❌ Error:",
    error instanceof Error ? error.message : String(error),
  );
}
```

## Testing

To test all examples:

```bash
# Install dependencies
bun install

# Test public access
bun run examples/clob/public-access.ts

# Test BuilderConfig (set env vars first)
export POLY_BUILDER_SERVICE_URL="http://localhost:3000/sign"
bun run examples/clob/builder-config-auth.ts

# Test legacy (set env vars first)
export POLYMARKET_KEY="0x..."
export POLYMARKET_FUNDER="0x..."
bun run examples/clob/legacy-auth.ts
```
