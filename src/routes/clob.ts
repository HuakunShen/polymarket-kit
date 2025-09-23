/**
 * CLOB API Routes
 *
 * This file handles all routes for the Polymarket CLOB API operations.
 * Provides typed endpoints for price history and other CLOB client operations.
 * Uses the fully typed Polymarket SDK for improved type safety.
 *
 * In production mode, credentials are read from headers (x-polymarket-key, x-polymarket-funder).
 * In development mode, falls back to environment variables.
 */

import { Elysia } from "elysia";
import { z } from "zod";
import { LRUCache } from "lru-cache";
import { PolymarketSDK } from "../sdk/";
import { Side } from "@polymarket/clob-client";

// Custom error classes for better error handling
class ClobValidationError extends Error {
	constructor(
		message: string,
		public details?: string,
	) {
		super(message);
	}
}

class ClobApiError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
	) {
		super(message);
	}
}

const PolymarketAuthHeaderSchema = z.object({
	"x-polymarket-key": z
		.string()
		.describe(
			"Polymarket private key for CLOB authentication (required in production, optional in development)",
		)
		.optional(),
	"x-polymarket-funder": z
		.string()
		.describe(
			"Polymarket funder address for CLOB operations (required in production, optional in development)",
		)
		.optional(),
});

type ClobOperationOptions = {
	defaultStatus?: number;
};

function getErrorLabel(status: number): string {
	if (status >= 500) {
		return "Internal Server Error";
	}
	switch (status) {
		case 400:
			return "Bad Request";
		case 401:
			return "Unauthorized";
		case 403:
			return "Forbidden";
		case 404:
			return "Not Found";
		case 429:
			return "Too Many Requests";
		case 503:
			return "Service Unavailable";
		default:
			return status >= 400 ? "Bad Request" : "Internal Server Error";
	}
}

function handleClobError(
	error: unknown,
	options: ClobOperationOptions = {},
): never {
	if (error instanceof ClobValidationError || error instanceof ClobApiError) {
		throw error;
	}

	if (error instanceof Error) {
		const message = error.message || "Unknown error occurred";

		if (
			message.includes("invalid filters") ||
			message.includes("minimum 'fidelity'") ||
			message.includes("fidelity")
		) {
			throw new ClobValidationError(message);
		}

		if (message.includes("No orderbook exists")) {
			throw new ClobApiError(message, 404);
		}

		throw new ClobApiError(message, options.defaultStatus ?? 500);
	}

	throw new ClobApiError(
		"Unknown error occurred",
		options.defaultStatus ?? 500,
	);
}

const runClobOperation = <T>(
	operation: () => Promise<T>,
	options: ClobOperationOptions = {},
): Promise<T> =>
	operation().catch((error) => {
		handleClobError(error, options);
	});

import {
	PriceHistoryQuerySchema,
	PriceHistoryResponseSchema,
	OrderBookSummarySchema,
	BookParamsSchema,
	TokenParamsSchema,
	TradeParamsSchema,
	TradeSchema,
	PaginationPayloadSchema,
	MarketPaginationQuerySchema,
} from "../types/elysia-schemas";

// Cache for SDK instances to avoid creating them on every request
// Key: "privateKey_funderAddress", Value: PolymarketSDK instance
const sdkCache = new LRUCache<string, PolymarketSDK>({
	max: parseInt(process.env.SDK_CACHE_MAX_SIZE || "50", 10),
	ttl: parseInt(process.env.SDK_CACHE_TTL_HOURS || "1", 10) * 60 * 60 * 1000,
	updateAgeOnGet: true, // Reset TTL when SDK is accessed
});

const isDevelopment =
	process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

/**
 * Get or create Polymarket SDK instance with caching
 */
