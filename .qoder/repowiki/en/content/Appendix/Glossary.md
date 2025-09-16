# Glossary

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [clob.ts](file://src/routes/clob.ts)
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml)
- [data-model.md](file://specs/001-write-a-mcp/data-model.md)
- [spec.md](file://specs/001-write-a-mcp/spec.md)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Glossary](#glossary)
2. [A](#a)
3. [B](#b)
4. [C](#c)
5. [D](#d)
6. [E](#e)
7. [F](#f)
8. [G](#g)
9. [H](#h)
10. [I](#i)
11. [L](#l)
12. [M](#m)
13. [N](#n)
14. [O](#o)
15. [P](#p)
16. [Q](#q)
17. [R](#r)
18. [S](#s)
19. [T](#t)
20. [U](#u)
21. [V](#v)
22. [W](#w)

## A

### API (Application Programming Interface)
A set of rules and protocols that allows different software applications to communicate with each other. In the Polymarket ecosystem, APIs provide access to market data, trading functionality, and analytics.

### Archival
The process of marking a market or event as no longer active or accessible in the primary view. Archived items are typically historical records that are no longer tradable.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L190-L192)

## B

### Best Ask
The lowest price at which someone is willing to sell a particular outcome in a prediction market. It represents the most competitive offer on the sell side of the order book.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L208)

### Best Bid
The highest price at which someone is willing to buy a particular outcome in a prediction market. It represents the most competitive offer on the buy side of the order book.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L207)

### Book
A collection of buy and sell orders for a specific market, organized by price level. The book contains both bids (buy orders) and asks (sell orders).

**Section sources**
- [clob.ts](file://src/routes/clob.ts)

## C

### CLOB (Central Limit Order Book)
A trading mechanism where all buy and sell orders for a market are collected and matched based on price-time priority. The CLOB maintains a transparent record of all outstanding orders, allowing traders to see the current supply and demand at various price levels.

**Section sources**
- [README.md](file://README.md#L1-L493)

### CLOB Token ID
A unique identifier for a specific outcome token within the CLOB system. Each market outcome has its own token ID, which is used to reference that outcome in trading operations and price queries.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L131)

### Closed Market
A market that is no longer accepting trades, typically because the outcome has been determined or the market has reached its end date. Closed markets are no longer active for trading.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L124)

### Competitive
A metric that indicates how closely priced the outcomes in a market are, often used to assess market efficiency. Higher competitive values suggest tighter spreads and more balanced market sentiment.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L206)

### Condition ID
A unique identifier assigned to a specific market condition or question in the Polymarket system. The condition ID is used to track the resolution status and outcomes of a prediction market.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L110)

### CORS (Cross-Origin Resource Sharing)
A security mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served. The Polymarket proxy server includes CORS support for web application integration.

**Section sources**
- [README.md](file://README.md#L1-L493)

## D

### Data Model
The structure that defines how data is organized, stored, and accessed within the system. The Polymarket MCP server has a defined data model that includes entities like UserQuery, Market, AnalysisResult, and Response.

**Section sources**
- [data-model.md](file://specs/001-write-a-mcp/data-model.md#L1-L36)

### Date Range
A time period specified by a start and end date, used in queries to filter results to a specific timeframe. Date ranges are commonly used when retrieving historical price data or filtering markets by their start/end dates.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L1-L105)

## E

### Endpoint
A specific URL path in an API that performs a particular function. The Polymarket proxy server exposes multiple endpoints for accessing Gamma API data, CLOB data, and health checks.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Event
A collection of related markets that share a common theme, topic, or timeframe (e.g., "2024 US Presidential Election"). Events group multiple prediction markets around a single subject.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L240)

### Event Query
A set of parameters used to filter, sort, and paginate event data from the Gamma API. Event queries can include filters for status, date ranges, tags, and other attributes.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L380)

## F

### Fidelity
A parameter that specifies the resolution or granularity of historical price data, typically measured in minutes. Higher fidelity means more data points and finer time resolution.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Featured
A status indicator for events or markets that are highlighted or promoted on the platform. Featured items are often considered important or trending.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L260)

### Fetch
The process of retrieving data from an API or database. In the Polymarket SDK, fetch operations are used to get market data, price history, and other information from the Gamma API and CLOB.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L150)

## G

### Gamma API
The public API endpoint for Polymarket that provides access to market metadata, events, series, tags, and other non-trading data. The Gamma API does not require authentication and is used for market discovery and analysis.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Group Item
A component within an event that represents a specific market or sub-topic. Group items can have titles and thresholds that define their relationship to the parent event.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L200)

## H

### Health Check
A diagnostic endpoint that returns the operational status of a service. The Polymarket proxy server includes health check endpoints for both the Gamma API and CLOB client to monitor system availability.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Human-Readable Date
A date format that is easily understood by humans, such as "2025-08-13" or "2025-08-13T00:00:00.000Z", as opposed to Unix timestamps. The proxy server accepts both human-readable dates and Unix timestamps for time range queries.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L350)

## I

### Interval
A time period used when requesting historical price data, such as "1m" (1 minute), "1h" (1 hour), "6h" (6 hours), "1d" (1 day), "1w" (1 week), or "max" (maximum available). The interval determines the frequency of data points returned.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L320)

## L

### Liquidity
The availability of trading volume in a market, indicating how easily an asset can be bought or sold without causing significant price changes. Higher liquidity generally means tighter spreads and more stable prices.

**Section sources**
- [README.md](file://README.md#L1-L493)

### LRU Cache (Least Recently Used Cache)
A caching strategy that stores data and removes the least recently accessed items when the cache reaches its maximum size. The Polymarket SDK uses LRU caching to improve performance by storing frequently accessed data.

**Section sources**
- [README.md](file://README.md#L1-L493)

## M

### Market
A prediction market on Polymarket where users can trade on the outcome of future events. Each market has a question, possible outcomes, and associated prices that reflect the collective belief about the likelihood of each outcome.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100)

### Market Maker
An entity that provides liquidity to a market by placing both buy and sell orders. Market makers help ensure that there is always a counterparty available for trades, reducing spreads and improving market efficiency.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Market Query
A set of parameters used to filter, sort, and paginate market data from the Gamma API. Market queries can include filters for liquidity, volume, date ranges, tags, and other attributes.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L290)

### MCP (Model Context Protocol)
A protocol that enables AI models to interact with external data sources through a standardized interface. The Polymarket MCP server provides a natural language interface for querying market data and performing analysis.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Midpoint
The average of the best bid and best ask prices in a market. The midpoint represents the fair market value and is often used as a reference point for pricing and analysis.

**Section sources**
- [clob.ts](file://src/routes/clob.ts)

### Min Order Size
The minimum quantity of shares that can be traded in a single order. This parameter is defined by the market and enforced by the CLOB system.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L440)

### Mutually Exclusive
A relationship between parameters where only one can be used at a time. For example, in the price history query, the `interval` parameter is mutually exclusive with the `startTs`/`endTs` and `startDate`/`endDate` parameters.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L350)

## N

### Neg Risk (Negative Risk)
A boolean flag that indicates whether a market has negative risk characteristics, which may affect trading behavior or risk management strategies. This field is used internally for risk assessment.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L265)

### Next Cursor
A pagination token used to retrieve the next page of results in a paginated API response. Instead of using offset-based pagination, cursor-based pagination provides more consistent results in dynamic datasets.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L460)

## O

### Open Interest
The total number of outstanding contracts or positions in a market. Open interest is a measure of market activity and liquidity, indicating how much capital is currently at risk.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L262)

### Order Book
A real-time list of buy and sell orders for a specific market, organized by price level. The order book shows the current demand (bids) and supply (asks) at various price points.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Order Min Size
The minimum size of an order that can be placed in the market. This is a market-specific parameter that prevents very small or insignificant trades.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L203)

### Order Price Min Tick Size
The smallest increment by which the price of an order can change. This defines the price granularity in the order book and affects how tightly prices can be quoted.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L202)

## P

### Pagination
The process of dividing query results into discrete pages to improve performance and usability. The Polymarket API supports pagination through parameters like `limit`, `offset`, and `next_cursor`.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L460)

### Price History
A time-series record of price movements for a market over a specified period. Price history data is used for technical analysis, trend identification, and backtesting trading strategies.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Proxy Server
An intermediary server that forwards requests between clients and other servers. The Polymarket proxy server provides a type-safe REST API with OpenAPI documentation, acting as a translation layer between clients and the underlying Polymarket APIs.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Public Search
An API endpoint that allows searching across multiple data types (markets, events, profiles) with a single query. The public search feature enables discovery of relevant content based on keywords and filters.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L850)

## Q

### Query Parameter
A variable passed in the URL of an API request to modify the behavior of the endpoint. Query parameters are used for filtering, sorting, pagination, and specifying options in API calls.

**Section sources**
- [README.md](file://README.md#L1-L493)

## R

### Resolution
The process of determining the outcome of a prediction market based on real-world events. Once a market is resolved, winning shares are paid out to holders, and the market is closed.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L195)

### REST API (Representational State Transfer API)
An architectural style for designing networked applications that use HTTP requests to access and manipulate data. The Polymarket proxy server exposes a REST API with endpoints for market data and trading functions.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Risk Management
The process of identifying, assessing, and mitigating potential losses in trading activities. The `neg_risk` field in market data is one aspect of the platform's risk management system.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L265)

## S

### Schema
A formal definition of data structure and validation rules. The Polymarket SDK uses TypeBox schemas to ensure type safety and validate data at runtime, providing a single source of truth for all API contracts.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Series
A collection of related markets or events that share a common theme or category, such as sports leagues or political elections. Series help organize content and provide context for related predictions.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L220)

### Slug
A URL-friendly version of a name or title, typically used in web addresses. In Polymarket, slugs are used to identify markets and events in URLs (e.g., "bitcoin-above-100k").

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L111)

### Spread
The difference between the best bid and best ask prices in a market. The spread is a measure of market liquidity and transaction costs, with tighter spreads indicating more efficient markets.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Standalone SDK
A software development kit that can be used independently of the proxy server. The Polymarket package provides standalone SDKs for both the CLOB and Gamma APIs, allowing direct integration into applications.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Status
The current state of a market or event, such as active, closed, or archived. Status determines whether trading is allowed and how the item is displayed in the user interface.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L1-L105)

## T

### Tag
A keyword or label used to categorize and organize markets and events. Tags enable filtering and discovery of content based on topics like "Politics", "Sports", or "Technology".

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L230)

