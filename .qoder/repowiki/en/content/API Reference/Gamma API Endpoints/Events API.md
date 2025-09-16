# Events API

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [events.go](file://go-polymarket/client/gamma/events.go)
- [events_item_events_get_response.go](file://go-polymarket/client/gamma/events_item_events_get_response.go)
- [events_pagination_get_response.go](file://go-polymarket/client/gamma/events_pagination_get_response.go)
- [events_slug_item_with_slug_get_response.go](file://go-polymarket/client/gamma/events_slug_item_with_slug_get_response.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Events Endpoints](#events-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Schema](#response-schema)
5. [Response Codes](#response-codes)
6. [Markdown Endpoints](#markdown-endpoints)
7. [Proxy Support](#proxy-support)
8. [Error Handling](#error-handling)
9. [Performance Tips](#performance-tips)
10. [Usage Examples](#usage-examples)

## Introduction
The Events API provides comprehensive access to event data within the Polymarket ecosystem. Events represent collections of related markets that share a common theme, topic, or timeframe (e.g., "2024 US Presidential Election"). This API enables retrieval of events with various filtering, sorting, and pagination options, as well as access to associated tags and markdown-formatted content for LLM analysis.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

## Events Endpoints
The Events API provides several endpoints for retrieving event data with different response formats and capabilities.

### GET /events
Retrieves a list of events with comprehensive filtering options.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events`
- **Response**: Array of Event objects

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L279-L291)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L505-L520)

### GET /events/pagination
Retrieves a paginated list of events with metadata about the total results and whether more results are available.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/pagination`
- **Response**: Object containing `data` array and `pagination` metadata

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L293-L311)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L522-L540)

### GET /events/:id
Retrieves a specific event by its ID.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/{id}`
- **Response**: Single Event object or 404 if not found

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L313-L333)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L542-L558)

### GET /events/slug/:slug
Retrieves a specific event by its slug.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/slug/{slug}`
- **Response**: Single Event object or 404 if not found

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L366-L386)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L590-L606)

### GET /events/:id/tags
Retrieves tags associated with a specific event.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/{id}/tags`
- **Response**: Array of Tag objects

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L348-L364)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L578-L588)

### GET /events/:id/markdown
Converts event data to markdown format optimized for LLM arbitrage analysis.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/{id}/markdown`
- **Response**: Markdown content in JSON or plain text format based on Accept header

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L388-L434)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L505-L520)

### GET /events/slug/:slug/markdown
Converts event data to markdown format optimized for LLM arbitrage analysis, accessed by slug.

**Endpoint Details**
- **HTTP Method**: GET
- **URL Pattern**: `/gamma/events/slug/{slug}/markdown`
- **Response**: Markdown content in JSON or plain text format based on Accept header

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L436-L482)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L505-L520)

## Query Parameters
The Events API supports various query parameters for filtering, sorting, and pagination.

### UpdatedEventQuerySchema
Used by GET /events endpoint for filtering events.

**Parameters**
- `limit`: Number of results to return
- `offset`: Starting position for results
- `order`: Field to order by
- `ascending`: Sort order (true for ascending, false for descending)
- `id`: Filter by event ID(s)
- `slug`: Filter by event slug(s)
- `tag_id`: Filter by tag ID
- `exclude_tag_id`: Exclude events with specific tag IDs
- `featured`: Filter by featured status
- `cyom`: Filter by "Category of the Month" status
- `archived`: Filter by archived status
- `active`: Filter by active status
- `closed`: Filter by closed status
- `include_chat`: Include chat-related data
- `include_template`: Include template data
- `recurrence`: Filter by recurrence pattern
- `start_date_min`: Minimum start date
- `start_date_max`: Maximum start date
- `end_date_min`: Minimum end date
- `end_date_max`: Maximum end date

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L649-L696)

### PaginatedEventQuerySchema
Used by GET /events/pagination endpoint for paginated results.

**Parameters**
- `limit`: Number of results per page
- `offset`: Starting position for results
- `order`: Field to order by
- `ascending`: Sort order
- `include_chat`: Include chat-related data
- `include_template`: Include template data
- `recurrence`: Filter by recurrence pattern

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L725-L740)

