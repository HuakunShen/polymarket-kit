# Quickstart: Polymarket MCP Server

This document provides instructions on how to use the Polymarket MCP Server.

## Prerequisites

- The Polymarket MCP Server is running.

## Asking a question

To ask a question, send a POST request to the `/query` endpoint with a JSON payload containing your query.

**Example**:

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the top 5 markets by volume?"}'
```

## Response

The server will respond with a JSON object containing the answer to your question.

**Example**:

```json
{
  "text": "The top 5 markets by volume are:",
  "markdown": "| Question | Volume |\n|---|---|
| Market 1 | 1000000 |
| Market 2 | 900000 |
| Market 3 | 800000 |
| Market 4 | 700000 |
| Market 5 | 600000 |"
}
```

