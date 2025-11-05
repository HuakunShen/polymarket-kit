# WebSocket Client Integration

Easy-to-use WebSocket clients for real-time Polymarket market data in both TypeScript and Go.

## Overview

The `PolymarketWebSocketClient` provides a simple, high-level interface for subscribing to real-time market data. It handles authentication, connection management, reconnection logic, and message parsing automatically.

## Features

✅ **Automatic Authentication** - Handles API key derivation automatically  
✅ **Type-Safe Messages** - Full TypeScript/Go type safety with validation  
✅ **Auto-Reconnect** - Configurable automatic reconnection on disconnect  
✅ **Event Handlers** - Simple callback-based API for different message types  
✅ **Connection Management** - Easy connect/disconnect/subscribe methods  
✅ **Debug Logging** - Optional debug logging for troubleshooting  

## Quick Start

### TypeScript

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { PolymarketWebSocketClient } from "@hk/polymarket";

const signer = new Wallet(process.env.POLYMARKET_KEY!);
const clobClient = new ClobClient("https://clob.polymarket.com", 137, signer);

const ws = new PolymarketWebSocketClient(clobClient, {
  assetIds: ["60487116984468020978247225474488676749601001829886755968952521846780452448915"],
  autoReconnect: true,
  debug: true,
});

ws.on({
  onBook: (msg) => console.log(`Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`),
  onPriceChange: (msg) => console.log(`${msg.price_changes.length} price changes`),
});

await ws.connect();
```

### Go

```go
import (
    "github.com/HuakunShen/polymarket-kit/go-client/client"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
)

config := &client.ClientConfig{
    Host:       "https://clob.polymarket.com",
    ChainID:    types.ChainPolygon,
    PrivateKey: os.Getenv("POLYMARKET_KEY"),
}

clobClient, _ := client.NewClobClient(config)

wsClient := client.NewWebSocketClient(clobClient, &client.WebSocketClientOptions{
    AssetIDs: []string{
        "60487116984468020978247225474488676749601001829886755968952521846780452448915",
    },
    AutoReconnect: true,
    Debug:         true,
})

wsClient.On(&client.WebSocketCallbacks{
    OnBook: func(msg *types.BookMessage) {
        fmt.Printf("Bids: %d, Asks: %d\n", len(msg.Bids), len(msg.Asks))
    },
    OnPriceChange: func(msg *types.PriceChangeMessage) {
        fmt.Printf("%d price changes\n", len(msg.PriceChanges))
    },
})

wsClient.Connect()
```

## Configuration

### TypeScript Options

```typescript
interface WebSocketClientOptions {
  assetIds?: string[];              // Asset IDs to subscribe to
  markets?: string[];                // Market IDs (for user channel)
  autoReconnect?: boolean;          // Auto-reconnect on disconnect (default: true)
  reconnectDelay?: number;          // Delay in ms (default: 5000)
  maxReconnectAttempts?: number;    // Max attempts (default: Infinity)
  debug?: boolean;                  // Enable debug logging (default: false)
}
```

### Go Options

```go
type WebSocketClientOptions struct {
    AssetIDs             []string      // Asset IDs to subscribe to
    Markets              []string      // Market IDs (for user channel)
    AutoReconnect        bool          // Auto-reconnect on disconnect
    ReconnectDelay       time.Duration // Reconnection delay
    MaxReconnectAttempts int           // Max attempts (0 = infinite)
    Debug                bool          // Enable debug logging
    Logger               *log.Logger   // Custom logger
}
```

## Event Handlers

### TypeScript

```typescript
ws.on({
  // Specific message type handlers
  onBook: (msg: BookMessage) => {
    console.log("Book update:", msg.bids.length, msg.asks.length);
  },
  
  onPriceChange: (msg: PriceChangeMessage) => {
    for (const change of msg.price_changes) {
      console.log(`${change.side} @ ${change.price}`);
    }
  },
  
  onTickSizeChange: (msg: TickSizeChangeMessage) => {
    console.log(`Tick size: ${msg.old_tick_size} → ${msg.new_tick_size}`);
  },
  
  onLastTradePrice: (msg: LastTradePriceMessage) => {
    console.log(`Trade: ${msg.side} @ ${msg.price}`);
  },
  
  // General message handler (receives all messages)
  onMessage: (msg: MarketChannelMessage) => {
    console.log("Message type:", msg.event_type);
  },
  
  // Connection lifecycle events
  onConnect: () => console.log("Connected"),
  onDisconnect: (code, reason) => console.log(`Disconnected: ${code}`),
  onReconnect: (attempt) => console.log(`Reconnecting... (${attempt})`),
  onError: (error) => console.error("Error:", error),
});
```

### Go

```go
wsClient.On(&client.WebSocketCallbacks{
    OnBook: func(msg *types.BookMessage) {
        fmt.Printf("Book update: %d bids, %d asks\n", len(msg.Bids), len(msg.Asks))
    },
    
    OnPriceChange: func(msg *types.PriceChangeMessage) {
        for _, change := range msg.PriceChanges {
            fmt.Printf("%s @ %s\n", change.Side, change.Price)
        }
    },
    
    OnTickSizeChange: func(msg *types.TickSizeChangeMessage) {
        fmt.Printf("Tick size: %s → %s\n", msg.OldTickSize, msg.NewTickSize)
    },
    
    OnLastTradePrice: func(msg *types.LastTradePriceMessage) {
        fmt.Printf("Trade: %s @ %s\n", msg.Side, msg.Price)
    },
    
    OnMessage: func(msg types.MarketChannelMessage) {
        fmt.Printf("Message type: %s\n", msg.GetEventType())
    },
    
    OnConnect: func() {
        fmt.Println("Connected")
    },
    
    OnDisconnect: func(code int, reason string) {
        fmt.Printf("Disconnected: %d\n", code)
    },
    
    OnReconnect: func(attempt int) {
        fmt.Printf("Reconnecting... (%d)\n", attempt)
    },
    
    OnError: func(err error) {
        fmt.Printf("Error: %v\n", err)
    },
})
```

## Connection Management

### TypeScript

```typescript
// Connect
await ws.connect();

