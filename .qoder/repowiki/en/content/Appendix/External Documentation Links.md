# External Documentation Links

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [specs/001-write-a-mcp/contracts/polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml)
- [src/sdk/client.ts](file://src/sdk/client.ts)
- [src/sdk/gamma-client.ts](file://src/sdk/gamma-client.ts)
</cite>

## Table of Contents
1. [Polymarket API Documentation](#polymarket-api-documentation)
2. [Key Dependencies Documentation](#key-dependencies-documentation)
3. [Model Context Protocol Specification](#model-context-protocol-specification)
4. [Version Compatibility Notes](#version-compatibility-notes)
5. [Documentation Gaps and Supplemental Resources](#documentation-gaps-and-supplemental-resources)

## Polymarket API Documentation

### Gamma API Documentation
- **Description**: The Gamma API provides access to public market data including markets, events, series, tags, and comments. It serves as the primary data source for market information without requiring authentication.
- **URL**: https://gamma-api.polymarket.com/docs
- **Relevance**: Essential for understanding market data structures, event hierarchies, and search functionality. The proxy server's `/gamma/*` endpoints directly interface with this API.
- **Key Sections**:
  - **Market Endpoints**: Critical for understanding market data structure, filtering parameters, and pagination (used in `getMarkets`, `getMarketBySlug`)
  - **Event Endpoints**: Important for event-market relationships and filtering by date/status (used in `getEvents`, `getEventBySlug`)
  - **Search Endpoint**: Required for implementing the `search_polymarket` MCP tool
  - **Tag Endpoints**: Necessary for understanding tag hierarchies and relationships (used in `getTags`, `getRelatedTagsRelationshipsByTagId`)

### CLOB API Documentation
- **Description**: The CLOB (Central Limit Order Book) API provides access to trading data, price history, order books, and trading operations. Requires authentication with private key and funder address.
- **URL**: https://clob.polymarket.com/docs
- **Relevance**: Fundamental for price history retrieval, order book analysis, and trading operations. The proxy server's `/clob/*` endpoints use this API through the `@polymarket/clob-client` SDK.
- **Key Sections**:
  - **Price History Endpoint**: Crucial for implementing the `getPriceHistory` method with proper interval and time range parameters
  - **Order Book Endpoints**: Important for understanding bid/ask structures and market depth (used in `getBook`, `getOrderBooks`)
  - **Authentication Methods**: Essential for understanding API key derivation and signature requirements
  - **Health Check Endpoint**: Used in the `healthCheck` method implementation

**Section sources**
- [src/sdk/client.ts](file://src/sdk/client.ts#L1-L388)
- [src/sdk/gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

## Key Dependencies Documentation

### Elysia.js Framework
- **Description**: A TypeScript-first framework for Bun that enables type-safe web applications with automatic OpenAPI schema generation. Used as the foundation for the proxy server.
- **URL**: https://elysiajs.com/
- **Relevance**: Core framework for building the proxy server with end-to-end type safety. Enables automatic OpenAPI documentation and type validation.
- **Key Sections**:
  - **Routing Guide**: Essential for understanding route definition and middleware (used in `src/routes/gamma.ts` and `src/routes/clob.ts`)
  - **TypeBox Integration**: Critical for the unified schema system in `src/types/elysia-schemas.ts`
  - **OpenAPI/Swagger Plugin**: Required for automatic API documentation generation
  - **Error Handling**: Important for consistent error responses across endpoints
  - **CORS Plugin**: Necessary for web application integration

### @polymarket/clob-client SDK
- **Description**: Official Polymarket SDK for interacting with the CLOB API. Provides typed methods for price history, order books, and trading operations.
- **URL**: https://github.com/Polymarket/clob-client
- **Relevance**: Primary dependency for CLOB API interactions. Used in the `PolymarketSDK` class to handle authenticated requests.
- **Key Sections**:
  - **Client Initialization**: Critical for understanding API key derivation and wallet integration (used in `initializeClobClient`)
  - **Price History Methods**: Directly used in `getPriceHistory` implementation
  - **Order Book Methods**: Used in `getBook`, `getOrderBooks`, and related methods
  - **Authentication Flow**: Essential for understanding private key and funder address requirements

**Section sources**
- [src/sdk/client.ts](file://src/sdk/client.ts#L1-L388)
- [package.json](file://package.json#L1-L56)

## Model Context Protocol Specification

### Model Context Protocol (MCP) Specification
- **Description**: A protocol for enabling natural language interaction between AI models and external tools/services. Allows AI assistants to access and manipulate data through standardized interfaces.
- **URL**: https://modelcontextprotocol.io/
- **Relevance**: Foundation for the MCP server implementation in `src/mcp/polymarket.ts`. Enables AI models to query Polymarket data using natural language.
- **Key Sections**:
  - **Server Specification**: Essential for implementing the MCP server with proper tool definitions
  - **Tool Invocation**: Required for understanding how AI models call external functions
  - **Resource Management**: Important for streaming data feeds like active markets
  - **JSON Schema Integration**: Critical for type-safe tool parameter validation

### Polymarket MCP Contract
- **Description**: Custom MCP contract defining the available tools and resources for interacting with Polymarket data.
- **URL**: file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml
- **Relevance**: Defines the specific capabilities exposed to AI models, including market search and analysis tools.
- **Key Sections**:
  - **search_markets Tool**: Implements natural language market search with filtering by date, tags, and status
  - **analyze_markets Tool**: Provides market analysis capabilities like top markets by volume or liquidity
  - **Data Models**: Defines the Market and AnalysisResult schemas used in tool responses

**Section sources**
- [specs/001-write-a-mcp/contracts/polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L1-L105)
- [README.md](file://README.md#L1-L493)

## Version Compatibility Notes

- **@polymarket/clob-client v4.21.0**: Compatible with current implementation. Earlier versions may lack certain price history parameters like `fidelity`. The SDK's API key derivation method is stable in this version.
- **Elysia.js v1.3.8**: Compatible with Bun 1.0+ and TypeScript 5+. Earlier Elysia versions may have different OpenAPI generation behavior. The TypeBox integration is stable in this version range.
- **ModelContextProtocol SDK v1.18.0**: Compatible with MCP specification 1.0. Earlier versions may lack certain resource streaming capabilities.
- **Bun Runtime**: The proxy server is optimized for Bun 1.0+, though it supports Node.js, Deno, and Cloudflare Workers through compatibility layers.

**Section sources**
- [package.json](file://package.json#L1-L56)
- [README.md](file://README.md#L1-L493)

## Documentation Gaps and Supplemental Resources

### Incomplete External Documentation
- **Gamma API Documentation**: Lacks detailed examples of JSON string fields that need parsing (e.g., `outcomes`, `clobTokenIds`). The implementation in `gamma-client.ts` must handle JSON parsing of these fields.
- **CLOB API Authentication**: Documentation is sparse on the exact process for API key derivation from private keys. The implementation relies on the `clob-client` SDK to handle this complexity.
- **Rate Limiting**: Neither API documents rate limits clearly, requiring implementation of defensive caching strategies.

### Supplemental Implementation Resources
- **Unified TypeBox Schemas**: The `src/types/elysia-schemas.ts` file serves as the single source of truth for all type definitions, compensating for incomplete API documentation.
- **Caching Implementation**: The LRU cache in `client.ts` provides performance optimization not documented in the official APIs.
- **Error Normalization**: The proxy server normalizes error responses across endpoints, providing more consistent error handling than the raw APIs.
- **Data Transformation**: The `transformMarketData` and `transformEventData` methods in `gamma-client.ts` handle data normalization that is not covered in official documentation.

**Section sources**
- [src/sdk/gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)
- [src/sdk/client.ts](file://src/sdk/client.ts#L1-L388)
- [README.md](file://README.md#L1-L493)