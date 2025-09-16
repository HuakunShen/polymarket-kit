# API Reference

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [clob.ts](file://src/routes/clob.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [client.ts](file://src/sdk/client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Gamma API](#gamma-api)
   - [Sports](#sports)
   - [Tags](#tags)
   - [Events](#events)
   - [Markets](#markets)
   - [Series](#series)
   - [Comments](#comments)
   - [Search](#search)
4. [CLOB API](#clob-api)
   - [Price History](#price-history)
   - [Order Book](#order-book)
   - [Prices](#prices)
   - [Midpoint](#midpoint)
   - [Spreads](#spreads)
   - [Trades](#trades)
   - [Markets](#markets-1)
   - [Health Check](#health-check)
   - [Cache Management](#cache-management)
5. [Error Handling](#error-handling)
6. [SDK Integration](#sdk-integration)
7. [Performance and Best Practices](#performance-and-best-practices)

## Introduction

The Polymarket API provides access to prediction market data through two distinct API groups: Gamma API for public market data and CLOB API for order book and trading operations. The Gamma API offers read-only access to markets, events, tags, and related entities without authentication, while the CLOB API requires authentication for accessing price history, order books, and trading functionality.

This documentation covers all available endpoints, their parameters, response formats, and usage patterns. The API is built using Elysia framework with comprehensive TypeScript type safety and validation through Zod schemas defined in elysia-schemas.ts.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)

## Authentication

### Gamma API
The Gamma API does not require authentication for access to public market data. All endpoints are accessible without API keys or credentials.

### CLOB API
The CLOB API requires authentication using Polymarket credentials:

- **x-polymarket-key**: Your private key for CLOB authentication
- **x-polymarket-funder**: Your funder address for CLOB operations

In production mode, these headers are required. In development mode, the system falls back to environment variables (POLYMARKET_KEY and POLYMARKET_FUNDER) if headers are not provided.

Authentication is handled through the PolymarketSDK which manages credential storage, API key derivation, and connection security.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L35-L80)
- [client.ts](file://src/sdk/client.ts#L100-L130)

## Gamma API

The Gamma API provides access to public prediction market data including markets, events, tags, and related entities. All endpoints are read-only and do not require authentication.

### Sports

#### GET /gamma/teams
Retrieve sports teams with optional filtering.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| league | string[] | No | Filter by league |
| name | string[] | No | Filter by team name |
| abbreviation | string[] | No | Filter by team abbreviation |

**Response**
- 200: Array of Team objects
- 500: Error response

**Example Usage**
```bash
curl "https://api.polymarket.com/gamma/teams?limit=10&league[]=NFL"
```

```typescript
const teams = await gammaSDK.getTeams({ limit: 10, league: ["NFL"] });
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L110-L125)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L200-L225)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L300-L315)

### Tags

#### GET /gamma/tags
Retrieve tags with pagination and filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| include_template | boolean | No | Include template information |
| is_carousel | boolean | No | Filter by carousel status |

**Response**
- 200: Array of UpdatedTag objects
- 500: Error response

#### GET /gamma/tags/:id
Retrieve a specific tag by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_template | boolean | No | Include template information |

**Response**
- 200: UpdatedTag object
- 404: Tag not found
- 500: Error response

#### GET /gamma/tags/slug/:slug
Retrieve a specific tag by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_template | boolean | No | Include template information |

**Response**
- 200: UpdatedTag object
- 404: Tag not found
- 500: Error response

#### GET /gamma/tags/:id/related-tags
Retrieve related tag relationships for a specific tag ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status (active, closed, all) |

**Response**
- 200: Array of RelatedTagRelationship objects
- 500: Error response

#### GET /gamma/tags/slug/:slug/related-tags
Retrieve related tag relationships for a specific tag slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status (active, closed, all) |

**Response**
- 200: Array of RelatedTagRelationship objects
- 500: Error response

#### GET /gamma/tags/:id/related-tags/tags
Retrieve actual tag objects related to a specific tag ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Tag ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status (active, closed, all) |

**Response**
- 200: Array of UpdatedTag objects
- 500: Error response

#### GET /gamma/tags/slug/:slug/related-tags/tags
Retrieve actual tag objects related to a specific tag slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Tag slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status (active, closed, all) |

**Response**
- 200: Array of UpdatedTag objects
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L127-L228)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L227-L275)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L317-L410)

### Events

#### GET /gamma/events
Retrieve events with comprehensive filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
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
| start_date_min | string | No | Minimum start date |
| start_date_max | string | No | Maximum start date |
| end_date_min | string | No | Minimum end date |
| end_date_max | string | No | Maximum end date |

**Response**
- 200: Array of Event objects
- 500: Error response

#### GET /gamma/events/pagination
Retrieve events with pagination metadata.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | Yes | Maximum number of results to return |
| offset | number | Yes | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |
| recurrence | string | No | Filter by recurrence pattern |

**Response**
- 200: Object with data array and pagination metadata
- 500: Error response

#### GET /gamma/events/:id
Retrieve a specific event by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Event ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response**
- 200: Event object
- 404: Event not found
- 500: Error response

#### GET /gamma/events/:id/tags
Retrieve tags associated with a specific event.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Event ID |

**Response**
- 200: Array of UpdatedTag objects
- 404: Event not found
- 500: Error response

#### GET /gamma/events/slug/:slug
Retrieve a specific event by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Event slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response**
- 200: Event object
- 404: Event not found
- 500: Error response

#### GET /gamma/events/:id/markdown
Convert event data to markdown format optimized for LLM arbitrage analysis.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Event ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| verbose | 0,1,2 | No | Verbosity level (0=basic, 1=medium, 2=full details) |
| include_markets | boolean | No | Whether to include market details in output |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response**
- 200: Markdown content (text/plain) or {markdown: string} (application/json)
- 404: Event not found
- 500: Error response

#### GET /gamma/events/slug/:slug/markdown
Convert event data to markdown format optimized for LLM arbitrage analysis by slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Event slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| verbose | 0,1,2 | No | Verbosity level (0=basic, 1=medium, 2=full details) |
| include_markets | boolean | No | Whether to include market details in output |
| include_chat | boolean | No | Include chat information |
| include_template | boolean | No | Include template information |

**Response**
- 200: Markdown content (text/plain) or {markdown: string} (application/json)
- 404: Event not found
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L230-L400)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L277-L350)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L412-L545)

### Markets

#### GET /gamma/markets
Retrieve markets with comprehensive filtering options.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| id | number[] | No | Filter by market ID |
| slug | string[] | No | Filter by market slug |
| tag_id | number | No | Filter by tag ID |
| closed | boolean | No | Filter by closed status |
| active | boolean | No | Filter by active status |
| archived | boolean | No | Filter by archived status |
| sports_market_types | string[] | No | Filter by sports market types |
| start_date_min | string | No | Minimum start date |
| start_date_max | string | No | Maximum start date |
| end_date_min | string | No | Minimum end date |
| end_date_max | string | No | Maximum end date |

**Response**
- 200: Array of Market objects
- 500: Error response

#### GET /gamma/markets/:id
Retrieve a specific market by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Market ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_tag | boolean | No | Include tag information |

**Response**
- 200: Market object
- 404: Market not found
- 500: Error response

#### GET /gamma/markets/:id/tags
Retrieve tags associated with a specific market.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Market ID |

**Response**
- 200: Array of UpdatedTag objects
- 404: Market not found
- 500: Error response

#### GET /gamma/markets/slug/:slug
Retrieve a specific market by its slug.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| slug | string | Yes | Market slug |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_tag | boolean | No | Include tag information |

**Response**
- 200: Market object
- 404: Market not found
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L402-L465)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L125)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L547-L615)

### Series

#### GET /gamma/series
Retrieve series with filtering and pagination.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | Yes | Maximum number of results to return |
| offset | number | Yes | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| slug | string[] | No | Filter by series slug |
| categories_ids | number[] | No | Filter by category IDs |
| categories_labels | string[] | No | Filter by category labels |
| closed | boolean | No | Filter by closed status |
| include_chat | boolean | No | Include chat information |
| recurrence | string | No | Filter by recurrence pattern |

**Response**
- 200: Array of Series objects
- 500: Error response

#### GET /gamma/series/:id
Retrieve a specific series by its ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Series ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| include_chat | boolean | No | Include chat information |

**Response**
- 200: Series object
- 404: Series not found
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L467-L495)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L150-L175)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L617-L645)

### Comments

#### GET /gamma/comments
Retrieve comments with optional filtering.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| parent_entity_type | string | No | Filter by parent entity type |
| parent_entity_id | string | No | Filter by parent entity ID |

**Response**
- 200: Array of Comment objects
- 500: Error response

#### GET /gamma/comments/:id
Retrieve comments related to a specific comment ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| id | string | Yes | Comment ID |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |

**Response**
- 200: Array of Comment objects
- 500: Error response

#### GET /gamma/comments/user_address/:userAddress
Retrieve comments made by a specific user address.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| userAddress | string | Yes | User wallet address |

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |

**Response**
- 200: Array of Comment objects
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L497-L545)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L352-L375)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L647-L695)

### Search

#### GET /gamma/search
Perform a comprehensive search across markets, events, and user profiles.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| q | string | Yes | Search query |
| limit_per_type | number | No | Limit results per type |
| events_status | string | No | Filter events by status |
| markets_status | string | No | Filter markets by status |
| profiles_status | string | No | Filter profiles by status |
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |

**Response**
- 200: Search response object with results by type
- 500: Error response

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L547-L565)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L377-L400)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L697-L720)

## CLOB API

The CLOB API provides access to order book data, price history, and trading functionality. Authentication is required for all endpoints.

### Price History

#### GET /clob/prices-history
Retrieve price history for a specific token via market query parameter.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| market | string | Yes | CLOB token ID for which to fetch price history |
| startTs | number | No | Start timestamp in seconds (Unix timestamp) |
| endTs | number | No | End timestamp in seconds (Unix timestamp) |
| startDate | string | No | Start date in ISO format (e.g., "2025-08-13") |
| endDate | string | No | End date in ISO format (e.g., "2025-08-13") |
| interval | string | No | Time interval (1m, 1h, 6h, 1d, 1w, max) |
| fidelity | number | No | Data resolution in minutes |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: PriceHistoryResponse object with history array and time range
- 400: Bad request (invalid parameters)
- 500: Internal server error

**Example Usage**
```bash
curl "https://api.polymarket.com/clob/prices-history?market=0x...&interval=1h&startDate=2024-01-01"
```

```typescript
const history = await sdk.getPriceHistory({
  market: "0x...",
  interval: "1h",
  startDate: "2024-01-01",
  endDate: "2024-01-02"
});
```

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L100-L150)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L402-L450)
- [client.ts](file://src/sdk/client.ts#L132-L180)

### Order Book

#### GET /clob/book/:tokenId
Retrieve the current order book for a specific token ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| tokenId | string | Yes | The CLOB token ID to get order book for |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: OrderBookSummary object with bids, asks, and market metadata
- 400: Bad request
- 404: No orderbook exists
- 500: Internal server error

#### POST /clob/orderbooks
Retrieve order books for multiple token IDs.

**Request Body**
Array of objects with:
- token_id: string
- side: "BUY" or "SELL"

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Array of OrderBookSummary objects
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L240-L295)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L475-L500)
- [client.ts](file://src/sdk/client.ts#L182-L195)

### Prices

#### GET /clob/price/:tokenId/:side
Get the current price for a specific token ID and side (buy/sell).

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| tokenId | string | Yes | The CLOB token ID to get price for |
| side | string | Yes | The side to get price for (buy or sell) |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with price field (number)
- 400: Bad request
- 500: Internal server error

#### POST /clob/prices
Get prices for multiple token IDs and sides.

**Request Body**
Array of objects with:
- token_id: string
- side: "BUY" or "SELL"

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with prices array (numbers)
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L297-L345)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L475-L500)
- [client.ts](file://src/sdk/client.ts#L197-L205)

### Midpoint

#### GET /clob/midpoint/:tokenId
Get the midpoint price for a specific token ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| tokenId | string | Yes | The CLOB token ID to get midpoint for |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with midpoint field (number)
- 400: Bad request
- 500: Internal server error

#### POST /clob/midpoints
Get midpoint prices for multiple token IDs.

**Request Body**
Array of objects with:
- token_id: string

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with midpoints array (numbers)
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L347-L395)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L475-L500)
- [client.ts](file://src/sdk/client.ts#L207-L215)

### Spreads

#### POST /clob/spreads
Get bid-ask spreads for multiple token IDs.

**Request Body**
Array of objects with:
- token_id: string

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with spreads array (numbers)
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L397-L425)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L475-L500)
- [client.ts](file://src/sdk/client.ts#L217-L225)

### Trades

#### POST /clob/trades
Get trades with optional filtering.

**Request Body**
Object with optional fields:
- id: string
- maker_address: string
- market: string
- asset_id: string
- before: string
- after: string
- only_first_page: boolean
- next_cursor: string

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Object with trades array
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L427-L465)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L502-L525)
- [client.ts](file://src/sdk/client.ts#L227-L235)

### Markets

#### GET /clob/market/:conditionId
Get market information for a specific condition ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| conditionId | string | Yes | The condition ID to get market for |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Market data object
- 400: Bad request
- 500: Internal server error

#### GET /clob/markets
Get paginated list of markets.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| next_cursor | string | No | Cursor for pagination |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: PaginationPayload object with market data
- 400: Bad request
- 500: Internal server error

#### GET /clob/sampling-markets
Get paginated list of sampling markets.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| next_cursor | string | No | Cursor for pagination |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: PaginationPayload object with sampling market data
- 400: Bad request
- 500: Internal server error

#### GET /clob/simplified-markets
Get paginated list of simplified markets.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| next_cursor | string | No | Cursor for pagination |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: PaginationPayload object with simplified market data
- 400: Bad request
- 500: Internal server error

#### GET /clob/sampling-simplified-markets
Get paginated list of sampling simplified markets.

**Query Parameters**
| Parameter | Type | Required | Description |
|---------|------|---------|-------------|
| next_cursor | string | No | Cursor for pagination |

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: PaginationPayload object with sampling simplified market data
- 400: Bad request
- 500: Internal server error

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L467-L565)
- [client.ts](file://src/sdk/client.ts#L237-L265)

### Health Check

#### GET /clob/health
Check the health status of CLOB client connection.

**Headers**
| Header | Required | Description |
|-------|---------|-------------|
| x-polymarket-key | Required in production | Polymarket private key for CLOB authentication |
| x-polymarket-funder | Required in production | Polymarket funder address for CLOB operations |

**Response**
- 200: Health status object with status, timestamp, clob, and cached fields
- 503: Unhealthy status

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L152-L185)
- [client.ts](file://src/sdk/client.ts#L267-L295)

### Cache Management

#### GET /clob/cache/stats
Get cache statistics for SDK instances and CLOB clients.

**Response**
- 200: Object with sdkCache and clobClientCache objects containing size and maxSize

#### DELETE /clob/cache
Clear all cached SDK instances and CLOB clients.

**Response**
- 200: Object with message and timestamp

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L187-L238)
- [client.ts](file://src/sdk/client.ts#L349-L370)

## Error Handling

The API returns standardized error responses for all endpoints:

### 4xx Client Errors
- **400 Bad Request**: Invalid request parameters or body
- **404 Not Found**: Resource not found (specific to Gamma API endpoints)

### 5xx Server Errors
- **500 Internal Server Error**: Generic server error
- **503 Service Unavailable**: CLOB service is unhealthy

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

For Gamma API 404 errors:
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

For CLOB API health check 503 errors:
```json
{
  "status": "unhealthy",
  "timestamp": "ISO timestamp",
  "clob": "disconnected",
  "error": "Error message"
}
```

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L527-L575)
- [gamma.ts](file://src/routes/gamma.ts#L120-L125)
- [clob.ts](file://src/routes/clob.ts#L165-L185)

## SDK Integration

The Polymarket SDK provides TypeScript classes for easy integration with both API groups.

### GammaSDK
For accessing public market data without authentication:

```typescript
import { GammaSDK } from "./sdk";

const gamma = new GammaSDK({
  proxy: {
    protocol: "http",
    host: "proxy.com",
    port: 8080,
    username: "user",
    password: "pass"
  }
});

// Get active events
const activeEvents = await gamma.getActiveEvents({ limit: 10 });

// Search markets
const results = await gamma.search({ q: "election", limit_per_type: 5 });
```

### PolymarketSDK
For accessing CLOB functionality with authentication:

```typescript
import { PolymarketSDK } from "./sdk";

const sdk = new PolymarketSDK({
  privateKey: "0x...",
  funderAddress: "0x...",
  host: "https://clob.polymarket.com",
  chainId: 137
});

// Get price history
const history = await sdk.getPriceHistory({
  market: "0x...",
  interval: "1h"
});

// Get order book
const book = await sdk.getBook("0x...");
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L100-L890)
- [client.ts](file://src/sdk/client.ts#L100-L370)
- [index.ts](file://src/sdk/index.ts#L1-L14)

## Performance and Best Practices

### Pagination
Use pagination parameters (limit, offset, next_cursor) to efficiently retrieve large datasets. The CLOB API uses cursor-based pagination for better performance with large datasets.

### Caching
The server implements LRU caching for SDK instances and CLOB clients:
- SDK cache: 50 instances by default, 1 hour TTL
- CLOB client cache: 100 instances by default, 30 minutes TTL

### Rate Limiting
While not explicitly implemented in the code, consider implementing client-side rate limiting to avoid overwhelming the API.

### Proxy Support
Both APIs support HTTP/HTTPS proxy configuration:
- Gamma API: Via x-http-proxy header
- CLOB API: Via environment variables or direct configuration

### Error Handling
Implement robust error handling for network failures and API errors. Use retry logic with exponential backoff for transient failures.

### Data Transformation
The SDK automatically transforms JSON string fields (outcomes, outcomePrices, clobTokenIds) into proper arrays for easier consumption.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L25-L80)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L50-L150)
- [client.ts](file://src/sdk/client.ts#L25-L80)