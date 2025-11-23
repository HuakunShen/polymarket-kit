/**
 * Example: HTTP Proxy Configuration
 *
 * This example demonstrates how to configure HTTP proxy for the SDK
 * to route requests through a proxy server.
 */

import { PolymarketSDK } from "../../src/sdk/client.js";

async function proxyExample() {
  console.log("=== HTTP Proxy Example ===");

  // Create SDK instance
  const sdk = new PolymarketSDK({
    host: "https://clob.polymarket.com",
    chainId: 137,
  });

  try {
    // Configure proxy (replace with your actual proxy URL)
    const proxyUrl = "http://proxy.example.com:8080";
    await sdk.setProxy(proxyUrl);
    console.log("✅ Proxy configured:", proxyUrl);

    // Test operation through proxy
    const priceHistory = await sdk.getPriceHistory({
      market:
        "60487116984468020978247225474488676749601001829886755968952521846780452448915",
      startTs: 1732156800,
      endTs: 1732416000,
    });
    console.log(
      "✅ Price history through proxy:",
      priceHistory.history.length,
      "data points",
    );
  } catch (error) {
    console.error(
      "❌ Proxy example failed:",
      error instanceof Error ? error.message : String(error),
    );
    console.log("💡 Make sure your proxy server is running and accessible");
  }
}

// Example with authenticated proxy
async function authenticatedProxyExample() {
  console.log("\n=== Authenticated Proxy Example ===");

  if (process.env.POLYMARKET_KEY && process.env.POLYMARKET_FUNDER) {
    const sdk = new PolymarketSDK({
      host: "https://clob.polymarket.com",
      chainId: 137,
      privateKey: process.env.POLYMARKET_KEY,
      funderAddress: process.env.POLYMARKET_FUNDER,
    });

    try {
      // Configure proxy with authentication
      const proxyUrl = "http://user:pass@proxy.example.com:8080";
      await sdk.setProxy(proxyUrl);
      console.log("✅ Authenticated proxy configured");

      // Test authenticated operation through proxy
      const health = await sdk.healthCheck();
      console.log("✅ Health check through proxy:", health);
    } catch (error) {
      console.error(
        "❌ Authenticated proxy example failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    console.log(
      "⚠️  Legacy credentials not found for authenticated proxy example",
    );
  }
}

// Run examples
proxyExample()
  .then(() => {
    return authenticatedProxyExample();
  })
  .catch(console.error);
