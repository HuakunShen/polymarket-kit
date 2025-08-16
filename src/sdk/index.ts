/**
 * Polymarket SDK
 *
 * A fully typed wrapper SDK for Polymarket CLOB and Gamma APIs.
 * - PolymarketSDK: For CLOB operations (requires credentials)
 * - GammaSDK: For Gamma API operations (no credentials required)
 * Provides complete type safety and can be used standalone or with Elysia servers.
 */

// Re-export TypeBox schemas and types for convenience
export * from "../types/elysia-schemas";
export { PolymarketSDK } from "./client";
export { GammaSDK } from "./gamma-client";
