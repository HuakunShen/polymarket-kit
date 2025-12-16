/**
 * Dynamic WebSocket example using PolymarketWebSocketClient with schema validation
 *
 * This example merges the simplicity of PolymarketWebSocketClient with proper
 * schema validation and dynamically fetches recent CLOB tokens instead of using
 * hardcoded token IDs.
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
  
  console.log("🔍 Fetching recent active events...");
  const events = await gammaSdk.getActiveEvents({ limit: 10, closed: false });
  
  // Extract all clobTokenIds from recent events
  const clobTokens = events.flatMap((evt) =>
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
  // Limit to first 10 tokens to avoid overwhelming the connection
  const tokenLimit = Math.min(clobTokens.length, 10);
  const ws = new PolymarketWebSocketClient(clobClient, {
    assetIds: (clobTokens as string[]).slice(0, tokenLimit),
    autoReconnect: true,
    debug: true,
  });

  console.log(`🔌 Subscribing to ${tokenLimit} recent tokens...`);

  // Register event handlers with enhanced logging
  ws.on({
    onConnect: () => {
      console.log("✅ Connected to Polymarket WebSocket");
      console.log(`📡 Listening for market data on ${tokenLimit} tokens...`);
    },

    onBook: (msg: BookMessage) => {
      console.log(
        `📚 Book Update - Market: ${msg.market.substring(0, 10)}..., ` +
        `Asset: ${msg.asset_id.substring(0, 10)}..., ` +
        `Hash: ${msg.hash.substring(0, 10)}...`
      );
      console.log(`   Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`);

      if (msg.bids.length > 0) {
        const bestBid = msg.bids[msg.bids.length - 1];
        if (bestBid) {
          console.log(`   Best Bid: ${bestBid.price} (${bestBid.size})`);
        }
      }
      if (msg.asks.length > 0) {
        const bestAsk = msg.asks[0];
        if (bestAsk) {
          console.log(`   Best Ask: ${bestAsk.price} (${bestAsk.size})`);
        }
      }
      
      // Calculate spread if both sides exist
      if (msg.bids.length > 0 && msg.asks.length > 0) {
        const bestBid = msg.bids[msg.bids.length - 1];
        const bestAsk = msg.asks[0];
        if (bestBid && bestAsk) {
          const spread = (parseFloat(bestAsk.price) - parseFloat(bestBid.price)).toFixed(4);
          console.log(`   Spread: ${spread}`);
        }
      }
    },

    onPriceChange: (msg: PriceChangeMessage) => {
      console.log(
        `💹 Price Change - Market: ${msg.market.substring(0, 10)}..., ` +
        `Changes: ${msg.price_changes.length}`
      );
      
      for (const change of msg.price_changes) {
        console.log(
          `   ${change.side} @ ${change.price} (size: ${change.size}) - ` +
          `Best Bid: ${change.best_bid}, Best Ask: ${change.best_ask}`
        );
      }
    },

    onTickSizeChange: (msg: TickSizeChangeMessage) => {
      console.log(
        `📏 Tick Size Change - Market: ${msg.market.substring(0, 10)}..., ` +
        `Asset: ${msg.asset_id.substring(0, 10)}..., ` +
        `${msg.old_tick_size} -> ${msg.new_tick_size}`
      );
    },

    onLastTradePrice: (msg: LastTradePriceMessage) => {
      console.log(
        `💰 Trade - Market: ${msg.market.substring(0, 10)}..., ` +
        `Asset: ${msg.asset_id.substring(0, 10)}..., ` +
        `${msg.side} @ ${msg.price} (size: ${msg.size})`
      );
      console.log(`   Fee Rate: ${msg.fee_rate_bps} bps`);
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

  console.log("Press Ctrl+C to exit");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    ws.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});