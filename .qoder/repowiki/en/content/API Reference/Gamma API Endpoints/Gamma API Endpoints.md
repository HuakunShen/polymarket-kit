# Gamma API Endpoints

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication and Security](#authentication-and-security)
3. [Rate Limiting](#rate-limiting)
4. [Error Response Structures](#error-response-structures)
5. [Proxy Support](#proxy-support)
6. [Versioning Strategy](#versioning-strategy)
7. [Performance Tips](#performance-tips)
8. [Endpoint Reference](#endpoint-reference)
   - [Sports API](#sports-api)
   - [Tags API](#tags-api)
   - [Events API](#events-api)
   - [Markets API](#markets-api)
   - [Series API](#series-api)
   - [Comments API](#comments-api)
   - [Search API](#search-api)
9. [Request Validation](#request-validation)
10. [SDK Integration](#sdk-integration)

## Introduction
The Gamma API provides comprehensive access to Polymarket's prediction market data, including events, markets, tags, series, comments, and search functionality. This API is designed for developers building applications that require real-time market data, historical analysis, or social features. All endpoints are accessible without authentication and are served through the polymarket-kit server, which acts as a proxy to the Gamma API backend.

The API follows RESTful principles with predictable URL patterns, standard HTTP methods, and JSON responses. Endpoints are organized by resource type with consistent query parameter patterns for filtering, sorting, and pagination. The API supports both ID-based and slug-based lookups for improved developer experience.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## Authentication and Security
The Gamma API does not require any authentication for access. All endpoints are publicly available and do not require API keys, tokens, or other credentials. This design enables easy integration for developers building public-facing applications, analytics tools, or educational resources.

The API endpoints are read-only, providing access to market data without exposing any write operations that could affect the underlying system. This security model ensures that consumers can retrieve data without the risks associated with authenticated access.

All API traffic should be conducted over HTTPS to ensure data integrity and confidentiality in transit. The polymarket-kit server enforces HTTPS connections and does not support HTTP for production use.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L50-L60)

## Rate Limiting
The Gamma API implements rate limiting to ensure fair usage and maintain service stability for all consumers. While specific rate limits are not exposed in the codebase, best practices should be followed to avoid service disruption:

- Implement exponential backoff in client applications when receiving 429 (Too Many Requests) responses
- Cache responses locally when possible to reduce redundant requests
- Use pagination to retrieve large datasets in manageable chunks
- Space out requests for bulk data retrieval rather than making them in rapid succession

The polymarket-kit server may enforce additional rate limiting beyond the upstream Gamma API to protect against abuse. Developers should monitor their application's request patterns and adjust accordingly based on observed behavior.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## Error Response Structures
The Gamma API returns standardized error responses for failed requests. Two primary error response formats are used across different endpoints:

### 4xx Client Errors
For validation failures and resource not found errors, the API returns a simple error structure:
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

### 5xx Server Errors and General Errors
For server errors and general error conditions, the API returns a more detailed structure:
```json
{
  "error": "string",
  "message": "string",
  "details": "string (optional)"
}
```

Common HTTP status codes and their meanings:
- **400 Bad Request**: Invalid query parameters or malformed request
- **404 Not Found**: Requested resource (by ID or slug) does not exist
- **500 Internal Server Error**: Server-side error processing the request

Error responses are consistent across all endpoint groups, making error handling predictable for client applications.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L380-L395)
- [gamma.ts](file://src/routes/gamma.ts#L150-L160)

## Proxy Support
The polymarket-kit server supports proxy configuration through the `x-http-proxy` header, enabling access in environments with network restrictions. This feature allows clients to route API requests through an intermediate proxy server.

### Proxy Header Format
The `x-http-proxy` header accepts standard URL formats:
- `http://proxy.com:8080`
- `http://user:pass@proxy.com:8080`
- `https://proxy.com:3128`

### Implementation Details
When the `x-http-proxy` header is present, the server parses the proxy URL and configures the underlying HTTP client to route requests through the specified proxy. The proxy configuration supports:
- HTTP and HTTPS protocols
- Basic authentication (username and password)
- Custom ports

If the proxy URL format is invalid, the request proceeds without proxying, and a warning is logged. This fail-open behavior ensures that requests are not blocked due to proxy configuration errors.

```bash
curl -H "x-http-proxy: http://user:pass@proxy.com:8080" \
  "https://your-server/gamma/events?limit=10"
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L55-L100)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L70-L90)

## Versioning Strategy
The Gamma API follows a backward compatibility approach rather than explicit versioning in the URL path. The API prefix `/gamma` serves as the stable entry point for all endpoints.

### Backward Compatibility Principles
- Existing endpoints and response schemas are maintained across updates
- New fields may be added to responses without incrementing version
- Query parameters are extended with new options rather than changing existing ones
- Deprecation of endpoints is done gradually with advance notice

This approach minimizes breaking changes for existing integrations while allowing the API to evolve with new features and data points. Developers should design their applications to be resilient to new fields in responses and optional query parameters.

The polymarket-kit server acts as a stable interface to the upstream Gamma API, potentially absorbing changes in the backend API and maintaining a consistent interface for clients.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## Performance Tips
Optimizing API usage is crucial for building responsive applications and minimizing server load. The following best practices are recommended:

### Pagination Best Practices
Use the paginated endpoints when retrieving large datasets:
- Set appropriate `limit` values (10-100) based on your use case
- Use `offset` for simple pagination or cursor-based approaches when available
- Only request the number of records you need to display initially

### Caching Implications
The API responses are suitable for caching:
- GET requests are idempotent and can be cached client-side
- Consider implementing local caching with TTL based on data volatility
- Use ETag or Last-Modified headers if available for conditional requests

### Efficient Data Retrieval
- Use specific endpoints (by ID or slug) when you know the resource identifier
- Filter results server-side using query parameters rather than retrieving all data and filtering client-side
- Use the `/markdown` endpoints when you need summarized event data for LLM processing

### Connection Management
- Reuse SDK instances rather than creating new ones for each request
- Consider batching related requests when possible
- Monitor response times and adjust request patterns accordingly

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## Endpoint Reference

### Sports API

#### GET /gamma/teams
Retrieve sports teams with optional filtering.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of teams to return |
| offset | number | No | Number of teams to skip for pagination |
| order | string | No | Field to order by (e.g., "name", "createdAt") |
| ascending | boolean | No | Sort order (true for ascending, false for descending) |
| league | string[] | No | Filter by league (e.g., ["NFL", "NBA"]) |
| name | string[] | No | Filter by team name |
| abbreviation | string[] | No | Filter by team abbreviation |

**Response (200)**
Array of team objects with properties: id, name, league, record, logo, abbreviation, alias, createdAt, updatedAt.

**Example Request**
```bash
curl "https://your-server/gamma/teams?limit=10&league[]=NFL"
```

**SDK Method**
[getTeams](file://src/sdk/gamma-client.ts#L500-L515)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L105-L120)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L580-L595)

### Tags API

#### GET /gamma/tags
Retrieve tags with pagination and filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of tags to return |
| offset | number | No | Number of tags to skip for pagination |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order |
| include_template | boolean | No | Include template information |
| is_carousel | boolean | No | Filter by carousel status |

**Response (200)**
Array of tag objects with properties: id, label, slug, forceShow, publishedAt, createdBy, updatedBy, createdAt, updatedAt, forceHide, isCarousel.

**Example Request**
```bash
curl "https://your-server/gamma/tags?limit=20&is_carousel=true"
```

**SDK Method**
[getTags](file://src/sdk/gamma-client.ts#L520-L535)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L125-L140)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L600-L615)

#### GET /gamma/tags/:id
Retrieve a specific tag by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_template | boolean | No | Include template information |

**Response (200)**
Tag object with the same structure as GET /gamma/tags.

**Response (404)**
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/tags/123?include_template=true"
```

**SDK Method**
[getTagById](file://src/sdk/gamma-client.ts#L540-L555)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L145-L165)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L620-L630)

#### GET /gamma/tags/slug/:slug
Retrieve a specific tag by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_template | boolean | No | Include template information |

**Response (200)**
Tag object with the same structure as GET /gamma/tags.

**Response (404)**
```json
{
  "type": "not found error",
  "error": "slug not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/tags/slug/politics"
```

**SDK Method**
[getTagBySlug](file://src/sdk/gamma-client.ts#L560-L575)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L170-L190)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L620-L630)

#### GET /gamma/tags/:id/related-tags
Retrieve related tag relationships for a specific tag ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status ("active", "closed", "all") |

**Response (200)**
Array of related tag relationship objects with properties: id, tagID, relatedTagID, rank.

**Example Request**
```bash
curl "https://your-server/gamma/tags/123/related-tags?status=active"
```

**SDK Method**
[getRelatedTagsRelationshipsByTagId](file://src/sdk/gamma-client.ts#L580-L595)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L195-L215)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L635-L645)

#### GET /gamma/tags/slug/:slug/related-tags
Retrieve related tag relationships for a specific tag slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status ("active", "closed", "all") |

**Response (200)**
Array of related tag relationship objects with the same structure as GET /gamma/tags/:id/related-tags.

**Example Request**
```bash
curl "https://your-server/gamma/tags/slug/politics/related-tags"
```

**SDK Method**
[getRelatedTagsRelationshipsByTagSlug](file://src/sdk/gamma-client.ts#L600-L615)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L220-L240)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L635-L645)

#### GET /gamma/tags/:id/related-tags/tags
Retrieve actual tag objects related to a specific tag ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status ("active", "closed", "all") |

**Response (200)**
Array of tag objects with the same structure as GET /gamma/tags.

**Example Request**
```bash
curl "https://your-server/gamma/tags/123/related-tags/tags"
```

**SDK Method**
[getTagsRelatedToTagId](file://src/sdk/gamma-client.ts#L620-L635)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L245-L265)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L600-L615)

#### GET /gamma/tags/slug/:slug/related-tags/tags
Retrieve actual tag objects related to a specific tag slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status ("active", "closed", "all") |

**Response (200)**
Array of tag objects with the same structure as GET /gamma/tags.

**Example Request**
```bash
curl "https://your-server/gamma/tags/slug/politics/related-tags/tags"
```

**SDK Method**
[getTagsRelatedToTagSlug](file://src/sdk/gamma-client.ts#L640-L655)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L270-L290)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L600-L615)

### Events API

#### GET /gamma/events
Retrieve events with comprehensive filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of events to return |
| offset | number | No | Number of events to skip for pagination |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order |
| id | number[] | No | Filter by event ID |
| slug | string[] | No | Filter by event slug |
| tag_id | number | No | Filter by tag ID |
| exclude_tag_id | number[] | No | Exclude events with specific tag IDs |
| featured | boolean | No | Filter by featured status |
| cyom | boolean | No | Filter by "Category of the Month" status |
| archived | boolean | No | Filter by archived status |
| active | boolean | No | Filter by active status |
| closed | boolean | No | Filter by closed status |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |
| recurrence | string | No | Filter by recurrence pattern |
| start_date_min | string | No | Minimum start date (ISO format) |
| start_date_max | string | No | Maximum start date (ISO format) |
| end_date_min | string | No | Minimum end date (ISO format) |
| end_date_max | string | No | Maximum end date (ISO format) |

**Response (200)**
Array of event objects with properties: id, ticker, slug, title, description, resolutionSource, startDate, creationDate, endDate, image, icon, active, closed, archived, new, featured, restricted, liquidity, volume, openInterest, createdAt, updatedAt, competitive, volume24hr, volume1wk, volume1mo, volume1yr, enableOrderBook, liquidityClob, negRisk, commentCount, markets, series, tags, cyom, showAllOutcomes, showMarketImages, enableNegRisk, automaticallyActive, seriesSlug, gmpChartMode, negRiskAugmented, pendingDeployment, deploying.

**Example Request**
```bash
curl "https://your-server/gamma/events?limit=10&featured=true&active=true"
```

**SDK Method**
[getEvents](file://src/sdk/gamma-client.ts#L660-L675)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L295-L315)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L650-L680)

#### GET /gamma/events/pagination
Retrieve events with pagination metadata.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | Yes | Maximum number of events to return |
| offset | number | Yes | Number of events to skip for pagination |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |
| recurrence | string | No | Filter by recurrence pattern |

**Response (200)**
```json
{
  "data": [...],
  "pagination": {
    "hasMore": boolean,
    "totalResults": number
  }
}
```

**Example Request**
```bash
curl "https://your-server/gamma/events/pagination?limit=10&offset=0"
```

**SDK Method**
[getEventsPaginated](file://src/sdk/gamma-client.ts#L680-L695)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L320-L340)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L685-L695)

#### GET /gamma/events/:id
Retrieve a specific event by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The event ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response (200)**
Event object with the same structure as GET /gamma/events.

**Response (404)**
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/events/123?include_chat=true"
```

**SDK Method**
[getEventById](file://src/sdk/gamma-client.ts#L700-L715)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L345-L365)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L650-L680)

#### GET /gamma/events/:id/tags
Retrieve tags associated with a specific event.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The event ID |

**Response (200)**
Array of tag objects with the same structure as GET /gamma/tags.

**Example Request**
```bash
curl "https://your-server/gamma/events/123/tags"
```

**SDK Method**
[getEventTags](file://src/sdk/gamma-client.ts#L720-L735)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L370-L385)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L600-L615)

#### GET /gamma/events/slug/:slug
Retrieve a specific event by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The event slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response (200)**
Event object with the same structure as GET /gamma/events.

**Response (404)**
```json
{
  "error": "Not Found",
  "message": "Event not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/events/slug/election-2024"
```

**SDK Method**
[getEventBySlug](file://src/sdk/gamma-client.ts#L740-L755)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L390-L410)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L650-L680)

#### GET /gamma/events/:id/markdown
Convert event data to markdown format optimized for LLM arbitrage analysis.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The event ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| verbose | number | No | Verbosity level (0=basic, 1=medium, 2=full details) |
| include_markets | boolean | No | Whether to include market details in event markdown |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response (200)**
Returns either JSON or plain text based on the Accept header:
- If Accept: application/json - returns { "markdown": "..." }
- Otherwise - returns raw markdown content as text/plain

**Response (404)**
```json
{
  "error": "Not Found",
  "message": "Event not found"
}
```

**Example Request**
```bash
curl -H "Accept: application/json" "https://your-server/gamma/events/123/markdown?verbose=2&include_markets=true"
```

**SDK Method**
No direct SDK method (uses getEventById internally)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L415-L450)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L700-L715)

#### GET /gamma/events/slug/:slug/markdown
Convert event data to markdown format optimized for LLM arbitrage analysis using slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The event slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| verbose | number | No | Verbosity level (0=basic, 1=medium, 2=full details) |
| include_markets | boolean | No | Whether to include market details in event markdown |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response (200)**
Same response format as GET /gamma/events/:id/markdown.

**Example Request**
```bash
curl "https://your-server/gamma/events/slug/election-2024/markdown?verbose=1"
```

**SDK Method**
No direct SDK method (uses getEventBySlug internally)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L455-L490)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L700-L715)

### Markets API

#### GET /gamma/markets
Retrieve markets with comprehensive filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of markets to return |
| offset | number | No | Number of markets to skip for pagination |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order |
| id | number[] | No | Filter by market ID |
| slug | string[] | No | Filter by market slug |
| tag_id | number | No | Filter by tag ID |
| closed | boolean | No | Filter by closed status |
| active | boolean | No | Filter by active status |
| archived | boolean | No | Filter by archived status |
| sports_market_types | string[] | No | Filter by sports market types |
| start_date_min | string | No | Minimum start date (ISO format) |
| start_date_max | string | No | Maximum start date (ISO format) |
| end_date_min | string | No | Minimum end date (ISO format) |
| end_date_max | string | No | Maximum end date (ISO format) |

**Response (200)**
Array of market objects with properties: id, question, conditionId, slug, liquidity, startDate, image, icon, description, active, volume, outcomes, outcomePrices, closed, new, questionID, volumeNum, liquidityNum, startDateIso, hasReviewedDates, volume24hr, volume1wk, volume1mo, volume1yr, clobTokenIds, events.

**Example Request**
```bash
curl "https://your-server/gamma/markets?limit=20&active=true"
```

**SDK Method**
[getMarkets](file://src/sdk/gamma-client.ts#L760-L775)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L495-L515)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L45-L75)

#### GET /gamma/markets/:id
Retrieve a specific market by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The market ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_tag | boolean | No | Include tag information |

**Response (200)**
Market object with the same structure as GET /gamma/markets.

**Response (404)**
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/markets/123?include_tag=true"
```

**SDK Method**
[getMarketById](file://src/sdk/gamma-client.ts#L780-L795)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L520-L540)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L45-L75)

#### GET /gamma/markets/:id/tags
Retrieve tags associated with a specific market.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The market ID |

**Response (200)**
Array of tag objects with the same structure as GET /gamma/tags.

**Example Request**
```bash
curl "https://your-server/gamma/markets/123/tags"
```

**SDK Method**
[getMarketTags](file://src/sdk/gamma-client.ts#L800-L815)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L545-L560)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L600-L615)

#### GET /gamma/markets/slug/:slug
Retrieve a specific market by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| slug | string | Yes | The market slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_tag | boolean | No | Include tag information |

**Response (200)**
Market object with the same structure as GET /gamma/markets.

**Response (404)**
```json
{
  "error": "Not Found",
  "message": "Market not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/markets/slug/trump-2024-election"
```

**SDK Method**
[getMarketBySlug](file://src/sdk/gamma-client.ts#L820-L835)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L565-L585)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L45-L75)

### Series API

#### GET /gamma/series
Retrieve series with filtering and pagination.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | Yes | Maximum number of series to return |
| offset | number | Yes | Number of series to skip for pagination |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order |
| slug | string[] | No | Filter by series slug |
| categories_ids | number[] | No | Filter by category IDs |
| categories_labels | string[] | No | Filter by category labels |
| closed | boolean | No | Filter by closed status |
| include_chat | boolean | No | Include chat information |
| recurrence | string | No | Filter by recurrence pattern |

**Response (200)**
Array of series objects with properties: id, ticker, slug, title, subtitle, seriesType, recurrence, image, icon, active, closed, archived, volume, liquidity, startDate, createdAt, updatedAt, competitive, volume24hr, pythTokenID, cgAssetName, commentCount.

**Example Request**
```bash
curl "https://your-server/gamma/series?limit=10&offset=0&closed=false"
```

**SDK Method**
[getSeries](file://src/sdk/gamma-client.ts#L840-L855)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L590-L610)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L120-L150)

#### GET /gamma/series/:id
Retrieve a specific series by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The series ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_chat | boolean | No | Include chat information |

**Response (200)**
Series object with the same structure as GET /gamma/series.

**Response (404)**
```json
{
  "error": "Not Found",
  "message": "Series not found"
}
```

**Example Request**
```bash
curl "https://your-server/gamma/series/123?include_chat=true"
```

**SDK Method**
[getSeriesById](file://src/sdk/gamma-client.ts#L860-L875)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L615-L635)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L120-L150)

### Comments API

#### GET /gamma/comments
Retrieve comments with optional filtering.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of comments to return |
| offset | number | No | Number of comments to skip for pagination |
| parent_entity_type | string | No | Filter by parent entity type (e.g., "Event", "Market") |
| parent_entity_id | number | No | Filter by parent entity ID |

**Response (200)**
Array of comment objects with standard comment properties.

**Example Request**
```bash
curl "https://your-server/gamma/comments?limit=5&parent_entity_type=Event&parent_entity_id=1"
```

**SDK Method**
[getComments](file://src/sdk/gamma-client.ts#L880-L895)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L640-L660)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L720-L725)

#### GET /gamma/comments/:id
Retrieve comments related to a specific comment ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| id | string | Yes | The comment ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of comments to return |
| offset | number | No | Number of comments to skip for pagination |

**Response (200)**
Array of comment objects with standard comment properties.

**Example Request**
```bash
curl "https://your-server/gamma/comments/123"
```

**SDK Method**
[getCommentsByCommentId](file://src/sdk/gamma-client.ts#L900-L915)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L665-L685)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L720-L725)

#### GET /gamma/comments/user_address/:userAddress
Retrieve comments made by a specific user address.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| userAddress | string | Yes | The user's wallet address |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of comments to return |
| offset | number | No | Number of comments to skip for pagination |

**Response (200)**
Array of comment objects with standard comment properties.

**Example Request**
```bash
curl "https://your-server/gamma/comments/user_address/0x123...abc?limit=10"
```

**SDK Method**
[getCommentsByUserAddress](file://src/sdk/gamma-client.ts#L920-L935)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L690-L710)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L720-L725)

### Search API

#### GET /gamma/search
Perform a comprehensive search across markets, events, and user profiles.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| q | string | Yes | Search query string |
| limit_per_type | number | No | Maximum results per type |
| events_status | string | No | Filter events by status ("active", "closed", "all") |
| markets_status | string | No | Filter markets by status ("active", "closed", "all") |
| profiles_status | string | No | Filter profiles by status |

**Response (200)**
Search response object with results organized by type (markets, events, profiles) and pagination information.

**Example Request**
```bash
curl "https://your-server/gamma/search?q=election&limit_per_type=3"
```

**SDK Method**
[search](file://src/sdk/gamma-client.ts#L940-L955)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L715-L735)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L730-L735)

## Request Validation
The Gamma API enforces request validation using Zod schemas defined in elysia-schemas.ts. All query parameters, path parameters, and request bodies are validated against these schemas before processing.

### Validation Rules
- Required parameters are enforced (e.g., limit and offset for paginated endpoints)
- Parameter types are strictly validated (string, number, boolean, array)
- Enumerated values are validated against allowed options
- String formats are validated where applicable
- Array parameters are properly parsed from comma-separated values

### Error Handling
When validation fails, the API returns a 400 Bad Request response with details about the validation error. The error response follows the standard ErrorResponseSchema format with descriptive messages about which parameter failed validation and why.

The Elysia framework handles validation automatically based on the schema definitions in the route configuration, ensuring consistent validation across all endpoints.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L100)
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## SDK Integration
The polymarket-kit includes a comprehensive TypeScript SDK (GammaSDK) that provides type-safe methods for all Gamma API endpoints. The SDK handles request construction, response parsing, and error handling, making integration easier for TypeScript/JavaScript applications.

### Key Features
- Fully typed methods with IntelliSense support
- Automatic query parameter serialization
- Built-in error handling with descriptive messages
- Proxy support through configuration
- Data transformation for consistent response formats

### Usage Example
```typescript
import { GammaSDK } from "./sdk/gamma-client";

const gamma = new GammaSDK();

// Get active events
const activeEvents = await gamma.getActiveEvents({ limit: 10 });

// Search for markets
const results = await gamma.search({
  q: "election",
  limit_per_type: 5,
  events_status: "active"
});
```

The SDK is designed to be instantiated once and reused across the application, with methods that return Promises for easy async/await usage.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L50-L100)
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)