// Check connection status
if (ws.isConnected()) {
  console.log("Connected!");
}

// Subscribe to additional assets
ws.subscribe(["asset-id-1", "asset-id-2"]);

// Unsubscribe from assets
ws.unsubscribe(["asset-id-1"]);

// Disconnect
ws.disconnect();
```

### Go

```go
// Connect
err := wsClient.Connect()

// Check connection status
if wsClient.IsConnected() {
    fmt.Println("Connected!")
}

// Subscribe to additional assets
wsClient.Subscribe([]string{"asset-id-1", "asset-id-2"})

// Unsubscribe from assets
wsClient.Unsubscribe([]string{"asset-id-1"})

// Wait for disconnect (blocks)
wsClient.Wait()

// Disconnect
wsClient.Disconnect()
```

## Complete Examples

### TypeScript - Trading Bot

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { PolymarketWebSocketClient } from "@hk/polymarket";

async function runTradingBot() {
  const signer = new Wallet(process.env.POLYMARKET_KEY!);
  const clobClient = new ClobClient("https://clob.polymarket.com", 137, signer);

  const ws = new PolymarketWebSocketClient(clobClient, {
    assetIds: [
      "60487116984468020978247225474488676749601001829886755968952521846780452448915",
    ],
    autoReconnect: true,
    maxReconnectAttempts: 5,
  });

  ws.on({
    onBook: (msg) => {
      // Analyze orderbook
      const bestBid = msg.bids[msg.bids.length - 1];
      const bestAsk = msg.asks[0];
      const spread = Number(bestAsk.price) - Number(bestBid.price);
      
      if (spread > 0.05) {
        console.log("Large spread detected:", spread);
        // Place orders...
      }
    },

    onLastTradePrice: (msg) => {
      console.log(`Trade executed: ${msg.side} @ ${msg.price}`);
      // Update trading strategy...
    },

    onError: (error) => {
      console.error("Error:", error);
      // Handle error, possibly alert...
    },
  });

  await ws.connect();
  
  // Handle graceful shutdown
  process.on("SIGINT", () => {
    ws.disconnect();
    process.exit(0);
  });
}

runTradingBot();
```

### Go - Market Monitor

