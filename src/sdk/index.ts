/**
 * Polymarket SDK
 *
 * A fully typed wrapper SDK for Polymarket CLOB, Gamma, and Data APIs.
 * - PolymarketSDK: For CLOB operations (requires credentials)
 * - GammaSDK: For Gamma API operations (no credentials required)
 * - DataSDK: For Data API operations (user data, holdings, on-chain activities)
 * Provides complete type safety and can be used standalone or with Elysia servers.
 */

// Re-export TypeBox schemas and types for convenience
export * from "../types/elysia-schemas";
export { PolymarketSDK } from "./client";
export { GammaSDK, type GammaSDKConfig } from "./gamma-client";
export { DataSDK, type DataSDKConfig } from "./data-client";
export { PolymarketWebSocketClient } from "./websocket-client";
export type {
	WebSocketClientOptions,
	WebSocketClientCallbacks,
	MessageHandler,
} from "./websocket-client";
