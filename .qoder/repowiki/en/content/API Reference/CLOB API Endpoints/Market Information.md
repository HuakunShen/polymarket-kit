# Market Information

<cite>
**Referenced Files in This Document**   
- [clob.ts](file://src/routes/clob.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [market_with_condition_item_request_builder.go](file://go-polymarket/client/clob/market_with_condition_item_request_builder.go)
- [markets_request_builder.go](file://go-polymarket/client/clob/markets_request_builder.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Single Market Retrieval](#single-market-retrieval)
3. [Paginated Market Listing](#paginated-market-listing)
4. [Authentication Requirements](#authentication-requirements)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Introduction
This document provides comprehensive API documentation for the CLOB API's market information endpoints. It covers both the single market retrieval endpoint (`GET /clob/market/:conditionId`) and the paginated market listing endpoint (`GET /clob/markets`). The documentation includes details on parameters, response structures, authentication requirements, error handling, and usage examples in both curl and TypeScript.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L1013)

## Single Market Retrieval
The `GET /clob/market/:conditionId` endpoint retrieves comprehensive market data for a specific condition ID. The `conditionId` path parameter uniquely identifies the market to retrieve. The response includes detailed information such as outcomes, outcome prices, liquidity, volume, and other metadata about the market.

The endpoint returns a comprehensive market object that typically includes fields like `outcomes`, `outcomePrices`, and `liquidity`. Due to the variable structure of market data, the route definition uses `t.Any()` for the response type, allowing for flexibility in the returned data structure while still providing comprehensive market information.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L770-L799)
- [market_with_condition_item_request_builder.go](file://go-polymarket/client/clob/market_with_condition_item_request_builder.go#L0-L73)

## Paginated Market Listing
The `GET /clob/markets` endpoint provides a paginated list of markets. This endpoint supports pagination through the optional `next_cursor` query parameter, which allows clients to retrieve subsequent pages of market data. When making requests, clients can include the `next_cursor` parameter with the cursor value received from a previous response to fetch the next set of results.

The response structure for this endpoint follows the `PaginationPayloadSchema`, which includes metadata about the pagination state such as the limit, count, and next cursor, along with the actual market data in the `data` field. This schema enables efficient navigation through large sets of market data while maintaining performance and reducing payload size.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L799-L822)
- [markets_request_builder.go](file://go-polymarket/client/clob/markets_request_builder.go#L0-L104)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L470-L476)

## Authentication Requirements
Both market information endpoints require authentication using two headers: `x-polymarket-key` and `x-polymarket-funder`. The `x-polymarket-key` header contains the Polymarket private key for CLOB authentication, while the `x-polymarket-funder` header contains the funder address for CLOB operations.

In production environments, both headers are required for successful authentication. However, in development mode, the system provides a fallback mechanism that reads credentials from environment variables (`POLYMARKET_KEY` and `POLYMARKET_FUNDER`) if the headers are not provided. This development fallback simplifies testing and local development while maintaining security in production environments.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L28-L77)

## Error Handling
The market information endpoints implement comprehensive error handling for various scenarios. For the single market retrieval endpoint, errors may occur when an invalid condition ID is provided, resulting in appropriate error responses. Both endpoints can return standard HTTP error codes including 400 (Bad Request) for invalid parameters and 500 (Internal Server Error) for API failures.

The single market endpoint may return a 400 error when the condition ID is malformed or invalid, while the listing endpoint may return a 400 error for invalid pagination parameters. In cases of system failures or unexpected errors, both endpoints return 500 status codes with descriptive error messages to aid in troubleshooting and debugging.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L770-L822)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L190-L198)

## Examples
### curl Examples
Retrieve a single market by condition ID:
```bash
curl -X GET "https://api.polymarket.com/clob/market/12345" \
  -H "x-polymarket-key: your-api-key" \
  -H "x-polymarket-funder: your-funder-address"
```

Retrieve a paginated list of markets:
```bash
curl -X GET "https://api.polymarket.com/clob/markets?next_cursor=abc123" \
  -H "x-polymarket-key: your-api-key" \
  -H "x-polymarket-funder: your-funder-address"
```

### TypeScript Examples
Using the PolymarketSDK to get a single market:
```typescript
const market = await polymarketSDK.getMarket("12345");
```

Using the PolymarketSDK to get a paginated list of markets:
```typescript
const markets = await polymarketSDK.getMarkets("abc123");
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L360-L376)
- [clob.ts](file://src/routes/clob.ts#L770-L822)