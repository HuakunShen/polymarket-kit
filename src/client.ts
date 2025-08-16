/**
 * @fileoverview Proxy client for Polymarket API
 *
 * This module provides a client factory function for creating Elysia treaty clients
 * that can communicate with the Polymarket proxy server. The proxy client provides
 * type-safe access to the server's API endpoints.
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "./index";

/**
 * Creates a type-safe client for the Polymarket proxy server
 *
 * @param url - The base URL of the proxy server
 * @returns A treaty client instance with full type safety for all proxy endpoints
 *
 * @example
 * ```ts
 * import { createClient } from "@hk/polymarket/proxy";
 *
 * const client = createClient("http://localhost:3000");
 * const markets = await client.gamma.markets.get();
 * ```
 */
export function createClient(url: string): ReturnType<typeof treaty<App>> {
	return treaty<App>(url);
}
