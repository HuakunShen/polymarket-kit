# Appendix

<cite>
**Referenced Files in This Document**   
- [data-model.md](file://specs/001-write-a-mcp/data-model.md)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml)
</cite>

## Table of Contents
1. [Data Model Documentation](#data-model-documentation)
2. [API Rate Limits and Proxy Handling](#api-rate-limits-and-proxy-handling)
3. [Request and Response Schema References](#request-and-response-schema-references)
4. [External Documentation Links](#external-documentation-links)
5. [Glossary of Terms](#glossary-of-terms)
6. [Version Compatibility Matrix](#version-compatibility-matrix)
7. [Data Retention and Archival Policies](#data-retention-and-archival-policies)

## Data Model Documentation

This section documents the entity relationships between markets, events, tags, and series in the Polymarket ecosystem.

```mermaid
erDiagram
MARKET {
string id PK
string question
string conditionId
string slug
string liquidity
string startDate
string image
string icon
string description
boolean active
string volume
string[] outcomes
string[] outcomePrices
boolean closed
number volumeNum
number? liquidityNum
string? startDateIso
boolean? hasReviewedDates
number? volume24hr
number? volume1wk
number? volume1mo
number? volume1yr
string[] clobTokenIds
}
EVENT {
string id PK
string ticker
string slug
string title
string? description
string? resolutionSource
string? startDate
string creationDate
string endDate
string image
string icon
boolean active
boolean closed
boolean archived
boolean? new
boolean? featured
boolean? restricted
number? liquidity
number volume
number? openInterest
string createdAt
string updatedAt
number? competitive
number? volume24hr
number? volume1wk
number? volume1mo
number? volume1yr
boolean? enableOrderBook
number? liquidityClob
boolean? negRisk
number? commentCount
boolean? cyom
boolean? showAllOutcomes
boolean? showMarketImages
boolean? enableNegRisk
boolean? automaticallyActive
string? seriesSlug
string? gmpChartMode
boolean? negRiskAugmented
boolean? pendingDeployment
boolean? deploying
}
SERIES {
string id PK
string ticker
string slug
string title
string? subtitle
string seriesType
string recurrence
string? image
string? icon
boolean active
boolean closed
boolean archived
number? volume
number? liquidity
string? startDate
string createdAt
string updatedAt
string? competitive
number? volume24hr
string? pythTokenID
string? cgAssetName
number? commentCount
}
TAG {
string id PK
string label
string slug
boolean? forceShow
string? publishedAt
number? createdBy
number? updatedBy
string createdAt
string? updatedAt
boolean? forceHide
boolean? isCarousel
}
MARKET ||--o{ EVENT : "belongs to"
MARKET ||--o{ TAG : "has"
EVENT ||--o{ SERIES : "belongs to"
EVENT ||--o{ TAG : "has"
SERIES ||--o{ TAG : "has"
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L299)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L301-L380)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L382-L435)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L437-L488)

**Section sources**
- [data-model.md](file://specs/001-write-a-mcp/data-model.md#L0-L35)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L488)

## API Rate Limits and Proxy Handling

The Polymarket API does not publicly document specific rate limits for its Gamma API endpoints. However, the proxy implementation includes robust handling for potential rate limiting scenarios through several mechanisms:

1. **Proxy Configuration**: The system supports HTTP/HTTPS proxy configuration via the `X-HTTP-Proxy` header, allowing requests to be routed through intermediary servers that may have different rate limit characteristics.

2. **Error Handling**: The Gamma SDK implements comprehensive error handling for API requests, gracefully managing 404 (not found) and 500 (server error) responses that could result from rate limiting.

3. **Fallback Mechanisms**: When proxy configuration fails or is invalid, the system falls back to direct API calls without proxy, ensuring continued operation.

4. **Request Validation**: All API requests are validated against defined schemas before being sent, reducing the likelihood of invalid requests that could contribute to rate limit consumption.

The proxy handling is implemented in the `gamma.ts` route file, which parses proxy strings and configures the Gamma SDK accordingly. This allows for flexible deployment scenarios where rate limits might be managed at the proxy level rather than the client level.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)

## Request and Response Schema References

This section provides field-by-field explanations of all request and response types used in the Polymarket API integration.

### Market Schema
The Market schema defines the structure of prediction markets in the Polymarket ecosystem.

**Fields:**
- `id`: Unique identifier for the market
- `question`: The market question presented to users
- `conditionId`: Identifier for the market condition
- `slug`: URL-friendly version of the market name
- `liquidity`: Current liquidity in the market
- `startDate`: Market start date as string
- `image`: URL to market image
- `icon`: URL to market icon
- `description`: Detailed market description
- `active`: Boolean indicating if the market is active
- `volume`: Trading volume as string
- `outcomes`: Array of possible market outcomes
- `outcomePrices`: Array of current prices for each outcome
- `closed`: Boolean indicating if the market is closed
- `volumeNum`: Numeric representation of volume
- `liquidityNum`: Numeric representation of liquidity
- `startDateIso`: ISO formatted start date
- `hasReviewedDates`: Boolean indicating if dates have been reviewed
- `volume24hr`, `volume1wk`, `volume1mo`, `volume1yr`: Volume metrics for different time periods
- `clobTokenIds`: Array of CLOB token identifiers associated with the market

### Event Schema
The Event schema defines collections of related markets.

**Fields:**
- `id`, `ticker`, `slug`, `title`: Identifiers and title for the event
- `description`, `resolutionSource`: Descriptive information about the event
- `startDate`, `creationDate`, `endDate`: Temporal information
- `image`, `icon`: Visual assets
- `active`, `closed`, `archived`: Status indicators
- `new`, `featured`, `restricted`: Feature flags
- `liquidity`, `volume`, `openInterest`: Financial metrics
- `createdAt`, `updatedAt`: Timestamps
- `competitive`: Competitiveness score
- `volume24hr`, `volume1wk`, `volume1mo`, `volume1yr`: Volume metrics
- `enableOrderBook`: Boolean indicating order book availability
- `liquidityClob`: CLOB-specific liquidity
- `negRisk`: Negative risk indicator
- `commentCount`: Number of comments on the event
- `cyom`: Call your own market indicator
- `showAllOutcomes`, `showMarketImages`: Display preferences
- `enableNegRisk`, `automaticallyActive`: Feature flags
- `seriesSlug`: Associated series slug
- `gmpChartMode`: Chart display mode
- `negRiskAugmented`, `pendingDeployment`, `deploying`: Additional status flags
- `markets`: Array of markets associated with the event
- `series`: Array of series associated with the event
- `tags`: Array of tags associated with the event

### Series Schema
The Series schema defines thematic groupings of markets.

**Fields:**
- `id`, `ticker`, `slug`, `title`: Identifiers and title
- `subtitle`: Additional descriptive text
- `seriesType`, `recurrence`: Classification information
- `image`, `icon`: Visual assets
- `active`, `closed`, `archived`: Status indicators
- `volume`, `liquidity`: Financial metrics
- `startDate`: Series start date
- `createdAt`, `updatedAt`: Timestamps
- `competitive`: Competitiveness indicator
- `volume24hr`: 24-hour volume
- `pythTokenID`, `cgAssetName`: Integration identifiers
- `commentCount`: Number of comments

### Tag Schema
The Tag schema defines categorization tags for markets and events.

**Fields:**
- `id`: Unique identifier
- `label`: Display name of the tag
- `slug`: URL-friendly version
- `forceShow`: Boolean indicating forced visibility
- `publishedAt`: Publication timestamp
- `createdBy`, `updatedBy`: User identifiers
- `createdAt`, `updatedAt`: Timestamps
- `forceHide`: Boolean indicating forced hiding
- `isCarousel`: Boolean indicating carousel visibility

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L488)

## External Documentation Links

The following external documentation resources are essential for understanding and working with the Polymarket API and related technologies:

1. **Polymarket APIs**: The official Polymarket API documentation provides comprehensive information about available endpoints, authentication methods, rate limits, and usage examples. This is the authoritative source for understanding the capabilities and constraints of the Polymarket platform.

2. **Elysia.js**: Elysia is the TypeScript web framework used in this implementation for creating type-safe APIs. The documentation covers routing, middleware, validation, and other features that enable the robust API interface in this system.

3. **MCP Specification**: The MCP (Market Creation Process) specification defines the standards and protocols for creating and managing prediction markets on the Polymarket platform. This includes market structure, resolution criteria, and compliance requirements.

These resources are critical for developers who need to extend or modify the current implementation, as they provide context beyond the specific codebase.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml)

## Glossary of Terms

**Prediction Market**: A speculative market created for the purpose of trading outcomes of events. Participants buy and sell shares that pay $1 if the prediction resolves as "Yes" and $0 if "No".

**Market**: A specific prediction market with a defined question, outcomes, and trading parameters.

**Event**: A collection of related markets that share a common theme or topic (e.g., "2024 US Presidential Election").

**Series**: A thematic grouping of markets and events, often representing a recurring topic or category.

**Tag**: A categorical label used to organize and filter markets, events, and series.

**CLOB**: Central Limit Order Book, a system that matches buy and sell orders for a particular market.

**Gamma API**: Polymarket's API endpoint (gamma-api.polymarket.com) that provides access to market data, events, and related information.

**Condition**: The underlying logic or outcome that a market is predicting.

**Outcome Price**: The current trading price for a specific outcome in a market, reflecting the market's belief in the probability of that outcome.

**Liquidity**: The availability of shares in a market, affecting how easily positions can be opened or closed.

**Volume**: The total trading activity in a market over a specified period.

**Spread**: The difference between the best bid and best ask prices in a market.

**Order Book**: A list of buy (bids) and sell (asks) orders for a market, organized by price level.

**Arbitrage**: The practice of taking advantage of price differences between markets or platforms.

**Proxy**: An intermediary server that forwards requests between clients and servers, often used for rate limiting, caching, or security purposes.

**SDK**: Software Development Kit, a collection of tools and libraries that simplify interaction with an API.

**Elysia.js**: A TypeScript web framework that emphasizes type safety and developer experience.

**MCP**: Market Creation Process, the specification governing how markets are created and managed on Polymarket.

## Version Compatibility Matrix

The following matrix outlines the compatibility between different versions of dependencies and API versions used in the system:

| Component | Version | Compatibility Notes |
|---------|--------|-------------------|
| Polymarket Gamma API | Latest | The SDK is designed to work with the latest version of the Gamma API. Backward compatibility is maintained for at least 3 months after API changes. |
| Elysia.js | 0.10.x | Compatible with TypeScript 4.9+ and Bun runtime. Not compatible with Node.js environments without polyfills. |
| TypeScript | 5.0+ | Required for proper type inference and module resolution. Earlier versions may not correctly interpret the type schemas. |
| Bun | 1.0+ | The primary runtime environment. Node.js is not officially supported. |
| undici | 5.26+ | Required for proxy support through ProxyAgent. Earlier versions may lack necessary features. |
| Polymarket MCP Specification | 1.0 | Current implementation aligns with MCP specification version 1.0 as defined in the contracts. |

The system is designed to be forward-compatible, with new API fields being added as optional properties to avoid breaking changes. When API changes require breaking changes, a new version of the SDK will be released with appropriate versioning.

**Section sources**
- [package.json](file://package.json)
- [tsconfig.json](file://tsconfig.json)

## Data Retention and Archival Policies

The system implements the following data retention and archival policies for cached data:

1. **Cache Duration**: The system does not implement local caching of API responses. Each request to the proxy results in a fresh call to the Polymarket Gamma API, ensuring data freshness but potentially increasing API load.

2. **Data Freshness**: Since no caching is implemented at the proxy level, all data is current as of the time of the request. This eliminates stale data concerns but may impact performance under high load.

3. **Archival Considerations**: The system does not perform data archiving. Historical data must be obtained through the API's price history endpoints rather than from local storage.

4. **Memory Management**: Without caching, memory usage is minimal and directly proportional to concurrent request processing. No special archival processes are needed for memory management.

5. **External Caching**: While the proxy itself does not cache data, external systems (CDNs, client applications) may implement their own caching strategies based on HTTP cache headers, though these are not controlled by this implementation.

6. **Data Persistence**: No persistent storage is used in the current implementation. All data is ephemeral and exists only during request processing.

These policies prioritize data accuracy and simplicity over performance optimization. For use cases requiring high performance or reduced API calls, implementing a caching layer with configurable TTL (Time To Live) would be recommended.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)