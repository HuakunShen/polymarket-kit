/**
 * Example: BuilderConfig Authentication (New Method)
 *
 * This example demonstrates how to use the new BuilderConfig authentication
 * method with both local credentials and remote signing service.
 */

import { PolymarketSDK } from "../../src/sdk/client.js";
import {
  BuilderConfig,
  type BuilderApiKeyCreds,
} from "@polymarket/builder-signing-sdk";

async function builderConfigExample() {
  console.log("=== BuilderConfig Authentication Example ===");

  // Example 1: Local builder credentials
  if (
    process.env.POLY_BUILDER_API_KEY &&
    process.env.POLY_BUILDER_SECRET &&
    process.env.POLY_BUILDER_PASSPHRASE
  ) {
    console.log("\n--- Testing Local Builder Credentials ---");

    const builderCreds: BuilderApiKeyCreds = {
      key: process.env.POLY_BUILDER_API_KEY,
      secret: process.env.POLY_BUILDER_SECRET,
      passphrase: process.env.POLY_BUILDER_PASSPHRASE,
    };

    const localBuilderConfig = new BuilderConfig({
      localBuilderCreds: builderCreds,
    });

    const localSDK = new PolymarketSDK({
      host: "https://clob.polymarket.com",
      chainId: 137,
      builderConfig: localBuilderConfig,
    });

    try {
      const health = await localSDK.healthCheck();
      console.log("✅ Local builder health check:", health);
    } catch (error) {
      console.error(
        "❌ Local builder health check failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    console.log(
      "⚠️  Local builder credentials not found in environment variables",
    );
    console.log(
      "Required: POLY_BUILDER_API_KEY, POLY_BUILDER_SECRET, POLY_BUILDER_PASSPHRASE",
    );
  }

  // Example 2: Remote builder service
  if (process.env.POLY_BUILDER_SERVICE_URL) {
    console.log("\n--- Testing Remote Builder Service ---");

    const remoteBuilderConfig = new BuilderConfig({
      remoteBuilderConfig: {
        url: process.env.POLY_BUILDER_SERVICE_URL,
        ...(process.env.POLY_BUILDER_SERVICE_TOKEN && {
          token: process.env.POLY_BUILDER_SERVICE_TOKEN,
        }),
      },
    });

    const remoteSDK = new PolymarketSDK({
      host: "https://clob.polymarket.com",
      chainId: 137,
      builderConfig: remoteBuilderConfig,
    });

    try {
      const health = await remoteSDK.healthCheck();
      console.log("✅ Remote builder health check:", health);

      // Test authenticated operation
      const priceHistory = await remoteSDK.getPriceHistory({
        market:
          "60487116984468020978247225474488676749601001829886755968952521846780452448915",
        startTs: 1732156800,
        endTs: 1732416000,
      });
      console.log(
        "✅ Authenticated price history:",
        priceHistory.history.length,
        "data points",
      );
    } catch (error) {
      console.error(
        "❌ Remote builder example failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    console.log(
      "⚠️  Remote builder service URL not found in environment variables",
    );
    console.log(
      "Required: POLY_BUILDER_SERVICE_URL (optional: POLY_BUILDER_SERVICE_TOKEN)",
    );
  }
}

builderConfigExample().catch(console.error);
