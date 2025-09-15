# Data Model: Polymarket MCP Server

This document defines the data entities for the Polymarket MCP Server.

## Entities

### UserQuery
Represents a natural language query from a user.

- `query`: string - The user's query.

### Market
Represents a Polymarket market.

- `id`: string - The market ID.
- `question`: string - The market question.
- `slug`: string - The market slug.
- `category`: string - The market category.
- `active`: boolean - Whether the market is active.
- `volume`: number - The market volume.
- `start_date`: string - The market start date.
- `end_date`: string - The market end date.
- `tags`: string[] - The market tags.

### AnalysisResult
Represents the result of a data analysis.

- `type`: string - The type of analysis (e.g., "top_markets", "market_volume").
- `data`: any - The analysis data.

### Response
Represents a response to a user query.

- `text`: string - The natural language response.
- `markdown`: string (optional) - A markdown representation of the data.
