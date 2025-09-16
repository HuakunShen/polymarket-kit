# Gemini CLI: Polymarket MCP Server

This document provides instructions on how to use the Polymarket MCP Server with the Gemini CLI and other MCP-compatible clients.

## Overview

The Polymarket MCP Server provides a natural language interface to Polymarket's prediction market data through the Model Context Protocol (MCP). It exposes comprehensive tools and resources for analyzing markets, events, and trends.

## Available Tools

The following tools are available for interacting with Polymarket data:

### Market Analysis Tools

- `get_markets`: Search and filter prediction markets
- `get_market_by_id`: Get detailed market information by ID
- `get_market_by_slug`: Get market information by slug identifier

### Event Management Tools

- `get_events`: Search and filter events with comprehensive filtering
- `get_event_by_id`: Get detailed event information including associated markets
- `get_event_markdown`: Convert event data to markdown format optimized for AI analysis

### Search and Discovery Tools

- `search_polymarket`: Perform comprehensive search across markets, events, and profiles
- `get_tags`: Retrieve available tags for categorization and filtering

### Analytics and Aggregation Tools

- `get_market_trends`: Analyze market trends and patterns over specified timeframes
- `get_popular_markets`: Identify trending and popular markets based on volume and activity

## Available Resources

The server provides real-time data feeds through MCP resources:

- `markets://active`: Live feed of active prediction markets
- `events://featured`: Curated list of featured events and tournaments

## Usage Examples

### Basic Market Search

```
Use the get_markets tool to find active markets:
- Get 10 active markets
- Filter by tag_id if needed
- Show only markets that are not closed
```

**Example Parameters:**
```json
{
  "limit": 10,
  "active": true,
  "closed": false
}
```

### Search for Specific Markets

```
Search for markets about a specific topic:
- Use search_polymarket with a query term
- Limit results per category
- Filter by status
```

**Example Parameters:**
```json
{
  "q": "election 2024",
  "limit_per_type": 5,
  "events_status": "active"
}
```

### Get Detailed Event Information

```
Retrieve comprehensive event details:
- Get event by ID with all associated markets
- Include chat/comment data if needed
- Format as markdown for analysis
```

**Example Parameters for get_event_by_id:**
```json
{
  "id": 123,
  "include_chat": true
}
```

**Example Parameters for get_event_markdown:**
```json
{
  "id": 123,
  "verbose": 2,
  "include_markets": true
}
```

### Market Trend Analysis

```
Analyze market trends and identify popular markets:
- Use get_market_trends for trend analysis
- Use get_popular_markets for volume-based rankings
- Specify timeframes and filters
```

**Example Parameters for get_market_trends:**
```json
{
  "timeframe": "24h",
  "min_volume": 1000
}
```

**Example Parameters for get_popular_markets:**
```json
{
  "period": "7d",
  "limit": 15
}
```

### Explore Categories and Tags

```
Discover available categories and tags:
- Use get_tags to see all available tags
- Filter for carousel tags or paginate results
- Use tags to filter other queries
```

**Example Parameters:**
```json
{
  "limit": 20,
  "is_carousel": true
}
```

## Natural Language Query Examples

You can interact with the MCP server using natural language. Here are example queries:

### Market Discovery
- "Show me the most active prediction markets right now"
- "Find markets about the 2024 US election"
- "What are the trending markets in the last 24 hours?"
- "Get me markets with high volume in the politics category"

### Event Analysis
- "Give me details about event ID 456 in markdown format"
- "What are the featured events happening this week?"
- "Show me all markets for the World Cup event"
- "Find events related to cryptocurrency"

### Market Research
- "Analyze market trends for the past week"
- "What are the most popular markets by trading volume?"
- "Show me markets that have seen significant price changes"
- "Find markets with the highest liquidity"

### Data Exploration
- "What tags are available for filtering markets?"
- "Search for anything related to 'climate change'"
- "Show me markets that are closing soon"
- "Find the most recently created events"

## Integration with Gemini CLI

To use with Gemini CLI, configure the MCP server in your client configuration:

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "bun",
      "args": ["run", "path/to/polymarket-kit/src/mcp/polymarket.ts"]
    }
  }
}
```

## Error Handling

The MCP server includes comprehensive error handling:

- **API Errors**: Graceful handling of Polymarket API unavailability
- **Validation Errors**: Clear feedback for invalid parameters
- **Network Issues**: Robust error reporting with context
- **Data Issues**: Handling of missing or malformed data

## Performance Considerations

- **Caching**: The server implements intelligent caching for frequently requested data
- **Rate Limiting**: Respects Polymarket API rate limits
- **Batch Operations**: Optimizes multiple related requests
- **Resource Management**: Efficient memory and connection management

## Development and Testing

Run tests to ensure the MCP server is working correctly:

```bash
bun test src/__tests__/mcp/polymarket.test.ts
```

Start the server for development:

```bash
bun run src/mcp/polymarket.ts
```

## Support and Documentation

For additional support:
- Check the main README.md for general project information
- Review the TypeScript types in `src/types/elysia-schemas.ts`
- Examine the GammaSDK documentation in `src/sdk/`
- Look at test examples in `src/__tests__/mcp/`

```
> polymarket.search_markets(query="politics")
```

**Analyze markets**

```
> polymarket.analyze_markets(analysis_type="top_by_volume", limit=10)
```

**Natural language query**

```
> polymarket.natural_language_query(query="What are the top 5 markets by volume?")
```