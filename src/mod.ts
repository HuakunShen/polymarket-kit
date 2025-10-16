/**
 * @fileoverview Main entrypoint for Polymarket SDK package
 *
 * This module provides the main entry point for the Polymarket SDK package,
 * exporting the PolymarketSDK for CLOB operations, GammaSDK for Gamma API
 * operations, and DataSDK for user data and on-chain activities. This is the
 * primary module users should import from.
 */

/**
 * Polymarket CLOB SDK for authenticated operations
 *
 * @example
 * ```ts
 * import { PolymarketSDK } from "@hk/polymarket";
 *
 * const sdk = new PolymarketSDK({
 *   privateKey: "your-private-key",
 *   funderAddress: "your-funder-address"
 * });
 * ```
 */
/**
 * Polymarket Gamma API SDK for public data operations
 *
 * @example
 * ```ts
 * import { GammaSDK } from "@hk/polymarket";
 *
 * const gamma = new GammaSDK();
 * const markets = await gamma.getMarkets();
 * ```
 */
/**
 * Polymarket Data API SDK for user data and on-chain activities
 *
 * @example
 * ```ts
 * import { DataSDK } from "@hk/polymarket";
 *
 * const data = new DataSDK();
 * const positions = await data.getCurrentPositions({
 *   user: "0x123...",
 *   limit: 50
 * });
 * ```
 */
export { GammaSDK, PolymarketSDK, DataSDK } from "./sdk";

/**
 * WebSocket message schemas for real-time market data
 *
 * @example
 * ```ts
 * import { parseMarketChannelMessage, isBookMessage } from "@hk/polymarket";
 *
 * const msg = parseMarketChannelMessage(data);
 * if (isBookMessage(msg)) {
 *   console.log("Bids:", msg.bids.length);
 * }
 * ```
 */
export * from "./types/websocket-schemas";
