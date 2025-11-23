/**
 * Example: Public Access (No Authentication Required)
 *
 * This example demonstrates how to use the PolymarketSDK for public operations
 * that don't require authentication like fetching price history, order books, etc.
 */

import { PolymarketSDK } from "../../src/sdk/client.js";

async function publicAccessExample() {
  console.log("=== Public Access Example ===");

  // Create SDK instance without authentication
  const sdk = new PolymarketSDK({
    host: "https://clob.polymarket.com",
    chainId: 137,
  });

  try {
    // Test health check
    const health = await sdk.healthCheck();
    console.log("✅ Health check:", health);

    // Fetch price history
    const priceHistory = await sdk.getPriceHistory({
      market:
        "60487116984468020978247225474488676749601001829886755968952521846780452448915",
      startTs: 1732156800,
      endTs: 1732416000,
    });
    console.log(
      "✅ Price history:",
      priceHistory.history.length,
      "data points",
    );

    // Get order book
    const orderBook = await sdk.getBook(
      "70053586508884407034746548832843494840339625160858317381494925241649091892948",
    );
    console.log("✅ Order book for token:", orderBook.market);

    // Get midpoint price
    const midpoint = await sdk.getMidpoint(
      "70053586508884407034746548832843494840339625160858317381494925241649091892948",
    );
    console.log("✅ Midpoint price:", midpoint);

    // Get trades
    const trades = await sdk.getTrades(
      {
        market:
          "60487116984468020978247225474488676749601001829886755968952521846780452448915",
      },
      true,
    );
    console.log("✅ Trades fetched:", trades.length, "trades");
  } catch (error) {
    console.error(
      "❌ Public access example failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

publicAccessExample().catch(console.error);