### EventByIdQuerySchema
Used by GET /events/:id and GET /events/slug/:slug endpoints.

**Parameters**
- `include_chat`: Include chat-related data
- `include_template`: Include template data

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L757-L764)

## Response Schema
The Events API returns event data in a consistent schema format.

### EventSchema
Represents the structure of an event object.

**Properties**
- `id`: Unique identifier
- `ticker`: Event ticker symbol
- `slug`: URL-friendly identifier
- `title`: Event title
- `description`: Event description
- `resolutionSource`: Source for resolution information
- `startDate`: Event start date
- `creationDate`: Date when event was created
- `endDate`: Event end date
- `image`: URL to event image
- `icon`: URL to event icon
- `active`: Active status
- `closed`: Closed status
- `archived`: Archived status
- `featured`: Featured status
- `liquidity`: Liquidity value
- `volume`: Trading volume
- `openInterest`: Open interest
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `competitive`: Competitiveness score
- `volume24hr`: 24-hour volume
- `volume1wk`: 1-week volume
- `volume1mo`: 1-month volume
- `volume1yr`: 1-year volume
- `enableOrderBook`: Whether order book is enabled
- `liquidityClob`: CLOB liquidity
- `negRisk`: Negative risk status
- `commentCount`: Number of comments
- `markets`: Array of associated markets
- `series`: Array of associated series
- `tags`: Array of associated tags
- `cyom`: "Category of the Month" status
- `showAllOutcomes`: Whether to show all outcomes
- `showMarketImages`: Whether to show market images
- `enableNegRisk`: Enable negative risk
- `automaticallyActive`: Automatically active status
- `seriesSlug`: Series slug
- `gmpChartMode`: Chart mode
- `negRiskAugmented`: Augmented negative risk status
- `pendingDeployment`: Pending deployment status
- `deploying`: Deploying status

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L279-L358)
- [events.go](file://go-polymarket/client/gamma/events.go#L1-L1367)

## Response Codes
The Events API uses standard HTTP response codes to indicate success or failure.

### 200 OK
Indicates a successful request. The response body contains the requested data.

**Examples**
- GET /events: Array of event objects
- GET /events/:id: Single event object
- GET /events/:id/markdown: Markdown content

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L285-L288)
- [gamma.ts](file://src/routes/gamma.ts#L300-L303)
- [gamma.ts](file://src/routes/gamma.ts#L322-L325)

### 404 Not Found
Indicates that the requested resource could not be found.

**Examples**
- GET /events/:id when the event ID does not exist
- GET /events/slug/:slug when the event slug does not exist

**Response Format**
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L318-L320)
- [gamma.ts](file://src/routes/gamma.ts#L373-L375)

### 500 Internal Server Error
Indicates that an error occurred on the server while processing the request.

**Response Format**
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L288)
- [gamma.ts](file://src/routes/gamma.ts#L303)

## Markdown Endpoints
The markdown endpoints convert event data to markdown format optimized for LLM analysis.

### Response Format
The markdown endpoints support dual response formats based on the Accept header:

- **Accept: application/json**: Returns JSON with markdown content
- **Other Accept headers**: Returns plain text markdown

**JSON Response**
```json
{
  "markdown": "Formatted markdown content"
}
```

**Plain Text Response**
```
Formatted markdown content
```

### Query Parameters
The markdown endpoints support additional parameters for controlling the output:

- `verbose`: Verbosity level (0=basic, 1=medium, 2=full details)
- `include_markets`: Whether to include market details in the markdown

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L388-L482)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L766-L781)

## Proxy Support
The Events API supports proxy configuration via the `x-http-proxy` header.

### Configuration
The proxy header should contain a valid URL in one of these formats:
- `http://proxy.com:8080`
- `http://user:pass@proxy.com:8080`
- `https://proxy.com:3128`

### Implementation
When the `x-http-proxy` header is present, the API routes use it to configure the underlying HTTP client for all requests to the Gamma API.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L30-L77)

## Error Handling
The Events API implements consistent error handling patterns across all endpoints.

