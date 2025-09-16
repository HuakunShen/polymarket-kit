# Prices

<cite>
**Referenced Files in This Document**   
- [clob.ts](file://src/routes/clob.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [index.ts](file://src/sdk/index.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Single Price Retrieval (GET /clob/price/:tokenId/:side)](#single-price-retrieval-get-clobpricetokenidside)
3. [Batch Price Retrieval (POST /clob/prices)](#batch-price-retrieval-post-clobprices)
4. [Authentication Requirements](#authentication-requirements)
5. [Error Handling and Validation](#error-handling-and-validation)
6. [Examples](#examples)
7. [SDK Implementation Details](#sdk-implementation-details)

## Introduction
This document provides comprehensive API documentation for the CLOB API's price endpoints in the Polymarket system. It covers both single and batch price retrieval operations, detailing request parameters, response structures, authentication requirements, and usage examples. The endpoints enable clients to retrieve current market prices for prediction markets on the Polymarket platform, with support for both individual queries and bulk operations.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L150-L200)

## Single Price Retrieval (GET /clob/price/:tokenId/:side)
The GET `/clob/price/:tokenId/:side` endpoint retrieves the current price for a specific token ID and trading side (buy or sell).

### Path Parameters
- **tokenId**: The CLOB token ID to get price for (string, required)
- **side**: The side to get price for, either "buy" or "sell" (string, required)

### Request Example
```bash
GET /clob/price/70053586508884407034746548832843494840339625160858317381494925241649091892948/buy
```

### Response Structure
The response is a simple JSON object containing the price:
```json
{
  "price": 0.45
}
```

The `price` field is a number representing the current market price for the specified token and side.

### Validation Rules
- tokenId must be a non-empty string
- side must be either "buy" or "sell" (case-sensitive)
- Invalid side values will result in a 400 Bad Request response

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L150-L170)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L320-L325)

## Batch Price Retrieval (POST /clob/prices)
The POST `/clob/prices` endpoint retrieves prices for multiple token IDs and sides in a single request.

### Request Body
The request body must be a JSON array of objects, each conforming to the BookParamsSchema:

```json
[
  {
    "token_id": "70053586508884407034746548832843494840339625160858317381494925241649091892948",
    "side": "BUY"
  },
  {
    "token_id": "80053586508884407034746548832843494840339625160858317381494925241649091892948",
    "side": "SELL"
  }
]
```

### BookParamsSchema
The BookParamsSchema defines the structure of each item in the request array:
- **token_id**: The CLOB token ID (string, required)
- **side**: The trading side, either "BUY" or "SELL" (string, required, uppercase)

### Response Structure
The response is a JSON object containing an array of prices:
```json
{
  "prices": [0.45, 0.52]
}
```

The `prices` array contains numbers representing the current market prices for each requested token_id and side combination, in the same order as the request.

### Validation Rules
- Request body must be a valid JSON array
- Each array item must have both token_id and side fields
- token_id must be a non-empty string
- side must be either "BUY" or "SELL" (case-sensitive, uppercase)
- Invalid request body format will result in a 400 Bad Request response

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L172-L190)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L315-L320)

## Authentication Requirements
Both price endpoints require authentication via HTTP headers.

### Required Headers
- **x-polymarket-key**: Polymarket private key for CLOB authentication
- **x-polymarket-funder**: Polymarket funder address for CLOB operations

### Environment Behavior
- **Production**: Both headers are required
- **Development**: Headers are optional; the system falls back to environment variables (POLYMARKET_KEY and POLYMARKET_FUNDER) if headers are not provided

### Error Responses
- Missing required headers in production will result in a 400 Bad Request response
- Invalid or unauthorized credentials will result in appropriate error responses from the CLOB service

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L25-L50)

## Error Handling and Validation
The price endpoints implement comprehensive error handling and validation.

### HTTP Status Codes
- **200 OK**: Successful request with price data
- **400 Bad Request**: Invalid request parameters or body
- **500 Internal Server Error**: Server-side error during price retrieval

### Error Response Structure
For 400 and 500 responses, the API returns a standardized error object:
```json
{
  "error": "ValidationError",
  "message": "Invalid side parameter: must be 'buy' or 'sell'",
  "details": "side parameter was 'Buy' but must be lowercase"
}
```

### Validation Rules
For GET /clob/price/:tokenId/:side:
- tokenId path parameter cannot be empty
- side path parameter must be exactly "buy" or "sell" (lowercase)
- Invalid path parameters result in 400 responses

For POST /clob/prices:
- Request body must be valid JSON
- Body must be an array
- Each array item must have token_id and side properties
- token_id must be a non-empty string
- side must be "BUY" or "SELL" (uppercase)
- Validation failures result in 400 responses

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L150-L190)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L240-L250)

