# Markets API

<cite>
**Referenced Files in This Document**   
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [markets.go](file://go-polymarket/client/gamma/markets.go)
- [markets_item_markets_get_response.go](file://go-polymarket/client/gamma/markets_item_markets_get_response.go)
- [markets_slug_item_with_slug_get_response.go](file://go-polymarket/client/gamma/markets_slug_item_with_slug_get_response.go)
- [markets_item_tags.go](file://go-polymarket/client/gamma/markets_item_tags.go)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Markets Endpoints](#markets-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Schema](#response-schema)
5. [Response Codes](#response-codes)
6. [Data Transformation](#data-transformation)
7. [SDK Usage](#sdk-usage)
8. [Proxy Support](#proxy-support)
9. [Performance Tips](#performance-tips)

## Introduction
The Markets API provides access to prediction market data from Polymarket's Gamma API. This API allows retrieval of market information including pricing, volume, liquidity, outcomes, and associated metadata. The API supports filtering, pagination, and various query parameters to retrieve specific market data. This documentation covers the core markets endpoints, their parameters, response formats, and usage patterns through both direct HTTP calls and the TypeScript SDK.

## Markets Endpoints
The Gamma API provides several endpoints for retrieving market data, each serving a specific use case for accessing market information.

### GET /markets
Retrieves a list of markets with optional filtering and pagination.

**HTTP Method**: GET  
**URL**: `/markets`  
**Description**: Returns a collection of markets based on the provided query parameters. This endpoint supports filtering by various criteria including market status, date ranges, and tags.

**Example curl**:
```bash
curl "https://gamma-api.polymarket.com/markets?limit=10&active=true"
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L215-L224)

### GET /markets/:id
Retrieves a specific market by its ID.

**HTTP Method**: GET  
**URL**: `/markets/{id}`  
**Description**: Returns detailed information about a specific market identified by its numeric ID. If the market does not exist, the API returns a 404 response.

**Example curl**:
```bash
curl "https://gamma-api.polymarket.com/markets/123"
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L226-L235)

### GET /markets/slug/:slug
Retrieves a specific market by its slug.

**HTTP Method**: GET  
**URL**: `/markets/slug/{slug}`  
**Description**: Returns detailed information about a specific market identified by its URL-friendly slug. This is useful for retrieving markets using human-readable identifiers rather than numeric IDs.

**Example curl**:
```bash
curl "https://gamma-api.polymarket.com/markets/slug/trump-2024-election"
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L259-L268)

### GET /markets/:id/tags
Retrieves the tags associated with a specific market.

**HTTP Method**: GET  
**URL**: `/markets/{id}/tags`  
**Description**: Returns a list of tags that are associated with the specified market. Tags provide categorization and context for markets, helping users discover related content.

**Example curl**:
```bash
curl "https://gamma-api.polymarket.com/markets/123/tags"
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L248-L257)

## Query Parameters
The Markets API supports various query parameters for filtering, sorting, and paginating results.

### UpdatedMarketQuerySchema
Used for filtering markets in the GET /markets endpoint.

**Parameters**:
- `limit`: Maximum number of results to return
- `offset`: Number of results to skip (for pagination)
- `order`: Field to order results by
- `ascending`: Whether to sort in ascending order (true/false)
- `id`: Filter by market ID(s)
- `slug`: Filter by market slug(s)
- `tag_id`: Filter by tag ID
- `closed`: Filter by closed status (true/false)
- `active`: Filter by active status (true/false)
- `archived`: Filter by archived status (true/false)
- `sports_market_types`: Filter by sports market types
- `start_date_min`: Minimum start date
- `start_date_max`: Maximum start date
- `end_date_min`: Minimum end date
- `end_date_max`: Maximum end date

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L458-L496)

### MarketByIdQuerySchema
Used for retrieving a specific market by ID.

**Parameters**:
- `include_tag`: Whether to include tag information with the market data

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L564-L568)

## Response Schema
The Markets API returns market data in a consistent format with comprehensive information about each market.

### MarketSchema
The response schema for market endpoints includes the following fields:

**Core Properties**:
- `id`: Unique identifier for the market
- `question`: The market question
- `conditionId`: Condition identifier for the market
- `slug`: URL-friendly identifier for the market
- `liquidity`: Liquidity amount as string
- `startDate`: Market start date
- `image`: URL to market image
- `icon`: URL to market icon
- `description`: Market description
- `active`: Whether the market is active
- `volume`: Trading volume as string
- `outcomes`: Array of outcome strings
- `outcomePrices`: Array of outcome price strings
- `closed`: Whether the market is closed
- `new`: Whether the market is new
- `questionID`: Question identifier
- `volumeNum`: Numeric volume value
- `liquidityNum`: Numeric liquidity value
- `startDateIso`: ISO formatted start date
- `hasReviewedDates`: Whether dates have been reviewed
- `volume24hr`: 24-hour volume
- `volume1wk`: Weekly volume
- `volume1mo`: Monthly volume
- `volume1yr`: Yearly volume
- `clobTokenIds`: Array of CLOB token IDs
- `events`: Array of associated events

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L27-L85)
- [markets.go](file://go-polymarket/client/gamma/markets.go#L15-L115)

## Response Codes
The Markets API uses standard HTTP response codes to indicate the status of requests.

### 200 OK
Indicates a successful request. The response body contains the requested market data.

**Example Response**:
```json
{
  "id": "123",
  "question": "Will Bitcoin reach $100,000 by end of 2024?",
  "slug": "bitcoin-100k-2024",
  "active": true,
  "volume": "2500000",
  "outcomes": ["Yes", "No"],
  "outcomePrices": ["0.65", "0.35"],
  "clobTokenIds": ["12345", "67890"]
}
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L215-L268)

### 404 Not Found
Indicates that the requested resource could not be found. This occurs when requesting a market by ID or slug that does not exist.

**Example Response**:
```json
{
  "type": "not_found",
  "error": "Market not found"
}
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L231-L235)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L265-L268)

### 500 Internal Server Error
Indicates a server-side error occurred while processing the request.

**Example Response**:
```json
{
  "type": "internal_error",
  "error": "Internal server error"
}
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L215-L268)

## Data Transformation
The SDK performs data transformation on specific JSON string fields to ensure proper array formatting.

### JSON String Fields
The following fields are stored as JSON strings in the API response but are transformed to arrays in the SDK:

- `outcomes`: Transformed from JSON string to string array
- `outcomePrices`: Transformed from JSON string to string array
- `clobTokenIds`: Transformed from JSON string to string array

The transformation is handled automatically by the `transformMarketData` method in the SDK, which parses these JSON string fields into proper arrays for easier consumption by applications.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L195-L213)

## SDK Usage
The GammaSDK provides a convenient TypeScript interface for accessing the Markets API endpoints.

### TypeScript SDK Examples

#### Get Markets
```typescript
const markets = await gamma.getMarkets({ 
  limit: 20, 
  active: true 
});
```

#### Get Market by ID
```typescript
const market = await gamma.getMarketById(123, { 
  include_tag: true 
});
```

#### Get Market by Slug
```typescript
const market = await gamma.getMarketBySlug("trump-2024-election");
```

#### Get Market Tags
```typescript
const tags = await gamma.getMarketTags(123);
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L215-L268)

## Proxy Support
The SDK supports HTTP/HTTPS proxy configuration through the `x-http-proxy` header.

### Configuration
Proxy settings can be configured when initializing the GammaSDK:

```typescript
const gamma = new GammaSDK({
  proxy: {
    host: "proxy.example.com",
    port: 8080,
    username: "user",
    password: "pass",
    protocol: "http"
  }
});
```

The proxy configuration is used to route API requests through the specified proxy server, which can be useful for environments with restricted network access.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L45-L95)

## Performance Tips
Optimize API usage with these performance recommendations.

### Filtering
Use specific filter parameters to reduce response size and improve performance:
- Use `active`, `closed`, or `archived` filters to limit results to relevant markets
- Apply date range filters (`start_date_min`, `start_date_max`) to focus on specific time periods
- Use `tag_id` to retrieve markets within specific categories

### Pagination
Implement pagination for large result sets:
- Use `limit` and `offset` parameters to control result size
- For sequential browsing, increment the offset value
- Consider the performance impact of large offsets on database queries

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L458-L496)