# WebSocket Message Schemas

This document describes the WebSocket message schemas for Polymarket's market channel, implemented in both TypeScript (with Zod validation) and Go.

## Overview

The Polymarket CLOB provides real-time market data through WebSocket connections. This library provides type-safe schemas and validators for all message types according to the [official documentation](https://docs.polymarket.com/developers/CLOB/websocket/market-channel).

## Message Types

### 1. Book Message

Full orderbook snapshot or update, emitted when:
- First subscribed to a market
- When there is a trade that affects the book

**TypeScript:**
```typescript
import { BookMessage, isBookMessage, parseMarketChannelMessage } from "@hk/polymarket";

const msg = parseMarketChannelMessage(data);
if (isBookMessage(msg)) {
  console.log(`Market: ${msg.market}`);
  console.log(`Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`);
  console.log(`Best Bid: ${msg.bids[msg.bids.length - 1]?.price}`);
  console.log(`Best Ask: ${msg.asks[0]?.price}`);
}
```

**Go:**
```go
import "github.com/HuakunShen/polymarket-kit/go-client/types"

msg, err := types.ParseMarketChannelMessage([]byte(data))
if err != nil {
    log.Fatal(err)
}

if bookMsg, ok := types.AsBookMessage(msg); ok {
    fmt.Printf("Market: %s\n", bookMsg.Market)
    fmt.Printf("Bids: %d, Asks: %d\n", len(bookMsg.Bids), len(bookMsg.Asks))
}
```

### 2. Price Change Message

Price level changes, emitted when:
- A new order is placed
- An order is cancelled

**TypeScript:**
```typescript
import { isPriceChangeMessage } from "@hk/polymarket";

if (isPriceChangeMessage(msg)) {
  for (const change of msg.price_changes) {
    console.log(`${change.side} @ ${change.price} (size: ${change.size})`);
    console.log(`Best Bid: ${change.best_bid}, Best Ask: ${change.best_ask}`);
  }
}
```

**Go:**
```go
if pcMsg, ok := types.AsPriceChangeMessage(msg); ok {
    for _, change := range pcMsg.PriceChanges {
        fmt.Printf("%s @ %s (size: %s)\n", change.Side, change.Price, change.Size)
    }
}
```

### 3. Tick Size Change Message

Minimum tick size update, emitted when:
- The book's price reaches limits (price > 0.96 or price < 0.04)

**TypeScript:**
```typescript
import { isTickSizeChangeMessage } from "@hk/polymarket";

if (isTickSizeChangeMessage(msg)) {
  console.log(`Tick size: ${msg.old_tick_size} → ${msg.new_tick_size}`);
}
```

**Go:**
```go
if tsMsg, ok := types.AsTickSizeChangeMessage(msg); ok {
    fmt.Printf("Tick size: %s → %s\n", tsMsg.OldTickSize, tsMsg.NewTickSize)
}
```

### 4. Last Trade Price Message

Trade execution event, emitted when:
- A maker and taker order is matched creating a trade event

**TypeScript:**
```typescript
import { isLastTradePriceMessage } from "@hk/polymarket";

if (isLastTradePriceMessage(msg)) {
  console.log(`Trade: ${msg.side} @ ${msg.price} (size: ${msg.size})`);
  console.log(`Fee: ${msg.fee_rate_bps} bps`);
}
```

**Go:**
```go
if ltMsg, ok := types.AsLastTradePriceMessage(msg); ok {
    fmt.Printf("Trade: %s @ %s (size: %s)\n", ltMsg.Side, ltMsg.Price, ltMsg.Size)
}
```

## Complete Examples

### TypeScript with Zod Validation

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import WebSocket from "ws";
import {
  parseMarketChannelMessage,
  safeParseMarketChannelMessage,
  isBookMessage,
  isPriceChangeMessage,
  type MarketChannelMessage,
} from "@hk/polymarket";

const signer = new Wallet(process.env.POLYMARKET_KEY!);
const clobClient = new ClobClient("https://clob.polymarket.com", 137, signer);

async function main() {
  const apiKey = await clobClient.deriveApiKey();
  
  const ws = new WebSocket("wss://ws-subscriptions-clob.polymarket.com/ws/market");
  
  ws.on("open", () => {
    ws.send(JSON.stringify({
      assets_ids: ["60487116984468020978247225474488676749601001829886755968952521846780452448915"],
      type: "market",
    }));
  });
  
  ws.on("message", (data: WebSocket.Data) => {
    const rawData = JSON.parse(data.toString());
    
    // Safe parsing with validation
    const result = safeParseMarketChannelMessage(rawData);
    
    if (!result.success) {
      console.error("Validation failed:", result.error.issues);
      return;
    }
    
    const msg = result.data;
    
    // Type-safe message handling
    if (isBookMessage(msg)) {
      console.log("📚 Book Update");
      console.log(`  Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`);
    } else if (isPriceChangeMessage(msg)) {
      console.log("💹 Price Change");
      msg.price_changes.forEach(change => {
        console.log(`  ${change.side} @ ${change.price}`);
      });
    }
  });
}

main();
```

### Go with Type Validation

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    
    "github.com/HuakunShen/polymarket-kit/go-client/client"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
    "github.com/gorilla/websocket"
)

func main() {
    // Create client and derive API key
    config := &client.ClientConfig{
        Host:       "https://clob.polymarket.com",
        ChainID:    types.ChainPolygon,
        PrivateKey: os.Getenv("POLYMARKET_KEY"),
    }
    clobClient, _ := client.NewClobClient(config)
    apiKey, _ := clobClient.DeriveApiKey(nil)
    
    // Connect to WebSocket
    conn, _, _ := websocket.DefaultDialer.Dial(
        "wss://ws-subscriptions-clob.polymarket.com/ws/market", nil)
    
    // Subscribe
    conn.WriteJSON(map[string]interface{}{
        "assets_ids": []string{
            "60487116984468020978247225474488676749601001829886755968952521846780452448915",
        },
        "type": "market",
    })
    
    // Handle messages
    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            log.Fatal(err)
        }
        
        // Parse and validate
        msg, err := types.ParseMarketChannelMessage(message)
        if err != nil {
            log.Printf("Parse error: %v", err)
            continue
        }
        
        // Type-safe message handling
        switch msg.GetEventType() {
        case types.EventTypeBook:
            if bookMsg, ok := types.AsBookMessage(msg); ok {
                fmt.Printf("📚 Book Update - Bids: %d, Asks: %d\n",
                    len(bookMsg.Bids), len(bookMsg.Asks))
            }
        case types.EventTypePriceChange:
            if pcMsg, ok := types.AsPriceChangeMessage(msg); ok {
                fmt.Printf("💹 Price Change - %d changes\n",
                    len(pcMsg.PriceChanges))
            }
        }
    }
}
```

## Schema Fields

### OrderSummary
```typescript
{
  price: string;  // Price level
  size: string;   // Size available at that price
}
```

### BookMessage
```typescript
{
  event_type: "book";
  asset_id: string;        // Token ID
  market: string;          // Condition ID
  timestamp: string;       // Unix timestamp in milliseconds
  hash: string;            // Orderbook hash
  bids: OrderSummary[];    // Buy orders
  asks: OrderSummary[];    // Sell orders
}
```

### PriceChange
```typescript
{
  asset_id: string;
  price: string;
  size: string;
  side: "BUY" | "SELL";
  hash: string;
  best_bid: string;
  best_ask: string;
}
```

### PriceChangeMessage
```typescript
{
  event_type: "price_change";
  market: string;
  price_changes: PriceChange[];
  timestamp: string;
}
```

### TickSizeChangeMessage
```typescript
{
  event_type: "tick_size_change";
  asset_id: string;
  market: string;
  old_tick_size: string;
  new_tick_size: string;
  timestamp: string;
}
```

### LastTradePriceMessage
```typescript
{
  event_type: "last_trade_price";
  asset_id: string;
  market: string;
  price: string;
  side: "BUY" | "SELL";
  size: string;
  fee_rate_bps: string;
  timestamp: string;
}
```

## Validation

### TypeScript (Zod)

The TypeScript implementation uses [Zod](https://github.com/colinhacks/zod) for runtime validation:

```typescript
import { safeParseMarketChannelMessage } from "@hk/polymarket";

const result = safeParseMarketChannelMessage(unknownData);

if (result.success) {
  // data is fully typed and validated
  const msg = result.data;
} else {
  // Detailed validation errors
  console.error(result.error.issues);
}
```

### Go

The Go implementation provides built-in validation:

```go
msg, err := types.ParseMarketChannelMessage(data)
if err != nil {
    // err contains validation details
    log.Printf("Validation failed: %v", err)
}

// Validate individual messages
if err := msg.Validate(); err != nil {
    log.Printf("Invalid message: %v", err)
}
```

## API Reference

### TypeScript

- `parseMarketChannelMessage(data: unknown): MarketChannelMessage` - Parse and validate (throws on error)
- `safeParseMarketChannelMessage(data: unknown)` - Safe parse with result object
- `isBookMessage(msg): msg is BookMessage` - Type guard
- `isPriceChangeMessage(msg): msg is PriceChangeMessage` - Type guard
- `isTickSizeChangeMessage(msg): msg is TickSizeChangeMessage` - Type guard
- `isLastTradePriceMessage(msg): msg is LastTradePriceMessage` - Type guard

### Go

- `ParseMarketChannelMessage(data []byte) (MarketChannelMessage, error)` - Parse and validate
- `AsBookMessage(msg) (*BookMessage, bool)` - Type assertion
- `AsPriceChangeMessage(msg) (*PriceChangeMessage, bool)` - Type assertion
- `AsTickSizeChangeMessage(msg) (*TickSizeChangeMessage, bool)` - Type assertion
- `AsLastTradePriceMessage(msg) (*LastTradePriceMessage, bool)` - Type assertion

## See Also

- [Official WebSocket Documentation](https://docs.polymarket.com/developers/CLOB/websocket/market-channel)
- [TypeScript Example](../examples/websocket-typed.ts)
- [Go Example](../go-client/examples/websocket_subscription.go)