## Examples
### cURL Examples
**Single Price Retrieval:**
```bash
curl -X GET "https://api.polymarket.com/clob/price/70053586508884407034746548832843494840339625160858317381494925241649091892948/buy" \
  -H "x-polymarket-key: your-private-key" \
  -H "x-polymarket-funder: your-funder-address"
```

**Batch Price Retrieval:**
```bash
curl -X POST "https://api.polymarket.com/clob/prices" \
  -H "x-polymarket-key: your-private-key" \
  -H "x-polymarket-funder: your-funder-address" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "token_id": "70053586508884407034746548832843494840339625160858317381494925241649091892948",
      "side": "BUY"
    },
    {
      "token_id": "80053586508884407034746548832843494840339625160858317381494925241649091892948",
      "side": "SELL"
    }
  ]'
```

### TypeScript Examples
**Using PolymarketSDK:**

```typescript
import { PolymarketSDK } from "./sdk";

const sdk = new PolymarketSDK({
  privateKey: process.env.POLYMARKET_KEY,
  funderAddress: process.env.POLYMARKET_FUNDER,
});

// Single price retrieval
try {
  const price = await sdk.getPrice(
    "70053586508884407034746548832843494840339625160858317381494925241649091892948",
    "buy"
  );
  console.log(`Buy price: ${price}`);
} catch (error) {
  console.error("Error fetching price:", error);
}

// Batch price retrieval
try {
  const prices = await sdk.getPrices([
    {
      token_id: "70053586508884407034746548832843494840339625160858317381494925241649091892948",
      side: "BUY"
    },
    {
      token_id: "80053586508884407034746548832843494840339625160858317381494925241649091892948",
      side: "SELL"
    }
  ]);
  console.log("Prices:", prices);
} catch (error) {
  console.error("Error fetching prices:", error);
}
```

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L150-L190)
- [index.ts](file://src/sdk/index.ts#L10-L14)
- [dev.ts](file://src/dev.ts#L1-L15)

## SDK Implementation Details
The PolymarketSDK provides a convenient interface for interacting with the price endpoints, handling parameter transformation and request formatting.

### BookParamsSchema Reference
The BookParamsSchema from elysia-schemas.ts defines the structure for batch price requests:
```typescript
export const BookParamsSchema = t.Object({
  token_id: t.String(),
  side: t.UnionEnum(["BUY", "SELL"]),
});
```

### Side Parameter Transformation
The SDK handles transformation between string values and enum values for the side parameter:
- In the API routes, the side parameter is received as a string ("buy"/"sell" for GET, "BUY"/"SELL" for POST)
- The SDK converts these string values to the appropriate Side enum values from @polymarket/clob-client
- For batch operations, the route transforms "BUY"/"SELL" strings to Side.BUY/Side.SELL enum values before calling the SDK

### Internal Processing
1. The clob.ts route receives the request and validates parameters using Elysia schemas
2. Authentication headers are processed, with development fallback to environment variables
3. For POST /clob/prices, the request body is transformed from string-based side values to enum values
4. The PolymarketSDK method is called with the processed parameters
5. The response is formatted according to the expected response schema

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L150-L190)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L315-L320)
- [index.ts](file://src/sdk/index.ts#L10-L14)