```go
package main

import (
    "fmt"
    "os"
    "os/signal"
    "time"

    "github.com/HuakunShen/polymarket-kit/go-client/client"
    "github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
    config := &client.ClientConfig{
        Host:       "https://clob.polymarket.com",
        ChainID:    types.ChainPolygon,
        PrivateKey: os.Getenv("POLYMARKET_KEY"),
    }

    clobClient, _ := client.NewClobClient(config)

    wsClient := client.NewWebSocketClient(clobClient, &client.WebSocketClientOptions{
        AssetIDs: []string{
            "60487116984468020978247225474488676749601001829886755968952521846780452448915",
        },
        AutoReconnect:        true,
        MaxReconnectAttempts: 5,
    })

    // Track market statistics
    tradeCount := 0
    var lastPrice string

    wsClient.On(&client.WebSocketCallbacks{
        OnBook: func(msg *types.BookMessage) {
            fmt.Printf("Orderbook depth - Bids: %d, Asks: %d\n",
                len(msg.Bids), len(msg.Asks))
        },

        OnLastTradePrice: func(msg *types.LastTradePriceMessage) {
            tradeCount++
            lastPrice = msg.Price
            fmt.Printf("Trade #%d: %s @ %s (size: %s)\n",
                tradeCount, msg.Side, msg.Price, msg.Size)
        },

        OnError: func(err error) {
            fmt.Printf("Error: %v\n", err)
        },
    })

    wsClient.Connect()

    // Periodic stats
    ticker := time.NewTicker(1 * time.Minute)
    go func() {
        for range ticker.C {
            fmt.Printf("Stats - Trades: %d, Last Price: %s\n",
                tradeCount, lastPrice)
        }
    }()

    // Wait for interrupt
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt)
    <-sigChan

    ticker.Stop()
    wsClient.Disconnect()
}
```

## Error Handling

### TypeScript

```typescript
ws.on({
  onError: (error) => {
    // Log error
    console.error("WebSocket error:", error);
    
    // Send to monitoring service
    monitoringService.logError(error);
    
    // Optionally disconnect on critical errors
    if (error.message.includes("authentication")) {
      ws.disconnect();
    }
  },
  
  onDisconnect: (code, reason) => {
    console.log(`Disconnected with code ${code}: ${reason}`);
    
    // Normal closure
    if (code === 1000) {
      console.log("Normal disconnect");
    }
    // Abnormal closure
    else {
      console.error("Abnormal disconnect, will reconnect...");
    }
  },
});
```

### Go

```go
wsClient.On(&client.WebSocketCallbacks{
    OnError: func(err error) {
        log.Printf("WebSocket error: %v", err)
        
        // Send to monitoring service
        monitoringService.LogError(err)
        
        // Optionally disconnect on critical errors
        if strings.Contains(err.Error(), "authentication") {
            wsClient.Disconnect()
        }
    },
    
    OnDisconnect: func(code int, reason string) {
        log.Printf("Disconnected with code %d: %s", code, reason)
        
        // Normal closure
        if code == 1000 {
            log.Println("Normal disconnect")
        } else {
            log.Println("Abnormal disconnect, will reconnect...")
        }
    },
})
```

## Advanced Usage

### Dynamic Subscription Management

```typescript
// Start with one asset
const ws = new PolymarketWebSocketClient(clobClient, {
  assetIds: ["asset-1"],
});

await ws.connect();

// Add more assets dynamically
ws.subscribe(["asset-2", "asset-3"]);

// Remove assets
ws.unsubscribe(["asset-1"]);
```

### Custom Reconnection Logic

```typescript
let reconnectCount = 0;

ws.on({
  onReconnect: (attempt) => {
    reconnectCount++;
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    console.log(`Reconnecting in ${delay}ms...`);
    
    // Alert after multiple failures
    if (reconnectCount > 3) {
      alertService.send("WebSocket connection unstable");
    }
  },
  
  onConnect: () => {
    reconnectCount = 0; // Reset on successful connection
  },
});
```

## Troubleshooting

### Connection Issues

Enable debug logging to see detailed connection information:

```typescript
const ws = new PolymarketWebSocketClient(clobClient, {
  debug: true, // Enable debug logs
});
```

```go
wsClient := client.NewWebSocketClient(clobClient, &client.WebSocketClientOptions{
    Debug: true, // Enable debug logs
})
```

### Authentication Errors

Ensure your private key has API access:
- The account must be whitelisted on Polymarket
- The private key must correspond to an approved account
- Check that you're using the correct chain ID (137 for Polygon)

### Message Validation Errors

If you receive validation errors, the message format may have changed. Check:
- You're using the latest version of the SDK
- The message matches the [official documentation](https://docs.polymarket.com/developers/CLOB/websocket/market-channel)

## API Reference

See [WebSocket Schemas Documentation](./WEBSOCKET_SCHEMAS.md) for detailed message schemas and validation.

## See Also

- [WebSocket Schemas](./WEBSOCKET_SCHEMAS.md) - Message type definitions
- [TypeScript Example](../examples/websocket-simple.ts) - Complete TypeScript example
- [Go Example](../go-client/examples/websocket_simple.go) - Complete Go example
- [Official Docs](https://docs.polymarket.com/developers/CLOB/websocket/market-channel) - Polymarket WebSocket API

