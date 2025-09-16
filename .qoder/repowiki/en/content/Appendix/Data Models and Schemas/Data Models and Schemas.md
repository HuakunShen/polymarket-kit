# Data Models and Schemas

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [clob.ts](file://src/routes/clob.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Data Models](#core-data-models)
3. [Schema Definitions and Relationships](#schema-definitions-and-relationships)
4. [API Usage and Endpoints](#api-usage-and-endpoints)
5. [Validation and Type Handling](#validation-and-type-handling)
6. [Request and Response Examples](#request-and-response-examples)
7. [Schema Customization and Extension](#schema-customization-and-extension)

## Introduction
This document provides comprehensive documentation for the core data models used in the Polymarket proxy server. It details the structure, relationships, and field definitions for Market, Event, Series, Tag, and Price History models as defined in the elysia-schemas.ts file. The documentation explains how these models are utilized across both Gamma and CLOB APIs, including validation rules, data types, and transformation logic. Special attention is given to the differences between similar schemas such as MarketSchema and EventMarketSchema, their respective use cases, and how nullability, optionality, and type unions are handled in the schema definitions. The document also provides guidance on extending or customizing these schemas for downstream applications.

## Core Data Models

The Polymarket proxy server utilizes a comprehensive set of data models to represent prediction markets and related entities. These models are defined using Elysia's type validation system and are used for request/response validation across the API endpoints. The core entities include Market, Event, Series, Tag, and Price History, each with specific fields and relationships that capture the essential information for prediction market operations.

The data models are designed to support both the Gamma API (for public market data) and the CLOB API (for order book and trading operations). The models include various fields for market metadata, pricing information, volume metrics, and temporal data. Special attention has been paid to handling data transformations, particularly for fields that are received as JSON strings from the underlying API but need to be represented as arrays in the TypeScript types.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L1022)

## Schema Definitions and Relationships

### Market Schema
The MarketSchema defines the structure for Polymarket prediction market data, including pricing, volume, liquidity, and associated metadata. It serves as the primary representation for individual markets in the system.

```mermaid
classDiagram
class MarketSchema {
+string id
+string question
+string conditionId
+string slug
+string liquidity
+string startDate
+string image
+string icon
+string description
+boolean active
+string volume
+string[] outcomes
+string[] outcomePrices
+boolean closed
+boolean new
+string questionID
+number volumeNum
+number liquidityNum
+string startDateIso
+boolean hasReviewedDates
+number volume24hr
+number volume1wk
+number volume1mo
+number volume1yr
+string[] clobTokenIds
+Event[] events
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L139)

### Event Market Schema
The EventMarketSchema represents markets that are part of an event, containing similar market data but in the context of event groupings. This schema includes additional fields specific to event-based markets.

```mermaid
classDiagram
class EventMarketSchema {
+string id
+string question
+string conditionId
+string slug
+string resolutionSource
+string endDate
+string liquidity
+string startDate
+string image
+string icon
+string description
+string[] outcomes
+string[] outcomePrices
+string volume
+boolean active
+boolean closed
+string marketMakerAddress
+string createdAt
+string updatedAt
+boolean new
+boolean featured
+boolean archived
+boolean restricted
+string groupItemTitle
+string groupItemThreshold
+string questionID
+boolean enableOrderBook
+number orderPriceMinTickSize
+number orderMinSize
+number volumeNum
+number liquidityNum
+string endDateIso
+string startDateIso
+boolean hasReviewedDates
+number volume24hr
+number volume1wk
+number volume1mo
+number volume1yr
+string[] clobTokenIds
+number spread
+number oneDayPriceChange
+number oneHourPriceChange
+number lastTradePrice
+number bestBid
+number bestAsk
+number competitive
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L140-L188)

### Event Schema
The EventSchema represents collections of related markets that share a common theme, topic, or timeframe. Events serve as containers for multiple related markets and include metadata about the event itself.

```mermaid
classDiagram
class EventSchema {
+string id
+string ticker
+string slug
+string title
+string description
+string resolutionSource
+string startDate
+string creationDate
+string endDate
+string image
+string icon
+boolean active
+boolean closed
+boolean archived
+boolean new
+boolean featured
+boolean restricted
+number liquidity
+number volume
+number openInterest
+string createdAt
+string updatedAt
+number competitive
+number volume24hr
+number volume1wk
+number volume1mo
+number volume1yr
+boolean enableOrderBook
+number liquidityClob
+boolean negRisk
+number commentCount
+EventMarketSchema[] markets
+SeriesSchema[] series
+TagSchema[] tags
+boolean cyom
+boolean showAllOutcomes
+boolean showMarketImages
+boolean enableNegRisk
+boolean automaticallyActive
+string seriesSlug
+string gmpChartMode
+boolean negRiskAugmented
+boolean pendingDeployment
+boolean deploying
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L189-L241)

### Series Schema
The SeriesSchema defines the structure for market series data, which groups related markets together under a common theme or topic. Series provide a way to organize markets beyond individual events.

```mermaid
classDiagram
class SeriesSchema {
+string id
+string ticker
+string slug
+string title
+string subtitle
+string seriesType
+string recurrence
+string image
+string icon
+boolean active
+boolean closed
+boolean archived
+number volume
+number liquidity
+string startDate
+string createdAt
+string updatedAt
+string competitive
+number volume24hr
+string pythTokenID
+string cgAssetName
+number commentCount
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L242-L279)

### Tag Schema
The TagSchema provides categorization and filtering capabilities for markets and events in the Polymarket ecosystem. Tags are used to classify content and enable discovery.

```mermaid
classDiagram
class TagSchema {
+string id
+string label
+string slug
+boolean forceShow
+string createdAt
+boolean isCarousel
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L280-L294)

### Price History Schema
The PriceHistoryResponseSchema contains an array of price history points and optional time range metadata for the requested historical data. This schema is used for price history API responses.

```mermaid
classDiagram
class PriceHistoryResponseSchema {
+PriceHistoryPointSchema[] history
+object|undefined timeRange
}
class PriceHistoryPointSchema {
+number t
+number p
}
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L304-L318)

### Schema Relationships
The various schemas are interconnected through a hierarchical relationship structure, where Events contain Markets, and both Events and Markets can be associated with Tags and Series.

```mermaid
erDiagram
EVENT {
string id PK
string title
string slug
boolean active
boolean closed
}
MARKET {
string id PK
string question
string slug
boolean active
boolean closed
}
SERIES {
string id PK
string title
string slug
boolean active
boolean closed
}
TAG {
string id PK
string label
string slug
}
PRICE_HISTORY_POINT {
number t
number p
}
EVENT ||--o{ MARKET : contains
EVENT ||--o{ SERIES : contains
EVENT ||--o{ TAG : categorized_by
MARKET ||--o{ TAG : categorized_by
MARKET ||--o{ PRICE_HISTORY_POINT : has_history
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L1022)

## API Usage and Endpoints

### Gamma API Endpoints
The Gamma API provides access to public market data through a comprehensive set of endpoints. These endpoints use the data models described above to structure requests and responses.

```mermaid
sequenceDiagram
participant Client
participant GammaAPI
participant GammaSDK
Client->>GammaAPI : GET /gamma/events
GammaAPI->>GammaSDK : getEvents(query)
GammaSDK->>Polymarket : Fetch data
Polymarket-->>GammaSDK : Return event data
GammaSDK-->>GammaAPI : Transform data
GammaAPI-->>Client : Return EventSchema[]
Client->>GammaAPI : GET /gamma/markets
GammaAPI->>GammaSDK : getMarkets(query)
GammaSDK->>Polymarket : Fetch data
Polymarket-->>GammaSDK : Return market data
GammaSDK-->>GammaAPI : Transform data
GammaAPI-->>Client : Return MarketSchema[]
Client->>GammaAPI : GET /gamma/series
GammaAPI->>GammaSDK : getSeries(query)
GammaSDK->>Polymarket : Fetch data
Polymarket-->>GammaSDK : Return series data
GammaSDK-->>GammaAPI : Transform data
GammaAPI-->>Client : Return SeriesSchema[]
Client->>GammaAPI : GET /gamma/tags
GammaAPI->>GammaSDK : getTags(query)
GammaSDK->>Polymarket : Fetch data
Polymarket-->>GammaSDK : Return tag data
GammaSDK-->>GammaAPI : Transform data
GammaAPI-->>Client : Return UpdatedTagSchema[]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L100-L724)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L100-L891)

### CLOB API Endpoints
The CLOB API provides access to order book and trading data, with a focus on price history and market data for trading operations.

```mermaid
sequenceDiagram
participant Client
participant ClobAPI
participant PolymarketSDK
Client->>ClobAPI : GET /clob/prices-history
ClobAPI->>PolymarketSDK : getPriceHistory(params)
PolymarketSDK->>CLOB : Fetch price history
CLOB-->>PolymarketSDK : Return price data
PolymarketSDK-->>ClobAPI : Transform data
ClobAPI-->>Client : Return PriceHistoryResponseSchema
Client->>ClobAPI : GET /clob/book/{tokenId}
ClobAPI->>PolymarketSDK : getBook(tokenId)
PolymarketSDK->>CLOB : Fetch order book
CLOB-->>PolymarketSDK : Return order book data
PolymarketSDK-->>ClobAPI : Transform data
ClobAPI-->>Client : Return OrderBookSummarySchema
Client->>ClobAPI : GET /clob/price/{tokenId}/{side}
ClobAPI->>PolymarketSDK : getPrice(tokenId, side)
PolymarketSDK->>CLOB : Fetch price
CLOB-->>PolymarketSDK : Return price
PolymarketSDK-->>ClobAPI : Transform data
ClobAPI-->>Client : Return price object
```

**Diagram sources**
- [clob.ts](file://src/routes/clob.ts#L100-L1013)

## Validation and Type Handling

### Nullability and Optionality
The schema definitions carefully handle nullability and optionality through the use of Elysia's Optional type modifier. Fields that may be absent in certain contexts are marked as optional, while required fields are defined without the Optional wrapper.

```mermaid
flowchart TD
Start([Field Definition]) --> CheckOptional{"Is field optional?"}
CheckOptional --> |Yes| ApplyOptional["Wrap with t.Optional()"]
CheckOptional --> |No| KeepRequired["Keep as required field"]
ApplyOptional --> DefineType["Define type with Optional wrapper"]
KeepRequired --> DefineType
DefineType --> End([Complete schema definition])
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L10-L50)

### Type Unions
Type unions are used in several schemas to represent fields that can have multiple possible values. The most notable example is the PriceHistoryIntervalEnum, which defines the available time intervals for fetching historical price data.

```mermaid
classDiagram
class PriceHistoryIntervalEnum {
+1m
+1h
+6h
+1d
+1w
+max
}
class PriceHistoryQuerySchema {
+string market
+number startTs
+number endTs
+string startDate
+string endDate
+PriceHistoryIntervalEnum interval
+number fidelity
}
PriceHistoryQuerySchema --> PriceHistoryIntervalEnum : uses
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L319-L333)

### Data Transformation
Data transformation is a critical aspect of the schema implementation, particularly for fields that are received as JSON strings from the underlying API but need to be represented as arrays in the TypeScript types. The GammaSDK includes transformation methods to handle this conversion.

```mermaid
sequenceDiagram
participant API
participant GammaSDK
participant Client
API->>GammaSDK : Return data with JSON string arrays
GammaSDK->>GammaSDK : parseJsonArray(field)
GammaSDK->>GammaSDK : JSON.parse(string)
GammaSDK->>GammaSDK : Validate array structure
GammaSDK->>GammaSDK : Return parsed array
GammaSDK-->>Client : Return transformed data
```

**Diagram sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L100-L891)

## Request and Response Examples

### Market Query Example
```mermaid
sequenceDiagram
participant Client
participant Server
participant GammaAPI
Client->>Server : GET /gamma/markets?limit=10&active=true
Server->>GammaAPI : Forward request
GammaAPI->>GammaAPI : Validate query parameters
GammaAPI->>GammaAPI : Transform query to UpdatedMarketQueryType
GammaAPI->>GammaSDK : getMarkets(query)
GammaSDK->>Polymarket : Fetch market data
Polymarket-->>GammaSDK : Return raw market data
GammaSDK->>GammaSDK : transformMarketData(data)
GammaSDK-->>GammaAPI : Return transformed MarketType[]
GammaAPI-->>Server : Return MarketSchema[]
Server-->>Client : Return array of Market objects
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L500-L520)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L600-L620)

### Event with Markets Example
```mermaid
sequenceDiagram
participant Client
participant Server
participant GammaAPI
Client->>Server : GET /gamma/events/123
Server->>GammaAPI : Forward request
GammaAPI->>GammaAPI : Validate parameters
GammaAPI->>GammaSDK : getEventById(123)
GammaSDK->>Polymarket : Fetch event data
Polymarket-->>GammaSDK : Return raw event data
GammaSDK->>GammaSDK : transformEventData(data)
GammaSDK->>GammaSDK : transformMarketData(market) for each market
GammaSDK-->>GammaAPI : Return transformed EventType
GammaAPI-->>Server : Return EventSchema
Server-->>Client : Return Event object with nested markets
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L300-L320)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L400-L420)

