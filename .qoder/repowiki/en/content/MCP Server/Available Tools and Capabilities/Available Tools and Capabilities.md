# Available Tools and Capabilities

<cite>
**Referenced Files in This Document**   
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [polymarket.ts](file://src/mcp/polymarket.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [/search_markets Tool](#search_markets-tool)
3. [/analyze_markets Tool](#analyze_markets-tool)
4. [Schema Definitions](#schema-definitions)
5. [Tool Usage Examples](#tool-usage-examples)
6. [Validation Rules and Error Cases](#validation-rules-and-error-cases)
7. [SDK Method Mapping](#sdk-method-mapping)
8. [Conclusion](#conclusion)

## Introduction
This document details the available tools and capabilities provided by the Polymarket MCP server for interacting with prediction market data through natural language interfaces. The system exposes two primary tools: `/search_markets` for comprehensive market discovery and `/analyze_markets` for analytical insights. These tools enable LLMs to retrieve, filter, and analyze prediction market data from Polymarket's Gamma API. The tools are implemented through a Model Context Protocol (MCP) server that translates natural language requests into API calls, processes responses, and returns structured data. The implementation includes comprehensive schema definitions, validation rules, and error handling as defined in the OpenAPI specification.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L1-L104)

## /search_markets Tool
The `/search_markets` tool enables comprehensive search across Polymarket's prediction markets using natural language queries and structured filters. This POST endpoint accepts a JSON request body containing search parameters that allow for precise market discovery. The tool supports natural language queries through the `query` parameter, which performs text-based matching against market questions and descriptions. Date range filtering is implemented through the `date_range` object with `start` and `end` properties in ISO date format, enabling temporal filtering of markets based on their start and end dates. Category filtering is supported through the `category` parameter, allowing users to narrow results to specific domains such as politics, sports, or finance. Status filtering is available via the `status` parameter with allowed values of "active" or "finished", enabling users to focus on markets currently trading or those that have concluded. Tag-based filtering is implemented through the `tags` array parameter, supporting multi-tag queries for markets that match all specified tags. The response returns an array of Market objects that match the search criteria, providing comprehensive market data for analysis.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L10-L43)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L480-L499)
- [gamma.ts](file://src/routes/gamma.ts#L680-L691)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L420-L440)

## /analyze_markets Tool
The `/analyze_markets` tool provides analytical capabilities for extracting insights from Polymarket's prediction market data. This POST endpoint accepts a JSON request body containing analysis parameters that determine the type of analysis to perform and the scope of results. The `analysis_type` parameter is a required string field with an enumeration of possible values: "top_by_volume" and "top_by_liquidity". This parameter determines the metric by which markets are ranked and analyzed. The "top_by_volume" analysis type identifies markets with the highest trading volume, indicating markets with significant user participation and interest. The "top_by_liquidity" analysis type identifies markets with the highest liquidity, indicating markets with tight bid-ask spreads and ease of trading. The `limit` parameter is an integer that specifies the maximum number of markets to include in the analysis results, with a default value of 5. This parameter allows users to control the granularity of results, balancing comprehensiveness with conciseness. The tool returns an AnalysisResult object containing the analysis type and the resulting data, enabling LLMs to understand market trends and identify significant markets based on quantitative metrics.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L44-L68)
- [polymarket.ts](file://src/mcp/polymarket.ts#L465-L515)

## Schema Definitions
### Market Schema
The Market schema defines the structure of prediction market data returned by the Polymarket API. It includes the following fields:
- `id` (string): Unique identifier for the market
- `question` (string): The market's question or proposition
- `slug` (string): Human-readable identifier for the market
- `category` (string): Categorization of the market (e.g., politics, sports)
- `active` (boolean): Indicates whether the market is currently active
- `volume` (number): Trading volume in USD
- `start_date` (string, date-time): When the market begins
- `end_date` (string, date-time): When the market concludes
- `tags` (array of strings): Classification tags associated with the market

### AnalysisResult Schema
The AnalysisResult schema defines the structure of analytical responses from the `/analyze_markets` tool:
- `type` (string): The type of analysis performed (e.g., "top_by_volume")
- `data` (object): The results of the analysis, typically containing an array of markets ranked by the specified metric

These schemas are implemented in the Elysia type system and used for request/response validation throughout the API. The Market schema is based on the `MarketSchema` defined in the elysia-schemas.ts file, while the AnalysisResult schema is implicitly defined by the tool's response structure.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L70-L104)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L100-L150)

## Tool Usage Examples
### /search_markets Examples
**Example 1: Natural Language Search**
```json
{
  "query": "Will the S&P 500 reach 5000 by end of year?"
}
```
This request searches for markets matching the natural language query about S&P 500 performance.

**Example 2: Filtered Search**
```json
{
  "query": "presidential election",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "tags": ["politics", "usa"],
  "category": "politics",
  "status": "active"
}
```
This request searches for active political markets related to presidential elections occurring in 2024, specifically tagged with "politics" and "usa".

**Expected Response:**
```json
[
  {
    "id": "mkt_123",
    "question": "Who will win the 2024 US Presidential Election?",
    "slug": "2024-us-presidential-election",
    "category": "politics",
    "active": true,
    "volume": 2500000,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-11-05T00:00:00Z",
    "tags": ["politics", "usa", "election"]
  }
]
```

### /analyze_markets Examples
**Example 1: Top by Volume**
```json
{
  "analysis_type": "top_by_volume",
  "limit": 10
}
```
This request analyzes markets to identify the top 10 by trading volume.

**Example 2: Top by Liquidity**
```json
{
  "analysis_type": "top_by_liquidity",
  "limit": 5
}
```
This request analyzes markets to identify the top 5 by liquidity.

**Expected Response:**
```json
{
  "type": "top_by_volume",
  "data": {
    "markets": [
      {
        "id": "mkt_456",
        "question": "Bitcoin price above $100k by 2025?",
        "volume": 5000000,
        "liquidity": 750000
      }
    ]
  }
}
```

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L10-L68)
- [polymarket.ts](file://src/mcp/polymarket.ts#L403-L433)

## Validation Rules and Error Cases
The tools implement comprehensive validation rules as defined in the OpenAPI specification. For `/search_markets`, the `status` parameter is restricted to the enum values "active" or "finished", and any other value will result in a validation error. The `date_range` object requires valid ISO date formats for both `start` and `end` fields, with proper date parsing and validation. The `tags` parameter accepts an array of strings with no restrictions on content, but empty arrays are treated as no filter. For `/analyze_markets`, the `analysis_type` parameter is strictly limited to "top_by_volume" or "top_by_liquidity", and any other value will trigger validation failure. The `limit` parameter must be a positive integer, with a default value of 5 if not specified. Error cases include 400 Bad Request for invalid parameters, 500 Internal Server Error for API failures, and appropriate error responses with descriptive messages. The system also handles edge cases such as empty result sets, returning an empty array rather than an error. Rate limiting and authentication are not required for these endpoints as they access public market data.

**Section sources**
- [polymarket-mcp.yml](file://specs/001-write-a-mcp/contracts/polymarket-mcp.yml#L10-L68)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L200-L250)
- [gamma.ts](file://src/routes/gamma.ts#L100-L150)

## SDK Method Mapping
The MCP tools are implemented using the GammaSDK class in gamma-client.ts, which provides a typed interface to the Polymarket Gamma API. The `/search_markets` tool maps to the `search` method of the GammaSDK, which makes HTTP GET requests to the `/public-search` endpoint with query parameters constructed from the tool's input. The `/analyze_markets` tool does not directly map to a single SDK method but is implemented through the MCP server by combining data from multiple SDK methods such as `getMarkets` and applying analytical logic to rank markets by volume or liquidity. The GammaSDK provides additional methods that support the tool functionality, including `getMarkets` for retrieving market data with filtering, `getMarketById` and `getMarketBySlug` for retrieving specific markets, and `getEvents` for retrieving related event data. These methods are used internally by the MCP server to fulfill tool requests and provide comprehensive market information. The SDK handles HTTP requests, error handling, and data transformation, ensuring type-safe interactions with the Gamma API.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L480-L499)
- [polymarket.ts](file://src/mcp/polymarket.ts#L179-L217)

## Conclusion
The Polymarket MCP server provides powerful tools for LLMs to retrieve and analyze prediction market data through natural language interfaces. The `/search_markets` tool enables comprehensive discovery of markets using natural language queries and structured filters, while the `/analyze_markets` tool provides analytical insights by identifying top markets based on volume and liquidity metrics. These tools are built on a robust foundation of well-defined schemas, validation rules, and error handling as specified in the OpenAPI contract. The implementation leverages the GammaSDK to provide type-safe access to the Polymarket Gamma API, ensuring reliable and consistent data retrieval. By exposing these capabilities through the Model Context Protocol, the system enables AI models to perform sophisticated market research, trend analysis, and data-driven decision making based on real-time prediction market data. The tools support a wide range of use cases, from market discovery and competitive analysis to trend identification and risk assessment in the prediction market ecosystem.