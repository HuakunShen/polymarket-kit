/**
 * Polymarket CLOB SDK Client
 *
 * A fully typed wrapper SDK for Polymarket CLOB API.
 * Provides type-safe methods for fetching price history and CLOB operations.
 * For Gamma API operations (markets/events), use the separate GammaSDK.
 */

import { Wallet } from "@ethersproject/wallet";
import {
	ClobClient,
	type PriceHistoryFilterParams,
	type PriceHistoryInterval,
} from "@polymarket/clob-client";
import { LRUCache } from "lru-cache";
import type {
	ClobClientConfigType as ClobClientConfig,
	PriceHistoryQueryType as PriceHistoryQuery,
	PriceHistoryResponseType as PriceHistoryResponse,
} from "../types/elysia-schemas";

// Global cache for initialized CLOB clients
// Key: privateKey, Value: ClobClient instance
const clobClientCache = new LRUCache<string, ClobClient>({
	max: parseInt(process.env.CLOB_CLIENT_CACHE_MAX_SIZE || "100", 10),
	ttl:
		parseInt(process.env.CLOB_CLIENT_CACHE_TTL_MINUTES || "30", 10) * 60 * 1000,
	updateAgeOnGet: true, // Reset TTL when client is accessed
});

/**
 * Polymarket CLOB SDK for authenticated operations
 *
 * This SDK provides a high-level interface to the Polymarket CLOB API with automatic
 * credential management, caching, and type safety. Requires valid privateKey and
 * funderAddress for authentication.
 */
export class PolymarketSDK {
	private readonly config: ClobClientConfig;
	private readonly cacheKey: string;

	/**
	 * Creates a new PolymarketSDK instance
	 *
	 * @param config - Configuration object with privateKey, funderAddress, and optional settings
	 * @throws {Error} When required privateKey or funderAddress are missing
	 *
	 * @example
	 * ```ts
	 * const sdk = new PolymarketSDK({
	 *   privateKey: "0x...",
	 *   funderAddress: "0x...",
	 *   host: "https://clob.polymarket.com", // optional
	 *   chainId: 137 // optional
	 * });
	 * ```
	 */
	constructor(config: ClobClientConfig) {
		// Destructure to avoid duplicate keys with spreads and apply sensible defaults
		const {
			host: cfgHost,
			chainId: cfgChainId,
			signatureType: cfgSignatureType,
			...rest
		} = config;

		this.config = {
			...rest,
			host: cfgHost ?? "https://clob.polymarket.com",
			chainId: cfgChainId ?? 137,
			signatureType: cfgSignatureType ?? 1,
		};
		if (!config.privateKey || !config.funderAddress) {
			throw new Error(
				"Missing required configuration parameters: privateKey and funderAddress",
			);
		}
		// Create cache key based on private key and config that affects client creation
		this.cacheKey = `${this.config.privateKey}_${this.config.host}_${this.config.chainId}_${this.config.funderAddress}`;
	}