### Price History Query Example
```mermaid
sequenceDiagram
participant Client
participant Server
participant ClobAPI
Client->>Server : GET /clob/prices-history?market=123&interval=1d
Server->>ClobAPI : Forward request
ClobAPI->>ClobAPI : Validate query parameters
ClobAPI->>ClobAPI : Transform query to PriceHistoryQueryType
ClobAPI->>PolymarketSDK : getPriceHistory(params)
PolymarketSDK->>CLOB : Fetch price history
CLOB-->>PolymarketSDK : Return price history data
PolymarketSDK-->>ClobAPI : Return PriceHistoryResponseType
ClobAPI-->>Server : Return PriceHistoryResponseSchema
Server-->>Client : Return price history with timestamps and prices
```

**Diagram sources**
- [clob.ts](file://src/routes/clob.ts#L100-L150)

## Schema Customization and Extension

### Extending Existing Schemas
The schema system is designed to be extensible, allowing for the addition of new fields or the creation of specialized variants of existing schemas.

```mermaid
classDiagram
class MarketSchema {
<<base>>
+string id
+string question
+string slug
}
class ExtendedMarketSchema {
<<extension>>
+string id
+string question
+string slug
+string customField
+number analyticsScore
}
ExtendedMarketSchema --|> MarketSchema : extends
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L139)

### Creating Custom Query Schemas
Custom query schemas can be created by combining existing schema components or adding new fields specific to particular use cases.

```mermaid
classDiagram
class BaseQuerySchema {
+number limit
+number offset
+string order
+boolean ascending
}
class MarketFilterSchema {
+string id
+string slug
+boolean active
+boolean closed
+string tag_id
}
class CustomMarketQuerySchema {
+number limit
+number offset
+string order
+boolean ascending
+string id
+string slug
+boolean active
+boolean closed
+string tag_id
+string customFilter
+number minVolume
}
BaseQuerySchema <|-- CustomMarketQuerySchema
MarketFilterSchema <|-- CustomMarketQuerySchema
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L334-L400)

### Type Safety and Inference
The system provides strong type safety through TypeScript type inference, ensuring that schema definitions and their corresponding TypeScript types remain synchronized.

```mermaid
flowchart TD
SchemaDefinition[Define schema with t.Object] --> TypeExtraction["Extract TypeScript type with typeof Schema.static"]
TypeExtraction --> TypeValidation["Validate type compatibility"]
TypeValidation --> Implementation["Use types in SDK and handlers"]
Implementation --> Consistency["Ensure schema-type consistency"]
```

**Diagram sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L800-L1022)