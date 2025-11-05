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
	type OrderBookSummary,
	type PriceHistoryFilterParams,
	type PriceHistoryInterval,
	type BookParams,
	type TradeParams,
	type Trade,
	type PaginationPayload,
	Side,
} from "@polymarket/clob-client";
import { LRUCache } from "lru-cache";
import { Effect, pipe } from "effect";
import type {
	ClobClientConfigType as ClobClientConfig,
	PriceHistoryQueryType as PriceHistoryQuery,
	PriceHistoryResponseType as PriceHistoryResponse,
} from "../types/elysia-schemas";

const describeCause = (cause: unknown): string => {
	if (cause instanceof Error) return cause.message;
	if (typeof cause === "string") return cause;
	try {
		return JSON.stringify(cause);
	} catch {
		return String(cause);
	}
};

const clobError =
	(context: string) =>
	(cause: unknown): Error =>
		new Error(`[PolymarketSDK] ${context}: ${describeCause(cause)}`);

// Global cache for initialized CLOB clients
// Key: privateKey, Value: ClobClient instance
const clobClientCache = new LRUCache<string, ClobClient>({
	max: 100,
	ttl: 30 * 60 * 1000,
	updateAgeOnGet: true, // Reset TTL when client is accessed
});

/**
 * Internal config type with all required properties after defaults are applied
 */
interface ResolvedClobClientConfig {
	privateKey: string;
	funderAddress: string;
	host: string;
	chainId: number;
	signatureType: number;
}

/**
 * Polymarket CLOB SDK for authenticated operations
 *
 * This SDK provides a high-level interface to the Polymarket CLOB API with automatic
 * credential management, caching, and type safety. Requires valid privateKey and
 * funderAddress for authentication.
 */