### Client-Side Error Handling
The GammaSDK handles errors by:
- Returning `null` for 404 responses on single resource endpoints
- Throwing errors for 500 responses and network failures
- Transforming response data to ensure consistent schema

### Server-Side Error Handling
The API routes handle errors by:
- Setting appropriate HTTP status codes
- Returning structured error responses
- Logging warnings for proxy configuration issues

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L185-L200)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L542-L558)
- [gamma.ts](file://src/routes/gamma.ts#L318-L320)

## Performance Tips
Optimize your usage of the Events API with these performance recommendations.

### Pagination
Use the `/events/pagination` endpoint instead of `/events` when you need to implement pagination in your application. This endpoint provides metadata about the total number of results and whether more results are available.

### Filtering
Apply filters at the API level rather than retrieving all data and filtering client-side. Use query parameters like `tag_id`, `active`, and date ranges to reduce the amount of data transferred.

### Caching
Implement client-side caching for frequently accessed events, especially when using the markdown endpoints for LLM analysis.

### Batch Requests
When you need data for multiple events, consider making parallel requests rather than sequential ones to reduce overall latency.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L293-L311)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L522-L540)

## Usage Examples
Practical examples of using the Events API with curl and TypeScript.

### curl Examples

**Get all events**
```bash
curl "https://your-server.com/gamma/events"
```

**Get events with filtering**
```bash
curl "https://your-server.com/gamma/events?limit=10&featured=true&active=true"
```

**Get paginated events**
```bash
curl "https://your-server.com/gamma/events/pagination?limit=20&offset=0&order=volume&ascending=false"
```

**Get event by ID**
```bash
curl "https://your-server.com/gamma/events/123"
```

**Get event by slug**
```bash
curl "https://your-server.com/gamma/events/slug/election-2024"
```

**Get event tags**
```bash
curl "https://your-server.com/gamma/events/123/tags"
```

**Get event markdown (JSON response)**
```bash
curl "https://your-server.com/gamma/events/123/markdown?verbose=2&include_markets=true" \
  -H "Accept: application/json"
```

**Get event markdown (plain text)**
```bash
curl "https://your-server.com/gamma/events/123/markdown?verbose=2"
```

**Get event markdown by slug**
```bash
curl "https://your-server.com/gamma/events/slug/election-2024/markdown" \
  -H "Accept: application/json"
```

**With proxy support**
```bash
curl "https://your-server.com/gamma/events" \
  -H "x-http-proxy: http://proxy.com:8080"
```

### TypeScript SDK Examples

**Initialize GammaSDK**
```typescript
import { GammaSDK } from "./sdk/gamma-client";

// Without proxy
const gamma = new GammaSDK();

// With proxy
const gamma = new GammaSDK({
  proxy: {
    protocol: "http",
    host: "proxy.com",
    port: 8080,
    username: "user",
    password: "pass"
  }
});
```

**Get events**
```typescript
// Get all events
const events = await gamma.getEvents({
  limit: 10,
  featured: true,
  active: true
});

// Get paginated events
const paginatedEvents = await gamma.getEventsPaginated({
  limit: 20,
  offset: 0,
  order: "volume",
  ascending: false
});
```

**Get specific events**
```typescript
// Get event by ID
const event = await gamma.getEventById(123, {
  include_chat: true
});

// Get event by slug
const event = await gamma.getEventBySlug("election-2024", {
  include_template: true
});
```

**Get event tags**
```typescript
// Get tags for an event
const tags = await gamma.getEventTags(123);
```

**Error handling**
```typescript
try {
  const event = await gamma.getEventById(999999);
  if (event === null) {
    console.log("Event not found");
  } else {
    console.log("Event:", event);
  }
} catch (error) {
  console.error("API error:", error);
}
```

**Markdown formatting**
```typescript
// The markdown formatting is handled automatically by the API
// when using the /markdown endpoints, but you can also use
// the utility function directly if needed

import { formatEventToMarkdown } from "../utils/markdown-formatters";

const markdown = formatEventToMarkdown(event, {
  verbose: 2,
  includeMarkets: true
});
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L505-L606)
- [gamma.ts](file://src/routes/gamma.ts#L388-L482)
- [markdown-formatters.ts](file://src/utils/markdown-formatters.ts)