### Tick Size
The minimum price increment for trading in a market. The tick size determines how prices can change and affects the granularity of the order book.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L441)

### Time Range
A period specified by start and end times, used to filter data to a specific window. Time ranges are commonly used in price history queries to retrieve data for a particular period.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L350)

### Trade
A transaction in which one party buys shares of a market outcome from another party at a specified price. Trades execute against existing orders in the CLOB and update the market price.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Trading Volume
The total quantity of shares traded in a market over a specified period. Volume is a measure of market activity and liquidity, with higher volume indicating more interest and participation.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Type Safety
The property of a programming language or system that prevents type errors at compile time or runtime. The Polymarket SDK provides full type safety through TypeScript and TypeBox schemas, ensuring that data conforms to expected structures.

**Section sources**
- [README.md](file://README.md#L1-L493)

## U

### Unix Timestamp
A system for describing a point in time as the number of seconds that have elapsed since January 1, 1970 (UTC). Unix timestamps are used in API requests to specify time ranges for historical data queries.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L350)

## V

### Volume
The total amount of trading activity in a market, typically measured in monetary value or number of shares traded. Volume is a key indicator of market interest and liquidity.

**Section sources**
- [README.md](file://README.md#L1-L493)

### Volume 24hr
The total trading volume for a market over the past 24 hours. This metric provides insight into recent market activity and momentum.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L138)

## W

### WebSocket
A communication protocol that provides full-duplex channels over a single TCP connection. While not currently implemented, WebSocket support is planned for real-time data streaming in future versions of the Polymarket proxy server.

**Section sources**
- [README.md](file://README.md#L1-L493)