export class PolymarketSDK {
	private readonly config: ResolvedClobClientConfig;
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
		// Apply sensible defaults for optional properties
		this.config = {
			privateKey: config.privateKey,
			funderAddress: config.funderAddress,
			host: config.host ?? "https://clob.polymarket.com",
			chainId: config.chainId ?? 137,
			signatureType: config.signatureType ?? 1,
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
	private initializeClobClientEffect(): Effect.Effect<ClobClient, Error> {
		const cachedClient = clobClientCache.get(this.cacheKey);
		if (cachedClient) {
			return Effect.succeed(cachedClient);
		}

		const self = this;

		return Effect.gen(function* (_) {
			const signer = yield* _(
				Effect.try({
					try: () => new Wallet(self.config.privateKey),
					catch: clobError("initialize signer"),
				}),
			);

			const creds = yield* _(
				Effect.tryPromise({
					try: () =>
						new ClobClient(
							self.config.host,
							self.config.chainId,
							signer,
						).createOrDeriveApiKey(),
					catch: clobError("derive API key"),
				}),
			);

			const client = yield* _(
				Effect.try({
					try: () =>
						new ClobClient(
							self.config.host,
							self.config.chainId,
							signer,
							creds,
							self.config.signatureType,
							self.config.funderAddress,
						),
					catch: clobError("create CLOB client"),
				}),
			);

			clobClientCache.set(self.cacheKey, client);

			return client;
		});
	}

	private withClient<A>(
		task: (client: ClobClient) => Effect.Effect<A, Error>,
	): Effect.Effect<A, Error> {
		return pipe(this.initializeClobClientEffect(), Effect.flatMap(task));
	}

	private callClient<A>(
		operation: string,
		task: (client: ClobClient) => Promise<A>,
	): Promise<A> {
		return Effect.runPromise(
			this.withClient((client) =>
				Effect.tryPromise({
					try: () => task(client),
					catch: clobError(operation),
				}),
			),
		);
	}

	private buildPriceHistoryParamsEffect(
		query: PriceHistoryQuery,
	): Effect.Effect<PriceHistoryFilterParams, Error> {
		return Effect.try({
			try: () => {
				const params: PriceHistoryFilterParams = {
					market: query.market,
					interval: query.interval as PriceHistoryInterval,
				};

				const parseDate = (
					label: string,
					value?: string,
				): number | undefined => {
					if (!value) return undefined;
					const parsed = Date.parse(value);
					if (Number.isNaN(parsed)) {
						throw new Error(`Invalid ${label}: ${value}`);
					}
					return Math.floor(parsed / 1000);
				};

				const startTs =
					query.startTs ?? parseDate("startDate", query.startDate);
				const endTs = query.endTs ?? parseDate("endDate", query.endDate);

				if (startTs !== undefined) {
					params.startTs = startTs;
				}

				if (endTs !== undefined) {
					params.endTs = endTs;
				}

				if (query.fidelity) {
					params.fidelity = query.fidelity;
				}

				return params;
			},
			catch: clobError("build price history params"),
		});
	}

	private transformPriceHistoryResult(
		result: unknown,
	): Effect.Effect<PriceHistoryResponse, Error> {
		return Effect.try({
			try: () => {
				const errorMessage = (result as { error?: unknown })?.error;
				if (errorMessage) {
					throw clobError("fetch price history")(errorMessage);
				}

				const historyData = Array.isArray(
					(result as { history?: unknown })?.history,
				)
					? ((result as { history?: unknown }).history as any[])
					: [];

				if (historyData.length === 0) {
					return {
						history: [],
						timeRange: null,
					};
				}

				const normalizedHistory = historyData.map((point: any) => ({
					t: Number(point?.t),
					p: Number(point?.p),
				}));

				const firstPoint = normalizedHistory[0];
				const lastPoint = normalizedHistory[normalizedHistory.length - 1];

				const timeRange =
					firstPoint && lastPoint
						? {
								start: new Date(firstPoint.t * 1000).toISOString(),
								end: new Date(lastPoint.t * 1000).toISOString(),
							}
						: null;

				return {
					history: normalizedHistory,
					timeRange,
				};
			},
			catch: (cause) =>
				cause instanceof Error
					? cause
					: clobError("transform price history")(cause),
		});
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
		const self = this;
		return Effect.runPromise(
			Effect.gen(function* (_) {
				const requestParams = yield* _(
					self.buildPriceHistoryParamsEffect(query),
				);
				const client = yield* _(self.initializeClobClientEffect());
				const rawHistory = yield* _(
					Effect.tryPromise({
						try: () => client.getPricesHistory(requestParams),
						catch: clobError("fetch price history"),
					}),
				);
				return yield* _(self.transformPriceHistoryResult(rawHistory));
			}),
		);
	}

	async getBook(tokenId: string): Promise<OrderBookSummary> {
		return this.callClient("get order book", (client) =>
			client.getOrderBook(tokenId),
		);
	}

	async getOrderBooks(params: BookParams[]): Promise<OrderBookSummary[]> {
		return this.callClient("get order books", (client) =>
			client.getOrderBooks(params),
		);
	}

	async getPrice(tokenId: string, side: "buy" | "sell"): Promise<number> {
		const sideEnum = side === "buy" ? Side.BUY : Side.SELL;
		return this.callClient("get price", (client) =>
			client.getPrice(tokenId, sideEnum),
		);
	}

	async getPrices(params: BookParams[]): Promise<number[]> {
		return this.callClient("get prices", (client) => client.getPrices(params));
	}

	async getMidpoint(tokenId: string): Promise<number> {
		return this.callClient("get midpoint", (client) =>
			client.getMidpoint(tokenId),
		);
	}

	async getMidpoints(params: BookParams[]): Promise<number[]> {
		return this.callClient("get midpoints", (client) =>
			client.getMidpoints(params),
		);
	}

	async getSpreads(params: BookParams[]): Promise<number[]> {
		return this.callClient("get spreads", (client) =>
			client.getSpreads(params),
		);
	}

	async getTrades(
		params?: TradeParams,
		onlyFirstPage?: boolean,
		nextCursor?: string,
	): Promise<Trade[]> {
		return this.callClient("get trades", (client) =>
			client.getTrades(params, onlyFirstPage, nextCursor),
		);
	}

	async getMarket(conditionId: string): Promise<any> {
		return this.callClient("get market", (client) =>
			client.getMarket(conditionId),
		);
	}

	async getMarkets(nextCursor?: string): Promise<PaginationPayload> {
		return this.callClient("get markets", (client) =>
			client.getMarkets(nextCursor),
		);
	}

	async getSamplingMarkets(nextCursor?: string): Promise<PaginationPayload> {
		return this.callClient("get sampling markets", (client) =>
			client.getSamplingMarkets(nextCursor),
		);
	}

	async getSimplifiedMarkets(nextCursor?: string): Promise<PaginationPayload> {
		return this.callClient("get simplified markets", (client) =>
			client.getSimplifiedMarkets(nextCursor),
		);
	}

	async getSamplingSimplifiedMarkets(
		nextCursor?: string,
	): Promise<PaginationPayload> {
		return this.callClient("get sampling simplified markets", (client) =>
			client.getSamplingSimplifiedMarkets(nextCursor),
		);
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
		return Effect.runPromise(
			pipe(
				Effect.succeed(clobClientCache.has(this.cacheKey)),
				Effect.flatMap((wasCached) =>
					pipe(
						this.initializeClobClientEffect(),
						Effect.as({
							status: "healthy" as const,
							timestamp: new Date().toISOString(),
							clob: "connected",
							cached: wasCached,
						}),
					),
				),
				Effect.catchAll((error) =>
					Effect.succeed({
						status: "unhealthy" as const,
						timestamp: new Date().toISOString(),
						clob: "disconnected",
						error: error.message,
						cached: false,
					}),
				),
			),
		);
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
