# WebSocket Examples

This directory contains examples of how to use the Polymarket WebSocket API with the PolymarketWebSocketClient.

## Examples

### 1. websocket-simple.ts

A basic example demonstrating the easiest way to connect to the Polymarket WebSocket API:

- Uses PolymarketWebSocketClient with minimal configuration
- Dynamically fetches recent CLOB tokens from active events
- Includes TypeScript types for better type safety
- Simple event handlers with basic logging

**Key Features:**
- Dynamically fetches recent tokens (not hardcoded)
- Simple connection and message handling
- Proper error handling and graceful shutdown

### 2. websocket-typed.ts

An example that shows more detailed type-safe message handling:

- Uses PolymarketWebSocketClient with hardcoded token IDs
- Detailed type-safe message handling with discriminated unions
- More comprehensive logging of message properties
- Demonstrates how to handle different message types

**Key Features:**
- Type-safe message parsing using discriminated unions
- Detailed message handling for each event type
- Clean separation of handling logic into functions

### 3. websocket-dynamic.ts

A comprehensive example that combines the best of both worlds:

- Uses PolymarketWebSocketClient with dynamic token fetching
- Detailed type-safe message handling
- Enhanced logging with calculated spreads
- Follows recent events instead of hardcoded tokens

**Key Features:**
- Dynamic token fetching from recent active events
- Type-safe message handling with detailed logging
- Enhanced market data visualization (spreads, etc.)
- Easy to modify for different use cases

### 4. websocket-refresh.ts

An advanced example that periodically refreshes the tokens it's subscribed to:

- Automatically refreshes subscription list every 5 minutes
- Always listening to the most recent active markets
- Graceful handling of token updates
- Type-safe message handling

**Key Features:**
- Periodic token refresh to stay current
- Detects and applies token changes
- Maintains stable connection while updating subscriptions
- Robust error handling

## Usage

All examples require the `POLYMARKET_KEY` environment variable to be set with your private key:

```bash
export POLYMARKET_KEY="your_private_key_here"
```

Then run any example:

```bash
# Run the simple example
bun run examples/websocket/websocket-simple.ts

# Run the typed example
bun run examples/websocket/websocket-typed.ts

# Run the dynamic example
bun run examples/websocket/websocket-dynamic.ts

# Run the refresh example
bun run examples/websocket/websocket-refresh.ts
```

Alternatively, you can navigate to the examples directory and run:

```bash
cd examples/websocket
bun run websocket-simple.ts
```

## Message Types

All examples handle these message types:

1. **Book Messages**: Full orderbook snapshots or updates
2. **Price Change Messages**: Individual price level changes
3. **Tick Size Change Messages**: Minimum tick size updates
4. **Last Trade Price Messages**: Trade execution events

## Choosing the Right Example

- **For beginners**: Start with `websocket-simple.ts` to understand the basics
- **For learning about message types**: Use `websocket-typed.ts` to see detailed message handling
- **For production use**: Use `websocket-dynamic.ts` for a balance of features
- **For real-time applications**: Use `websocket-refresh.ts` to always stay current

## Customization

You can customize each example by:

- Changing the number of tokens to subscribe to
- Modifying the event filters (e.g., limit: 20 for more events)
- Adjusting the refresh interval in the refresh example
- Adding additional message processing logic