	/**
	 * Initialize the CLOB client with credentials using cache
	 */
	private async initializeClobClient(): Promise<ClobClient> {
		// Check cache first
		// console.log("this.cacheKey", this.cacheKey)
		const cachedClient = clobClientCache.get(this.cacheKey);
		if (cachedClient) {
			return cachedClient;
		}

		try {
			const signer = new Wallet(this.config.privateKey);

			const creds = await new ClobClient(
				this.config.host,
				this.config.chainId,
				signer,
			).createOrDeriveApiKey();

			const client = new ClobClient(
				this.config.host,
				this.config.chainId,
				signer,
				creds,
				this.config.signatureType,
				this.config.funderAddress,
			);

			// Store in cache
			clobClientCache.set(this.cacheKey, client);

			return client;
		} catch (error) {
			throw new Error(
				`Failed to initialize CLOB client: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	/**
	 * Fetch price history for a market token with full typing
	 *
	 * @param query - Price history query parameters including market, interval, and optional date range
	 * @returns Promise resolving to price history data with timestamps and prices
	 * @throws {Error} When API request fails or client initialization fails
	 *
	 * @example
	 * ```ts
	 * const history = await sdk.getPriceHistory({
	 *   market: "0x...",
	 *   interval: "1h",
	 *   startDate: "2024-01-01",
	 *   endDate: "2024-01-02"
	 * });
	 * ```
	 */
	async getPriceHistory(
		query: PriceHistoryQuery,
	): Promise<PriceHistoryResponse> {
		const client = await this.initializeClobClient();

		try {
			const requestParams: PriceHistoryFilterParams = {
				market: query.market,
				interval: query.interval as PriceHistoryInterval,
			};

			// Handle date conversion and time range vs interval
			let startTs = query.startTs;
			let endTs = query.endTs;

			if (!startTs && query.startDate) {
				startTs = Math.floor(new Date(query.startDate).getTime() / 1000);
			}

			if (!endTs && query.endDate) {
				endTs = Math.floor(new Date(query.endDate).getTime() / 1000);
			}

			if (startTs && endTs) {
				requestParams.startTs = startTs;
				requestParams.endTs = endTs;
			}

			if (query.fidelity) {
				requestParams.fidelity = query.fidelity;
			}
			console.log({ requestParams });
			const priceHistory = await client.getPricesHistory(requestParams);
			const historyData = (priceHistory as any)?.history || [];

			if (historyData.length === 0) {
				return {
					history: [],
					timeRange: null,
				};
			}

			// Calculate time range
			const firstPoint = historyData[0];
			const lastPoint = historyData[historyData.length - 1];
			const timeRange =
				firstPoint && lastPoint
					? {
							start: new Date(firstPoint.t * 1000).toISOString(),
							end: new Date(lastPoint.t * 1000).toISOString(),
						}
					: null;

			return {
				history: historyData.map((point: any) => ({
					t: point.t,
					p: point.p,
				})),
				timeRange,
			};
		} catch (error) {
			throw new Error(
				`Failed to fetch price history: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	/**
	 * Test CLOB client connection and return health status
	 *
	 * @returns Promise resolving to health check status with connection info and caching details
	 *
	 * @example
	 * ```ts
	 * const health = await sdk.healthCheck();
	 * console.log(health.status); // "healthy" | "unhealthy"
	 * console.log(health.cached); // true if client was cached
	 * ```
	 */
	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		timestamp: string;
		clob: string;
		error?: string;
		cached?: boolean;
	}> {
		try {
			const wasCached = clobClientCache.has(this.cacheKey);
			await this.initializeClobClient();
			return {
				status: "healthy",
				timestamp: new Date().toISOString(),
				clob: "connected",
				cached: wasCached,
			};
		} catch (error) {
			return {
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				clob: "disconnected",
				error: error instanceof Error ? error.message : "Unknown error",
				cached: false,
			};
		}
	}

	/**
	 * Clear this client from cache (useful for debugging or forced refresh)
	 *
	 * Removes this specific client instance from the global cache, forcing
	 * re-initialization on next API call.
	 *
	 * @example
	 * ```ts
	 * sdk.clearCache(); // Force fresh client on next API call
	 * ```
	 */
	clearCache(): void {
		clobClientCache.delete(this.cacheKey);
	}

	/**
	 * Get cache statistics (static method for global cache info)
	 *
	 * @returns Object containing current cache size and maximum cache size
	 *
	 * @example
	 * ```ts
	 * const stats = PolymarketSDK.getCacheStats();
	 * console.log(`Cache: ${stats.size}/${stats.maxSize}`);
	 * ```
	 */
	static getCacheStats(): {
		size: number;
		maxSize: number;
		remainingTTL?: number;
	} {
		return {
			size: clobClientCache.size,
			maxSize: clobClientCache.max || 0,
		};
	}

	/**
	 * Clear all cached clients (static method for global cache management)
	 *
	 * Removes all cached client instances from the global cache, forcing
	 * re-initialization for all future API calls.
	 *
	 * @example
	 * ```ts
	 * PolymarketSDK.clearAllCache(); // Clear entire cache
	 * ```
	 */
	static clearAllCache(): void {
		clobClientCache.clear();
	}
}
