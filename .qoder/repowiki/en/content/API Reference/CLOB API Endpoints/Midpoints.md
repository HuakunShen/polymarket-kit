# Midpoints

<cite>
**Referenced Files in This Document**   
- [clob.ts](file://src/routes/clob.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [index.ts](file://src/sdk/index.ts)
- [midpoint_item_with_token_get_response.go](file://go-polymarket/client/clob/midpoint_item_with_token_get_response.go)
- [midpoints_post_response.go](file://go-polymarket/client/clob/midpoints_post_response.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Single Midpoint Retrieval](#single-midpoint-retrieval)
3. [Batch Midpoint Retrieval](#batch-midpoint-retrieval)
4. [Authentication Requirements](#authentication-requirements)
5. [Curl Examples](#curl-examples)
6. [TypeScript SDK Examples](#typescript-sdk-examples)
7. [Schema Reference](#schema-reference)

## Introduction
The CLOB API provides endpoints for retrieving midpoint prices, which represent the average of the best bid and best ask prices for a given token. This document details the two available endpoints: GET /clob/midpoint/:tokenId for single token midpoint retrieval and POST /clob/midpoints for batch retrieval of multiple token midpoints. The midpoint calculation provides a fair market value indicator by averaging the highest bid price and lowest ask price from the order book.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)

## Single Midpoint Retrieval
The GET /clob/midpoint/:tokenId endpoint retrieves the midpoint price for a single token specified by the tokenId path parameter. The midpoint is calculated as the average of the best bid and best ask prices from the current order book. The response contains a single number value representing the midpoint price.

The tokenId parameter in the path must be a valid CLOB token ID. The endpoint returns a JSON response with a "midpoint" field containing the calculated midpoint value as a number. This endpoint is ideal for applications that need to retrieve the fair market price for a specific token in real-time.

```mermaid
flowchart TD
A[Client Request] --> B{GET /clob/midpoint/:tokenId}
B --> C[Extract tokenId from path]
C --> D[Retrieve order book]
D --> E[Calculate midpoint = (best_bid + best_ask) / 2]
E --> F[Return {midpoint: value}]
F --> G[Client Response]
```

**Diagram sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)
- [midpoint_item_with_token_get_response.go](file://go-polymarket/client/clob/midpoint_item_with_token_get_response.go#L0-L83)

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)
- [midpoint_item_with_token_get_response.go](file://go-polymarket/client/clob/midpoint_item_with_token_get_response.go#L0-L83)

## Batch Midpoint Retrieval
The POST /clob/midpoints endpoint allows for the retrieval of midpoint prices for multiple tokens in a single request. The request body should contain an array of objects, each with a token_id field specifying the token for which to calculate the midpoint. The response contains an array of numbers representing the midpoint prices in the same order as the requested tokens.

Although the underlying API schema requires a side parameter (due to shared schema with other endpoints), this parameter is ignored for midpoint calculations since the midpoint is independent of trade direction. The SDK automatically sets a default side value (BUY) to satisfy the schema requirements while ensuring it does not affect the midpoint calculation.

```mermaid
flowchart TD
A[Client Request] --> B{POST /clob/midpoints}
B --> C[Parse request body]
C --> D[For each token_id in array]
D --> E[Retrieve order book]
E --> F[Calculate midpoint = (best_bid + best_ask) / 2]
F --> G[Store result]
G --> H{More tokens?}
H --> |Yes| D
H --> |No| I[Return {midpoints: [values]}]
I --> J[Client Response]
```

**Diagram sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)
- [midpoints_post_response.go](file://go-polymarket/client/clob/midpoints_post_response.go#L0-L89)

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)
- [midpoints_post_response.go](file://go-polymarket/client/clob/midpoints_post_response.go#L0-L89)

## Authentication Requirements
Both midpoint endpoints require authentication using the x-polymarket-key and x-polymarket-funder headers. The x-polymarket-key header contains the Polymarket private key for CLOB authentication, while the x-polymarket-funder header contains the funder address for CLOB operations.

In production environments, these headers are required for all requests. During development, the system provides a fallback mechanism that reads credentials from environment variables (POLYMARKET_KEY and POLYMARKET_FUNDER) if the headers are not present. This allows for easier testing and development without requiring header injection in every request.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)

## Curl Examples
The following curl examples demonstrate how to use both midpoint endpoints:

**Single midpoint retrieval:**
```bash
curl -X GET "https://api.polymarket.com/clob/midpoint/12345" \
  -H "x-polymarket-key: your_private_key" \
  -H "x-polymarket-funder: your_funder_address"
```

**Batch midpoint retrieval:**
```bash
curl -X POST "https://api.polymarket.com/clob/midpoints" \
  -H "x-polymarket-key: your_private_key" \
  -H "x-polymarket-funder: your_funder_address" \
  -H "Content-Type: application/json" \
  -d '[
    {"token_id": "12345"},
    {"token_id": "67890"},
    {"token_id": "54321"}
  ]'
```

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L0-L799)

## TypeScript SDK Examples
The Polymarket SDK provides convenient methods for accessing midpoint data with proper typing:

**Single midpoint retrieval:**
```typescript
import { PolymarketSDK } from "@polymarket/sdk";

const sdk = new PolymarketSDK({
  privateKey: "your_private_key",
  funderAddress: "your_funder_address"
});

// Get midpoint for a single token
const midpoint = await sdk.getMidpoint("12345");
console.log(midpoint); // Output: 0.75
```

**Batch midpoint retrieval:**
```typescript
// Get midpoints for multiple tokens
const midpoints = await sdk.getMidpoints([
  { token_id: "12345" },
  { token_id: "67890" },
  { token_id: "54321" }
]);
console.log(midpoints); // Output: [0.75, 0.85, 0.65]
```

The SDK automatically handles the quirk of the required but ignored side parameter in the batch request by setting a default value internally, allowing developers to focus on the token IDs without worrying about unnecessary parameters.

**Section sources**
- [index.ts](file://src/sdk/index.ts#L0-L13)
- [clob.ts](file://src/routes/clob.ts#L0-L799)

## Schema Reference
The midpoint endpoints use specific schemas for request validation and response typing:

**TokenParamsSchema** (used in batch requests):
```typescript
t.Object({
  token_id: t.String(),
})
```

This schema defines the structure for the request body in the POST /clob/midpoints endpoint, requiring only the token_id field. Although the underlying implementation uses a schema that includes a side parameter, the TokenParamsSchema used by the endpoint validation only requires token_id, reflecting the actual requirements for midpoint calculations.

The response schemas are automatically generated from the Go client and define:
- Single response: Contains a "midpoint" field of type number
- Batch response: Contains a "midpoints" field of type array of numbers

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L0-L799)
- [clob.ts](file://src/routes/clob.ts#L0-L799)