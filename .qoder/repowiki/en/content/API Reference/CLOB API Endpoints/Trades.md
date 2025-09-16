# Trades

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [clob.ts](file://src/routes/clob.ts)
- [client.ts](file://src/sdk/client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Endpoint Overview](#endpoint-overview)
3. [Authentication](#authentication)
4. [Request Parameters](#request-parameters)
5. [Response Structure](#response-structure)
6. [Pagination System](#pagination-system)
7. [Examples](#examples)
8. [Error Handling](#error-handling)
9. [SDK Implementation](#sdk-implementation)

## Introduction
This document provides comprehensive documentation for the POST /clob/trades endpoint of the Polymarket CLOB API. The endpoint allows clients to retrieve trade data with optional filtering capabilities. The API supports various filter parameters to narrow down results and implements a pagination system using cursor-based navigation. This documentation covers all aspects of the endpoint including authentication requirements, request parameters, response structure, pagination behavior, and usage examples.

## Endpoint Overview
The POST /clob/trades endpoint retrieves trade data from the Polymarket CLOB (Central Limit Order Book) system. Unlike traditional GET endpoints, this endpoint uses POST to accept filter parameters in the request body, allowing for more complex queries and avoiding URL length limitations.

The endpoint returns a JSON response containing a trades array with detailed information about each trade, including price, size, side, timestamps, and other metadata. Clients can filter trades using various parameters and navigate through results using a cursor-based pagination system.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L670-L678)

## Authentication
The trades endpoint requires authentication using two headers:

- `x-polymarket-key`: The Polymarket private key for CLOB authentication
- `x-polymarket-funder`: The funder address for CLOB operations

In production environments, both headers are required. In development environments, the system falls back to environment variables (`POLYMARKET_KEY` and `POLYMARKET_FUNDER`) if the headers are not provided, allowing for easier testing and development.

The authentication system is implemented in the route resolution middleware, which extracts credentials from headers and initializes the Polymarket SDK with the provided credentials.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L38-L65)

## Request Parameters
The trades endpoint accepts the following parameters in the request body:

### Filter Parameters
- `id`: Filter trades by specific trade ID
- `maker_address`: Filter trades by maker's wallet address
- `market`: Filter trades by market identifier
- `asset_id`: Filter trades by asset ID
- `before`: Filter trades executed before a specific timestamp
- `after`: Filter trades executed after a specific timestamp

### Pagination Parameters
- `only_first_page`: Boolean flag that determines pagination behavior
- `next_cursor`: Cursor for retrieving the next page of results

All parameters are optional. When no parameters are provided, the endpoint returns recent trades without filtering.

The request body schema is constructed by extending the `TradeParamsSchema` with additional pagination fields `only_first_page` and `next_cursor`.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L345-L351)
- [clob.ts](file://src/routes/clob.ts#L672-L678)

## Response Structure
The endpoint returns a JSON object with a single property:

```json
{
  "trades": [...]
}
```

The `trades` array contains objects with the following properties:

- `id`: Unique identifier for the trade
- `taker_order_id`: ID of the taker's order
- `market`: Market identifier
- `asset_id`: Asset identifier
- `side`: Trade side (BUY or SELL)
- `size`: Trade size/quantity
- `fee_rate_bps`: Fee rate in basis points
- `price`: Trade price
- `status`: Trade status
- `match_time`: Timestamp when the trade was matched
- `last_update`: Timestamp of the last update
- `outcome`: Trade outcome
- `bucket_index`: Bucket index for the trade
- `owner`: Owner of the trade
- `maker_address`: Maker's wallet address

The response structure is defined by the `TradeSchema` in the elysia-schemas file and is validated by the Elysia framework before being sent to the client.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L353-L368)
- [clob.ts](file://src/routes/clob.ts#L676-L678)

## Pagination System
The trades endpoint implements a cursor-based pagination system to handle large result sets efficiently.

### only_first_page Parameter
The `only_first_page` parameter controls the pagination behavior:
- When `only_first_page=true`: Returns only the first page of results without a cursor
- When `only_first_page=false` or omitted: Returns results with a `next_cursor` for retrieving subsequent pages

### Cursor-Based Navigation
The pagination system uses a `next_cursor` value that represents the position in the dataset. To retrieve subsequent pages:
1. Make the initial request without a cursor
2. Extract the `next_cursor` value from the response
3. Include the `next_cursor` in subsequent requests
4. Repeat until no `next_cursor` is returned, indicating the end of results

This approach provides efficient navigation through large datasets without the performance issues associated with offset-based pagination.

**Section sources**
- [client.ts](file://src/sdk/client.ts#L260-L264)
- [clob.ts](file://src/routes/clob.ts#L672-L675)

## Examples
### cURL Examples

**Retrieve all recent trades:**
```bash
curl -X POST https://api.polymarket.com/clob/trades \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS"
```

**Filter trades by market and maker address:**
```bash
curl -X POST https://api.polymarket.com/clob/trades \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "0x123...",
    "maker_address": "0xabc..."
  }'
```

**Get first page only (no pagination):**
```bash
curl -X POST https://api.polymarket.com/clob/trades \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "0x123...",
    "only_first_page": true
  }'
```

**Retrieve next page using cursor:**
```bash
curl -X POST https://api.polymarket.com/clob/trades \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "0x123...",
    "next_cursor": "abc123xyz"
  }'
```

### TypeScript Examples

**Using PolymarketSDK to get trades:**
```typescript
import { PolymarketSDK } from "@polymarket/sdk";

const sdk = new PolymarketSDK({
  privateKey: "YOUR_PRIVATE_KEY",
  funderAddress: "YOUR_FUNDER_ADDRESS"
});

// Get all trades for a market
const trades = await sdk.getTrades({ market: "0x123..." });

// Get trades with filtering
const filteredTrades = await sdk.getTrades({
  market: "0x123...",
  maker_address: "0xabc..."
});

// Get only first page
const firstPage = await sdk.getTrades(
  { market: "0x123..." },
  true
);

// Get next page using cursor
const nextPage = await sdk.getTrades(
  { market: "0x123..." },
  false,
  "abc123xyz"
);
```

**Section sources**
- [client.ts](file://src/sdk/client.ts#L260-L264)
- [clob.ts](file://src/routes/clob.ts#L670-L678)

## Error Handling
The endpoint implements standard error handling with appropriate HTTP status codes:

- **200 OK**: Successful response with trades data
- **400 Bad Request**: Invalid parameters or malformed request
- **500 Internal Server Error**: Server-side error during processing

Error responses follow the standard error format:
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": "Additional details (optional)"
}
```

The server validates the request body against the defined schema and returns 400 errors for invalid parameters. Server-side processing errors result in 500 responses. Authentication failures are handled at the route resolution level and result in appropriate error responses.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L245-L251)
- [clob.ts](file://src/routes/clob.ts#L676-L678)

## SDK Implementation
The PolymarketSDK provides a convenient wrapper for the trades endpoint with type safety and simplified usage.

### getTrades Method
The SDK exposes a `getTrades` method with the following signature:
```typescript
async getTrades(
  params?: TradeParams,
  onlyFirstPage?: boolean,
  nextCursor?: string
): Promise<Trade[]>
```

The method accepts:
- `params`: Optional filter parameters (id, maker_address, market, asset_id, before, after)
- `onlyFirstPage`: Optional boolean to control pagination behavior
- `nextCursor`: Optional cursor for pagination

### Internal Processing
The SDK handles the following internally:
1. Initializes the CLOB client with authentication credentials
2. Transforms the parameters by separating pagination fields from filter parameters
3. Makes the API request to the CLOB service
4. Returns the trades array directly (without the wrapper object)

The implementation extracts `only_first_page` and `next_cursor` from the request body, passing the remaining properties as filter parameters to maintain backward compatibility and clean API design.

**Section sources**
- [client.ts](file://src/sdk/client.ts#L260-L264)
- [clob.ts](file://src/routes/clob.ts#L672-L675)