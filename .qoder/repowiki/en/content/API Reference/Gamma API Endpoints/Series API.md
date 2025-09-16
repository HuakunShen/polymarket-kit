# Series API

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [series.go](file://go-polymarket/client/gamma/series.go)
- [series_item_series_get_response.go](file://go-polymarket/client/gamma/series_item_series_get_response.go)
- [series_item_series404_error.go](file://go-polymarket/client/gamma/series_item_series404_error.go)
- [series_item_series500_error.go](file://go-polymarket/client/gamma/series_item_series500_error.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Series Endpoints](#series-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Schema](#response-schema)
5. [Error Handling](#error-handling)
6. [Proxy Support](#proxy-support)
7. [Usage Examples](#usage-examples)
8. [Performance Tips](#performance-tips)

## Introduction
The Series API provides access to market series data from the Polymarket Gamma API. Market series group related prediction markets under common themes or topics, enabling organized exploration of related markets. This documentation covers the GET /series and /series/:id endpoints, including query parameters, response schemas, error handling, and usage examples.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L0-L725)

## Series Endpoints
The Series API provides two endpoints for retrieving series data:

### GET /series
Retrieves a list of series with filtering and pagination capabilities.

- **HTTP Method**: GET
- **URL Pattern**: `/gamma/series`
- **Authentication**: None required
- **Rate Limiting**: Standard API rate limits apply

### GET /series/:id
Retrieves a specific series by its ID.

- **HTTP Method**: GET
- **URL Pattern**: `/gamma/series/{id}`
- **Authentication**: None required
- **Rate Limiting**: Standard API rate limits apply

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L0-L725)

## Query Parameters

### SeriesQuerySchema
Parameters for filtering and paginating series results:

| Parameter | Type | Required | Default | Description |
|---------|------|----------|---------|-------------|
| limit | number | Yes | - | Number of results to return |
| offset | number | Yes | - | Number of results to skip |
| order | string | No | - | Field to order results by |
| ascending | boolean | No | - | Sort order (true for ascending) |
| slug | string[] | No | - | Filter by series slug |
| categories_ids | number[] | No | - | Filter by category IDs |
| categories_labels | string[] | No | - | Filter by category labels |
| closed | boolean | No | - | Filter by closed status |
| include_chat | boolean | No | - | Include chat-related data |
| recurrence | string | No | - | Filter by recurrence pattern |

### SeriesByIdQuerySchema
Parameters for retrieving a specific series:

| Parameter | Type | Required | Default | Description |
|---------|------|----------|---------|-------------|
| include_chat | boolean | No | - | Include chat-related data |

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L0-L1023)

## Response Schema

### SeriesSchema
The response structure for series data:

| Field | Type | Description |
|------|------|-------------|
| id | string | Unique identifier for the series |
| ticker | string | Market ticker symbol |
| slug | string | URL-friendly identifier |
| title | string | Display title |
| subtitle | string | Optional subtitle |
| seriesType | string | Type of series |
| recurrence | string | Recurrence pattern |
| image | string | URL to series image |
| icon | string | URL to series icon |
| active | boolean | Whether the series is active |
| closed | boolean | Whether the series is closed |
| archived | boolean | Whether the series is archived |
| volume | number | Trading volume |
| liquidity | number | Market liquidity |
| startDate | string | Series start date |
| createdAt | string | Creation timestamp |
| updatedAt | string | Last update timestamp |
| competitive | string | Competitive rating |
| volume24hr | number | 24-hour trading volume |
| pythTokenID | string | Pyth network token ID |
| cgAssetName | string | CoinGecko asset name |
| commentCount | number | Number of comments |

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L0-L1023)

## Error Handling
The Series API returns standard HTTP status codes with descriptive error responses.

### 200 OK
Successful response with series data in the response body.

```json
{
  "id": "123",
  "ticker": "ELECTION2024",
  "slug": "election-2024",
  "title": "2024 US Presidential Election",
  "active": true,
  "closed": false
}
```

### 404 Not Found
Returned when a specific series ID does not exist.

```json
{
  "type": "not found error",
  "error": "id not found"
}
```

### 500 Internal Server Error
Returned when an internal server error occurs.

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "details": "Additional error details"
}
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L0-L725)
- [series_item_series404_error.go](file://go-polymarket/client/gamma/series_item_series404_error.go#L0-L150)
- [series_item_series500_error.go](file://go-polymarket/client/gamma/series_item_series500_error.go#L0-L150)

## Proxy Support
The Series API supports proxy configuration via the `x-http-proxy` header.

### Proxy Header Format
```
x-http-proxy: protocol://username:password@host:port
```

### Supported Protocols
- HTTP
- HTTPS

### Example
```
x-http-proxy: https://user:pass@proxy.example.com:8080
```

When the proxy header is present, all API requests are routed through the specified proxy server. Authentication credentials can be included in the URL format.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L0-L725)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L891)

## Usage Examples

### cURL Examples

#### Get All Series
```bash
curl -X GET "https://your-proxy-server/gamma/series?limit=10&offset=0&closed=false" \
  -H "Content-Type: application/json"
```

#### Get Series by ID
```bash
curl -X GET "https://your-proxy-server/gamma/series/123?include_chat=true" \
  -H "Content-Type: application/json"
```

#### With Proxy Header
```bash
curl -X GET "https://your-proxy-server/gamma/series" \
  -H "Content-Type: application/json" \
  -H "x-http-proxy: https://user:pass@proxy.example.com:8080"
```

### TypeScript SDK Examples

#### Initialize GammaSDK
```typescript
import { GammaSDK } from "./sdk/gamma-client";

// Without proxy
const gamma = new GammaSDK();

// With proxy configuration
const gamma = new GammaSDK({
  proxy: {
    host: "proxy.example.com",
    port: 8080,
    username: "user",
    password: "pass",
    protocol: "https"
  }
});
```

#### Get All Series
```typescript
const series = await gamma.getSeries({
  limit: 10,
  offset: 0,
  closed: false,
  order: "volume24hr",
  ascending: false
});
```

#### Get Series by ID
```typescript
const series = await gamma.getSeriesById(123, {
  include_chat: true
});

if (series) {
  console.log(`Series: ${series.title}`);
  console.log(`Volume: ${series.volume24hr}`);
} else {
  console.log("Series not found");
}
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L891)

## Performance Tips

### Filtering Best Practices
- Use specific filters like `slug` or `categories_ids` to reduce result size
- Filter by `closed` status to exclude inactive series
- Use `limit` and `offset` for pagination of large result sets

### Pagination Strategy
- Start with smaller limits (10-25) for better performance
- Use offset-based pagination for sequential access
- Consider the trade-off between network requests and response size

### Caching Recommendations
- Cache series data on the client side when possible
- Use ETag or Last-Modified headers for conditional requests
- Implement local caching for frequently accessed series

### Network Optimization
- Minimize the number of concurrent requests
- Reuse SDK instances to maintain connection pooling
- Consider batch operations when retrieving multiple series

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L891)
- [gamma.ts](file://src/routes/gamma.ts#L0-L725)