/**
 * @fileoverview Main entrypoint for Polymarket SDK package
 *
 * This module provides the main entry point for the Polymarket SDK package,
 * exporting both the PolymarketSDK for CLOB operations and GammaSDK for
 * Gamma API operations. This is the primary module users should import from.
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
export { GammaSDK, PolymarketSDK } from "./sdk";

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
