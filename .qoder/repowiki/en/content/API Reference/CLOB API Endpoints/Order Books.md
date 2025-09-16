# Order Books

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [clob.ts](file://src/routes/clob.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Single Order Book Retrieval (GET /clob/book/:tokenId)](#single-order-book-retrieval-get-clobbooktokenid)
3. [Batch Order Book Retrieval (POST /clob/orderbooks)](#batch-order-book-retrieval-post-cloborderbooks)
4. [Authentication Requirements](#authentication-requirements)
5. [Error Handling](#error-handling)
6. [Caching in SDK](#caching-in-sdk)
7. [Examples](#examples)

## Introduction
This document provides comprehensive API documentation for the CLOB API's order book endpoints. It covers both the single order book retrieval endpoint (GET /clob/book/:tokenId) and the batch retrieval endpoint (POST /clob/orderbooks). The documentation includes details on request parameters, response structures, authentication requirements, error handling, and usage examples in both curl and TypeScript.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L1013)

## Single Order Book Retrieval (GET /clob/book/:tokenId)
The GET /clob/book/:tokenId endpoint retrieves the current order book for a specific token ID.

### Path Parameter
- **tokenId**: The CLOB token ID to get the order book for (string, required)

### Response Structure
The response follows the OrderBookSummarySchema and includes the following fields:
- **market**: Market identifier (string)
- **asset_id**: Asset identifier (string)
- **timestamp**: Timestamp of the order book (string)
- **bids**: Array of bid orders, each containing price and size (array of objects)
- **asks**: Array of ask orders, each containing price and size (array of objects)
- **min_order_size**: Minimum order size allowed (string)
- **tick_size**: Price increment/tick size (string)
- **neg_risk**: Boolean indicating negative risk status
- **hash**: Hash identifier for the order book (string)

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L459-L469)
- [clob.ts](file://src/routes/clob.ts#L280-L318)

## Batch Order Book Retrieval (POST /clob/orderbooks)
The POST /clob/orderbooks endpoint retrieves order books for multiple token IDs in a single request.

### Request Body Format
The request body is an array of objects that follow the BookParamsSchema:
- **token_id**: The CLOB token ID (string, required)
- **side**: The side parameter, which must be either "BUY" or "SELL" (enum, required)

### Response Structure
The response is an array of OrderBookSummarySchema objects, with each element representing the order book for one of the requested token IDs. The structure of each order book is identical to the single order book response.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L474-L477)
- [clob.ts](file://src/routes/clob.ts#L320-L358)

## Authentication Requirements
Both endpoints require authentication using the following headers:
- **x-polymarket-key**: Polymarket private key for CLOB authentication
- **x-polymarket-funder**: Polymarket funder address for CLOB operations

In production, these headers are required. In development mode, the system falls back to environment variables (POLYMARKET_KEY and POLYMARKET_FUNDER) if the headers are not provided.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L22-L58)

## Error Handling
The API provides specific error responses for different scenarios:

### 404 Not Found
Returned when requesting an order book for a non-existent token ID. The response includes:
- Status code: 404
- Error object with message indicating "No orderbook exists"

### 400 Bad Request
Returned when request validation fails. The response includes:
- Status code: 400
- Error object with details about the validation failure

### 500 Internal Server Error
Returned when an unexpected error occurs on the server. The response includes:
- Status code: 500
- Error object with error message

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L294-L305)
- [clob.ts](file://src/routes/clob.ts#L342-L348)

## Caching in SDK
The PolymarketSDK implements caching for improved performance:
- SDK instances are cached using an LRU cache based on privateKey_funderAddress
- Cache size is configurable via SDK_CACHE_MAX_SIZE environment variable (default: 50)
- Cache TTL is configurable via SDK_CACHE_TTL_HOURS environment variable (default: 1 hour)
- Cache statistics can be retrieved from the /clob/cache/stats endpoint
- The SDK's internal CLOB client also maintains its own cache for order book data

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L16-L20)
- [clob.ts](file://src/routes/clob.ts#L60-L75)
- [clob.ts](file://src/routes/clob.ts#L200-L228)

## Examples

### curl Examples
**Single Order Book Retrieval:**
```bash
curl -X GET "https://api.polymarket.com/clob/book/12345" \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS"
```

**Batch Order Book Retrieval:**
```bash
curl -X POST "https://api.polymarket.com/clob/orderbooks" \
  -H "x-polymarket-key: YOUR_PRIVATE_KEY" \
  -H "x-polymarket-funder: YOUR_FUNDER_ADDRESS" \
  -H "Content-Type: application/json" \
  -d '[{"token_id": "12345", "side": "BUY"}, {"token_id": "67890", "side": "SELL"}]'
```

### TypeScript Examples
**Single Order Book Retrieval:**
```typescript
import { PolymarketSDK } from "../sdk/";

const sdk = new PolymarketSDK({
  privateKey: "YOUR_PRIVATE_KEY",
  funderAddress: "YOUR_FUNDER_ADDRESS"
});

const orderBook = await sdk.getBook("12345");
```

**Batch Order Book Retrieval:**
```typescript
import { PolymarketSDK } from "../sdk/";
import { Side } from "@polymarket/clob-client";

const sdk = new PolymarketSDK({
  privateKey: "YOUR_PRIVATE_KEY",
  funderAddress: "YOUR_FUNDER_ADDRESS"
});

const orderBooks = await sdk.getOrderBooks([
  { token_id: "12345", side: Side.BUY },
  { token_id: "67890", side: Side.SELL }
]);
```

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L280-L358)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L891)