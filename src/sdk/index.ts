/**
 * Polymarket SDK
 *
 * A fully typed wrapper SDK for Polymarket CLOB, Gamma, and Data APIs.
 * - PolymarketSDK: For CLOB operations (requires credentials)
 * - ClobSDK: Public read-only CLOB (pure fetch, no deps, runtime-agnostic)
 * - ClobPublicClient: Public CLOB via @polymarket/clob-client-v2 lib
 * - GammaSDK: For Gamma API operations (no credentials required)
 * - DataSDK: For Data API operations (user data, holdings, on-chain activities)
 * Provides complete type safety and can be used standalone or with Elysia servers.
 */

// Re-export TypeBox schemas and types for convenience
export * from "../types/elysia-schemas";
export { PolymarketSDK } from "./client";
export { ClobSDK, type ClobSDKConfig } from "./clob-sdk";
export { ClobPublicClient, type ClobPublicClientConfig } from "./clob-public-client";
export { GammaSDK, type GammaSDKConfig } from "./gamma-client";
export { DataSDK, type DataSDKConfig } from "./data-client";
export { PolymarketWebSocketClient } from "./websocket-client";
export type {
	WebSocketClientOptions,
	WebSocketClientCallbacks,
	MessageHandler,
} from "./websocket-client";
