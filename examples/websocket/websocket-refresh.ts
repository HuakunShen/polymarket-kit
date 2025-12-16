/**
 * Dynamic WebSocket example with periodic token refresh
 *
 * This example extends the dynamic WebSocket client by periodically refreshing
 * the list of tokens it subscribes to, ensuring you always listen to the
 * most recent active markets.
 */

import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { GammaSDK, PolymarketWebSocketClient } from "../../src/sdk";
import type {
  BookMessage,
  PriceChangeMessage,
  TickSizeChangeMessage,
  LastTradePriceMessage,
} from "../../src/types/websocket-schemas";

async function main() {
  // Initialize Gamma SDK to fetch recent events
  const gammaSdk = new GammaSDK();
  
  console.log("🔍 Fetching initial active events...");
  let events = await gammaSdk.getActiveEvents({ limit: 15, closed: false });
  
  // Extract all clobTokenIds from recent events
  let clobTokens = events.flatMap((evt) =>
    evt.markets.flatMap((market) => market.clobTokenIds)
  );
  
  if (!clobTokens?.length || clobTokens.length === 0) {
    throw new Error("No clob tokens found in recent events");
  }
  
  console.log(`📋 Found ${clobTokens.length} tokens from ${events.length} events`);
  
  // Initialize CLOB client with your private key
  const host = "https://clob.polymarket.com";
  if (!process.env.POLYMARKET_KEY) {
    throw new Error("POLYMARKET_KEY environment variable is required");
  }
  const signer = new Wallet(process.env.POLYMARKET_KEY!);
  const clobClient = new ClobClient(host, 137, signer);

  // Create WebSocket client with dynamically fetched asset IDs
  // Limit to first 10 tokens to avoid overwhelming connection
  const tokenLimit = Math.min(clobTokens.length, 10);
  const ws = new PolymarketWebSocketClient(clobClient, {
    assetIds: (clobTokens as string[]).slice(0, tokenLimit),
    autoReconnect: true,
    debug: false, // Set to true for detailed logging
  });

  console.log(`🔌 Subscribing to initial ${tokenLimit} recent tokens...`);

  // Store current tokens to detect changes
  let currentTokens = (clobTokens as string[]).slice(0, tokenLimit);

  // Register event handlers
  ws.on({
    onConnect: () => {
      console.log("✅ Connected to Polymarket WebSocket");
      console.log(`📡 Listening for market data on ${currentTokens.length} tokens...`);
    },

    onBook: (msg: BookMessage) => {
      console.log(
        `📚 Book Update - Market: ${msg.market.substring(0, 20)}... - ` +
        `Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`
      );
    },

    onPriceChange: (msg: PriceChangeMessage) => {
      console.log(
        `💹 Price Change - Market: ${msg.market.substring(0, 20)}... - ` +
        `${msg.price_changes.length} change(s)`
      );
    },

    onTickSizeChange: (msg: TickSizeChangeMessage) => {
      console.log(
        `📏 Tick Size Change - Market: ${msg.market.substring(0, 20)}...`
      );
    },

    onLastTradePrice: (msg: LastTradePriceMessage) => {
      console.log(
        `💰 Trade - Market: ${msg.market.substring(0, 20)}... - ` +
        `${msg.side} @ ${msg.price} (size: ${msg.size})`
      );
    },

    onError: (error) => {
      console.error("❌ WebSocket Error:", error.message);
    },

    onDisconnect: (code, reason) => {
      console.log(`👋 Disconnected: ${code} - ${reason}`);
    },

    onReconnect: (attempt) => {
      console.log(`🔄 Reconnecting... (attempt ${attempt})`);
    },
  });

  // Connect to WebSocket
  await ws.connect();

  // Set up periodic refresh of tokens
  const refreshInterval = setInterval(async () => {
    try {
      console.log("\n🔄 Refreshing tokens...");
      
      // Fetch latest events
      events = await gammaSdk.getActiveEvents({ limit: 15, closed: false });
      clobTokens = events.flatMap((evt) =>
        evt.markets.flatMap((market) => market.clobTokenIds)
      );
      
      if (clobTokens.length === 0) {
        console.log("⚠️ No tokens found during refresh");
        return;
      }
      
      // Get top tokens (same limit as initial)
      const newTokens = clobTokens.slice(0, tokenLimit);
      
      // Check if tokens have changed
      const tokensChanged = JSON.stringify(newTokens.sort()) !== JSON.stringify(currentTokens.sort());
      
      if (tokensChanged) {
        console.log(`📝 Tokens changed! Updating from ${currentTokens.length} to ${newTokens.length} tokens`);
        
        // Update current tokens
        currentTokens = newTokens;
        
        // Subscribe to new tokens
        ws.subscribe(currentTokens);
        
        console.log("✅ Updated subscription with new tokens");
      } else {
        console.log("ℹ️ No token changes detected");
      }
    } catch (error) {
      console.error("❌ Error refreshing tokens:", error);
    }
  }, 5 * 60 * 1000); // Refresh every 5 minutes

  console.log("📡 Listening for market data... Tokens refresh every 5 minutes");
  console.log("Press Ctrl+C to exit");

  // Handle graceful shutdown
  const shutdown = () => {
    clearInterval(refreshInterval);
    console.log("\n🛑 Shutting down...");
    ws.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});