function getPolymarketSDK(
	privateKey: string,
	funderAddress: string,
): PolymarketSDK {
	const cacheKey = `${privateKey}_${funderAddress}`;

	// Check cache first
	const cachedSDK = sdkCache.get(cacheKey);
	if (cachedSDK) {
		return cachedSDK;
	}

	// Create new SDK and cache it
	const sdk = new PolymarketSDK({
		privateKey,
		funderAddress,
	});

	sdkCache.set(cacheKey, sdk);
	return sdk;
}

/**
 * Create CLOB API routes with proper typing and validation
 */
export const clobRoutes = new Elysia({ prefix: "/clob" })
	.error({
		ClobValidationError,
		ClobApiError,
	})
	.onError(({ code, error, set }) => {
		switch (code) {
			case "ClobValidationError":
				set.status = 400;
				return {
					error: "Bad Request",
					message: error.message,
					details: error.details,
				};
			case "ClobApiError":
				set.status = error.statusCode;
				return {
					error: getErrorLabel(error.statusCode),
					message: error.message,
				};
			default:
				set.status = 500;
				return {
					error: "Internal Server Error",
					message: "An unexpected error occurred",
				};
		}
	})
	.resolve(async ({ headers }) => {
		let privateKey: string;
		let funderAddress: string;

		if (isDevelopment) {
			// In development, use environment variables as fallback
			privateKey =
				(headers["x-polymarket-key"] as string) ||
				process.env.POLYMARKET_KEY ||
				Bun.env.POLYMARKET_KEY ||
				"";
			funderAddress =
				(headers["x-polymarket-funder"] as string) ||
				process.env.POLYMARKET_FUNDER ||
				Bun.env.POLYMARKET_FUNDER ||
				"";
		} else {
			// In production, require headers
			privateKey = headers["x-polymarket-key"] as string;
			funderAddress = (headers["x-polymarket-funder"] as string) || "";
		}

		if (!privateKey) {
			throw new ClobValidationError(
				isDevelopment
					? "POLYMARKET_KEY environment variable or x-polymarket-key header is required"
					: "x-polymarket-key header is required",
			);
		}

		if (!funderAddress) {
			throw new ClobValidationError(
				isDevelopment
					? "POLYMARKET_FUNDER environment variable or x-polymarket-funder header is required"
					: "x-polymarket-funder header is required",
			);
		}

		const polymarketSDK = getPolymarketSDK(privateKey, funderAddress);

		return {
			polymarketSDK,
		};
	})
	.get(
		"/prices-history",
		({ query, polymarketSDK }) =>
			runClobOperation(() =>
				polymarketSDK.getPriceHistory({
					market: query.market,
					startTs: query.startTs,
					endTs: query.endTs,
					startDate: query.startDate,
					endDate: query.endDate,
					interval: query.interval,
					fidelity: query.fidelity,
				}),
			),
		{
			query: PriceHistoryQuerySchema,
			headers: PolymarketAuthHeaderSchema.optional(),
			response: {
				200: PriceHistoryResponseSchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get price history",
				description:
					"Retrieve price history for a specific token via market query parameter. Supports interval-based queries (1m, 1h, 6h, 1d, 1w, max) or time range queries. Time ranges can be specified using Unix timestamps (startTs, endTs in seconds) or human-readable dates (startDate, endDate like '2025-08-13' or '2025-08-13T00:00:00.000Z'). Optional fidelity parameter controls data resolution in minutes. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/health",
		async ({ set, polymarketSDK }) => {
			const health = await runClobOperation(() => polymarketSDK.healthCheck(), {
				defaultStatus: 503,
			});
			if (health.status === "unhealthy") {
				set.status = 503;
			}
			return health;
		},
		{
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					status: z.enum(["healthy", "unhealthy"]),
					timestamp: z.string(),
					clob: z.string(),
					cached: z.boolean().optional(),
					error: z.string().optional(),
				}),
				503: z.object({
					status: z.literal("unhealthy"),
					timestamp: z.string(),
					clob: z.string(),
					error: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Health check",
				description:
					"Check the health status of CLOB client connection. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables). Response includes cache status.",
			},
		},
	)

	.get(
		"/cache/stats",
		async () => {
			return {
				sdkCache: {
					size: sdkCache.size,
					maxSize: sdkCache.max || 0,
				},
				clobClientCache: PolymarketSDK.getCacheStats(),
				timestamp: new Date().toISOString(),
			};
		},
		{
			response: {
				200: z.object({
					sdkCache: z.object({
						size: z.number(),
						maxSize: z.number(),
					}),
					clobClientCache: z.object({
						size: z.number(),
						maxSize: z.number(),
					}),
					timestamp: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Cache statistics",
				description:
					"Get cache statistics for SDK instances and CLOB clients. Shows current cache size and limits.",
			},
		},
	)

	.get(
		"/book/:tokenId",
		async ({ params, polymarketSDK }) => {
			const result = await runClobOperation(() =>
				polymarketSDK.getBook(params.tokenId),
			);

			if (result && typeof result === "object" && "error" in result) {
				throw new ClobApiError(result.error as string, 404);
			}

			return result;
		},
		{
			params: z.object({
				tokenId: z.string().describe("The CLOB token ID to get order book for"),
			}),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: OrderBookSummarySchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				404: z.object({
					error: z.string(),
					message: z.string(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get order book",
				description:
					"Retrieve the current order book for a specific token ID. Returns bids, asks, and market metadata including minimum order size and tick size. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.post(
		"/orderbooks",
		({ body, polymarketSDK }) => {
			const transformedBody = body.map((item: any) => ({
				token_id: item.token_id,
				side: item.side === "BUY" ? Side.BUY : Side.SELL,
			}));
			return runClobOperation(() =>
				polymarketSDK.getOrderBooks(transformedBody),
			);
		},
		{
			body: z.array(BookParamsSchema),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.array(OrderBookSummarySchema),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get multiple order books",
				description:
					"Retrieve order books for multiple token IDs. Each item should include token_id and optionally side (BUY/SELL). Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/price/:tokenId/:side",
		({ params, polymarketSDK }) =>
			runClobOperation(async () => ({
				price: await polymarketSDK.getPrice(
					params.tokenId,
					params.side as "buy" | "sell",
				),
			})),
		{
			params: z.object({
				tokenId: z.string().describe("The CLOB token ID to get price for"),
				side: z
					.enum(["buy", "sell"])
					.describe("The side to get price for (buy or sell)"),
			}),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					price: z.number(),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get price for specific side",
				description:
					"Get the current price for a specific token ID and side (buy/sell). Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.post(
		"/prices",
		({ body, polymarketSDK }) => {
			const transformedBody = body.map((item: any) => ({
				token_id: item.token_id,
				side: item.side === "BUY" ? Side.BUY : Side.SELL,
			}));
			return runClobOperation(async () => ({
				prices: await polymarketSDK.getPrices(transformedBody),
			}));
		},
		{
			body: z.array(BookParamsSchema),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					prices: z.array(z.number()),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get multiple prices",
				description:
					"Get prices for multiple token IDs and sides. Each item should include token_id and side (BUY/SELL). Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/midpoint/:tokenId",
		({ params, polymarketSDK }) =>
			runClobOperation(async () => ({
				midpoint: await polymarketSDK.getMidpoint(params.tokenId),
			})),
		{
			params: z.object({
				tokenId: z.string().describe("The CLOB token ID to get midpoint for"),
			}),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					midpoint: z.number(),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get midpoint price",
				description:
					"Get the midpoint price for a specific token ID. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.post(
		"/midpoints",
		({ body, polymarketSDK }) => {
			const transformedBody = body.map((item: any) => ({
				token_id: item.token_id,
				side: Side.BUY, // Midpoint doesn't actually use side, but BookParams requires it
			}));
			return runClobOperation(async () => ({
				midpoints: await polymarketSDK.getMidpoints(transformedBody),
			}));
		},
		{
			body: z.array(TokenParamsSchema),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					midpoints: z.array(z.number()),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get multiple midpoint prices",
				description:
					"Get midpoint prices for multiple token IDs. Each item should include token_id. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.post(
		"/spreads",
		({ body, polymarketSDK }) => {
			const transformedBody = body.map((item: any) => ({
				token_id: item.token_id,
				side: Side.BUY, // Spreads don't actually use side, but BookParams requires it
			}));
			return runClobOperation(async () => ({
				spreads: await polymarketSDK.getSpreads(transformedBody),
			}));
		},
		{
			body: z.array(TokenParamsSchema),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					spreads: z.array(z.number()),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get bid-ask spreads",
				description:
					"Get bid-ask spreads for multiple token IDs. Each item should include token_id. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.post(
		"/trades",
		({ body, polymarketSDK }) => {
			const { only_first_page, next_cursor, ...tradeParams } = body;
			return runClobOperation(async () => ({
				trades: await polymarketSDK.getTrades(
					Object.keys(tradeParams).length > 0 ? tradeParams : undefined,
					only_first_page,
					next_cursor,
				),
			}));
		},
		{
			body: TradeParamsSchema.extend({
				only_first_page: z.boolean().optional(),
				next_cursor: z.string().optional(),
			}),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.object({
					trades: z.array(TradeSchema),
				}),
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get trades",
				description:
					"Get trades with optional filtering. All parameters are optional. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)
	.get(
		"/market/:conditionId",
		({ params, polymarketSDK }) =>
			runClobOperation(() => polymarketSDK.getMarket(params.conditionId)),
		{
			params: z.object({
				conditionId: z.string().describe("The condition ID to get market for"),
			}),
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: z.any(), // Market structure varies, using Any for now
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get market by condition ID",
				description:
					"Get market information for a specific condition ID. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/markets",
		({ query, polymarketSDK }) =>
			runClobOperation(() => polymarketSDK.getMarkets(query.next_cursor)),
		{
			query: MarketPaginationQuerySchema,
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: PaginationPayloadSchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get markets",
				description:
					"Get paginated list of markets. Optional next_cursor for pagination. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/sampling-markets",
		({ query, polymarketSDK }) =>
			runClobOperation(() =>
				polymarketSDK.getSamplingMarkets(query.next_cursor),
			),
		{
			query: MarketPaginationQuerySchema,
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: PaginationPayloadSchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get sampling markets",
				description:
					"Get paginated list of sampling markets. Optional next_cursor for pagination. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/simplified-markets",
		({ query, polymarketSDK }) =>
			runClobOperation(() =>
				polymarketSDK.getSimplifiedMarkets(query.next_cursor),
			),
		{
			query: MarketPaginationQuerySchema,
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: PaginationPayloadSchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get simplified markets",
				description:
					"Get paginated list of simplified markets. Optional next_cursor for pagination. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.get(
		"/sampling-simplified-markets",
		({ query, polymarketSDK }) =>
			runClobOperation(() =>
				polymarketSDK.getSamplingSimplifiedMarkets(query.next_cursor),
			),
		{
			query: MarketPaginationQuerySchema,
			headers: PolymarketAuthHeaderSchema,
			response: {
				200: PaginationPayloadSchema,
				400: z.object({
					error: z.string(),
					message: z.string(),
					details: z.string().optional(),
				}),
				500: z.object({
					error: z.string(),
					message: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Get sampling simplified markets",
				description:
					"Get paginated list of sampling simplified markets. Optional next_cursor for pagination. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
			},
		},
	)

	.delete(
		"/cache",
		async () => {
			sdkCache.clear();
			PolymarketSDK.clearAllCache();
			return {
				message: "All caches cleared",
				timestamp: new Date().toISOString(),
			};
		},
		{
			response: {
				200: z.object({
					message: z.string(),
					timestamp: z.string(),
				}),
			},
			detail: {
				tags: ["CLOB API"],
				summary: "Clear all caches",
				description:
					"Clear all cached SDK instances and CLOB clients. Useful for debugging or forced refresh.",
			},
		},
	);
