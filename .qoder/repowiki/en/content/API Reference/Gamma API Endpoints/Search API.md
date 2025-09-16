# Search API

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [search_get_response.go](file://go-polymarket/client/gamma/search_get_response.go)
- [search_request_builder.go](file://go-polymarket/client/gamma/search_request_builder.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Endpoint Overview](#endpoint-overview)
3. [Query Parameters](#query-parameters)
4. [Response Schema](#response-schema)
5. [Response Codes](#response-codes)
6. [Search Capabilities](#search-capabilities)
7. [Usage Examples](#usage-examples)
8. [Proxy Support](#proxy-support)
9. [Error Handling](#error-handling)
10. [Search Tips](#search-tips)
11. [Performance Considerations](#performance-considerations)

## Introduction
The Search API provides a comprehensive search functionality across Polymarket's prediction markets, events, and user profiles. This endpoint acts as a proxy to the `/public-search` endpoint of the Gamma API, enabling users to discover relevant content through keyword-based queries with various filtering options.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)

## Endpoint Overview
The Search endpoint allows users to search across multiple content types within the Polymarket ecosystem. It supports various query parameters to refine search results and provides structured responses containing matches from different categories.

- **HTTP Method**: GET
- **URL Pattern**: `/gamma/search`
- **Proxied Endpoint**: `/public-search` on the Gamma API
- **Authentication**: Not required

```mermaid
sequenceDiagram
participant Client
participant Server
participant GammaAPI
Client->>Server : GET /gamma/search?q=election&limit_per_type=5
Server->>Server : Parse x-http-proxy header (if present)
Server->>GammaAPI : GET /public-search with query parameters
GammaAPI-->>Server : Return search results
Server-->>Client : Return formatted response
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)

## Query Parameters
The Search API accepts various query parameters to customize search behavior and filter results. All parameters are passed as URL query parameters.

### Required Parameters
- **q**: Search term (string) - The keyword or phrase to search for across markets, events, and profiles.

### Optional Parameters
- **limit_per_type**: Maximum number of results per type (number) - Limits results for each category (events, tags, profiles).
- **events_status**: Filter events by status (string) - Options: "active", "closed", "all".
- **events_tag**: Filter events by tag (array of strings) - Returns events associated with specified tags.
- **page**: Page number for pagination (number) - Used for navigating through result pages.
- **sort**: Sort field (string) - Field to sort results by.
- **ascending**: Sort order (boolean) - true for ascending, false for descending.
- **cache**: Cache behavior (boolean) - Whether to use cached results.

```mermaid
flowchart TD
A[Search Request] --> B{Has query parameter?}
B --> |q| C[Search Term]
B --> |limit_per_type| D[Limit Results]
B --> |events_status| E[Filter by Status]
B --> |events_tag| F[Filter by Tag]
B --> |page| G[Pagination]
B --> |sort| H[Sort Results]
B --> |ascending| I[Sort Order]
B --> |cache| J[Cache Behavior]
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L950-L970)
- [search_request_builder.go](file://go-polymarket/client/gamma/search_request_builder.go#L15-L30)

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L950-L970)
- [search_request_builder.go](file://go-polymarket/client/gamma/search_request_builder.go#L15-L30)

## Response Schema
The Search API returns a structured response containing search results organized by type, along with pagination information.

### SearchResponseSchema
```json
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "active": "boolean",
      "closed": "boolean"
    }
  ],
  "tags": [
    {
      "id": "string",
      "label": "string",
      "slug": "string"
    }
  ],
  "profiles": [
    {
      "id": "string",
      "username": "string",
      "bio": "string"
    }
  ],
  "pagination": {
    "hasMore": "boolean"
  }
}
```

The response includes:
- **events**: Array of event objects matching the search criteria
- **tags**: Array of tag objects matching the search criteria
- **profiles**: Array of user profile objects matching the search criteria
- **pagination**: Object containing pagination information

```mermaid
erDiagram
SEARCH_RESPONSE {
object events
object tags
object profiles
object pagination
}
EVENTS {
string id
string title
string description
boolean active
boolean closed
}
TAGS {
string id
string label
string slug
}
PROFILES {
string id
string username
string bio
}
PAGINATION {
boolean hasMore
}
SEARCH_RESPONSE }o--|| EVENTS : contains
SEARCH_RESPONSE }o--|| TAGS : contains
SEARCH_RESPONSE }o--|| PROFILES : contains
SEARCH_RESPONSE }o--|| PAGINATION : contains
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L972-L985)
- [search_get_response.go](file://go-polymarket/client/gamma/search_get_response.go#L10-L25)

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L972-L985)
- [search_get_response.go](file://go-polymarket/client/gamma/search_get_response.go#L10-L25)

## Response Codes
The Search API returns standard HTTP status codes to indicate the result of the request.

### 200 OK
Successful response with search results.

**Example Response:**
```json
{
  "events": [
    {
      "id": "123",
      "title": "US Presidential Election 2024",
      "description": "Prediction market for the 2024 US Presidential Election",
      "active": true,
      "closed": false
    }
  ],
  "tags": [
    {
      "id": "456",
      "label": "Politics",
      "slug": "politics"
    }
  ],
  "profiles": [],
  "pagination": {
    "hasMore": true
  }
}
```

### 500 Internal Server Error
Error occurred while processing the request.

**Error Response Schema:**
```json
{
  "error": "string",
  "message": "string",
  "details": "string"
}
```

**Example Error Response:**
```json
{
  "error": "SearchFailed",
  "message": "Failed to execute search query",
  "details": "Internal server error occurred"
}
```

```mermaid
stateDiagram-v2
[*] --> Request
Request --> 200 : Success
Request --> 500 : Server Error
200 --> [*] : Return results
500 --> [*] : Return error
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L455-L458)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L750-L765)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L455-L458)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L750-L765)

## Search Capabilities
The Search API provides comprehensive search functionality across multiple content types within the Polymarket platform.

### Markets Search
Search across all prediction markets using keywords. The search indexes market questions, descriptions, and associated metadata.

### Events Search
Search for events by title, description, or associated tags. Events are collections of related markets around a common theme.

### Profiles Search
Search for user profiles by username or bio content. This enables discovery of active participants in specific market categories.

### Cross-Content Search
The API performs unified searches across all content types simultaneously, returning consolidated results grouped by type.

```mermaid
graph TB
A[Search Query] --> B[Markets Search]
A --> C[Events Search]
A --> D[Profiles Search]
B --> E[Market Results]
C --> F[Event Results]
D --> G[Profile Results]
E --> H[Consolidated Response]
F --> H
G --> H
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)

## Usage Examples
This section provides practical examples of how to use the Search API with different tools and programming languages.

### cURL Examples
**Basic Search:**
```bash
curl "https://api.polymarket.com/gamma/search?q=election"
```

**Search with Filters:**
```bash
curl "https://api.polymarket.com/gamma/search?q=bitcoin&limit_per_type=10&events_status=active"
```

**Search with Multiple Tags:**
```bash
curl "https://api.polymarket.com/gamma/search?q=technology&events_tag[]=crypto&events_tag[]=innovation"
```

### TypeScript SDK Examples
**Basic Search:**
```typescript
import { GammaSDK } from "./sdk/gamma-client";

const gamma = new GammaSDK();
const results = await gamma.search({
  q: "election"
});
```

**Search with Parameters:**
```typescript
const results = await gamma.search({
  q: "bitcoin",
  limit_per_type: 5,
  events_status: "active",
  ascending: true
});
```

**Search with Tag Filtering:**
```typescript
const results = await gamma.search({
  q: "sports",
  events_tag: ["NFL", "basketball"],
  limit_per_type: 10
});
```

```mermaid
sequenceDiagram
participant User
participant SDK
participant API
User->>SDK : gamma.search({q : "election"})
SDK->>API : GET /public-search?q=election
API-->>SDK : Return search results
SDK-->>User : Return formatted results
```

**Diagram sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)

## Proxy Support
The Search API supports proxy configuration through the `x-http-proxy` header, allowing requests to be routed through intermediate servers.

### Proxy Header Format
The `x-http-proxy` header accepts proxy URLs in standard format:
- `http://proxy.com:8080`
- `http://user:pass@proxy.com:8080`
- `https://proxy.com:3128`

### Proxy Configuration
When the `x-http-proxy` header is present, the server parses the proxy URL and configures the HTTP client to route requests through the specified proxy server.

```mermaid
flowchart LR
A[Client] --> |x-http-proxy header| B[Server]
B --> |Parse proxy URL| C[Extract protocol, host, port, credentials]
C --> |Configure HTTP client| D[Make request through proxy]
D --> E[Gamma API]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L40-L100)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L50-L100)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L40-L100)

## Error Handling
The Search API implements comprehensive error handling to ensure reliable operation and provide meaningful feedback.

### Client-Side Error Handling
The GammaSDK provides built-in error handling for search operations:

```typescript
try {
  const results = await gamma.search({
    q: "election",
    limit_per_type: 10
  });
  console.log("Search successful:", results);
} catch (error) {
  console.error("Search failed:", error.message);
}
```

### Server-Side Error Handling
The server validates all incoming requests and handles errors appropriately:

- Invalid query parameters return 400 Bad Request
- Internal server errors return 500 Internal Server Error
- Network errors when communicating with the Gamma API are propagated

### Error Response Structure
All error responses follow a consistent format:
```json
{
  "error": "ErrorCode",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

```mermaid
flowchart TD
A[Search Request] --> B{Valid Parameters?}
B --> |Yes| C[Execute Search]
B --> |No| D[Return 400 Error]
C --> E{Search Successful?}
E --> |Yes| F[Return 200 Response]
E --> |No| G[Return 500 Error]
```

**Diagram sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L760-L770)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L750-L765)

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L760-L770)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L750-L765)

## Search Tips
To get the most effective results from the Search API, consider the following tips:

### Keyword Selection
- Use specific keywords rather than generic terms
- Include relevant context (e.g., "bitcoin price 2024" instead of just "bitcoin")
- Consider using synonyms for better coverage

### Result Filtering
- Use `limit_per_type` to control the number of results per category
- Filter events by status (`events_status`) to focus on active or closed markets
- Use `events_tag` to narrow results to specific topics

### Performance Optimization
- Use caching (`cache=true`) for frequently accessed search terms
- Implement pagination to manage large result sets
- Consider the timing of searches to avoid peak loads

### Best Practices
- Always handle potential errors in your code
- Implement rate limiting to avoid overwhelming the API
- Cache results when appropriate to reduce redundant requests

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)

## Performance Considerations
When using the Search API, consider these performance aspects to ensure optimal operation.

### Rate Limiting
The API may implement rate limiting to prevent abuse. Best practices include:
- Implement exponential backoff for retry logic
- Cache results to reduce redundant requests
- Batch similar queries when possible

### Response Size
Large result sets can impact performance. Mitigation strategies:
- Use `limit_per_type` to control result size
- Implement pagination for browsing large datasets
- Filter results on the client side when appropriate

### Latency Factors
Several factors can affect search latency:
- Network distance to the API server
- Complexity of the search query
- Current server load and traffic
- Proxy configuration (if used)

### Caching Strategy
The API supports caching through the `cache` parameter:
- Set `cache=true` for frequently accessed queries
- Set `cache=false` for real-time data requirements
- Consider implementing client-side caching for improved performance

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L750-L770)
- [gamma.ts](file://src/routes/gamma.ts#L450-L460)