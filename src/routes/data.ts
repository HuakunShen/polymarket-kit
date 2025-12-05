/**
 * Data API Routes
 *
 * This file handles all routes for the Polymarket Data API (https://data-api.polymarket.com).
 * Provides typed endpoints for all available Data API operations including health checks,
 * user positions, trades, activity, holders, portfolio analytics, and market analytics.
 * Uses the dedicated DataSDK for credential-free API access.
 */

import { Effect } from "effect";
import { Elysia, t } from "elysia";
import { DataSDK, type ProxyConfigType } from "../sdk/";
import {
	// Data API Schemas
	DataHealthResponseSchema,
	PositionSchema,
	PositionsQuerySchema,
	ClosedPositionSchema,
	ClosedPositionsQuerySchema,
	DataTradeSchema,
	TradesQuerySchema,
	ActivitySchema,
	UserActivityQueryWithoutUserSchema,
	MetaHolderSchema,
	TopHoldersQuerySchema,
	TotalValueSchema,
	TotalValueQuerySchema,
	TotalMarketsTradedSchema,
	TotalMarketsTradedQuerySchema,
	OpenInterestSchema,
	OpenInterestQuerySchema,
	LiveVolumeResponseSchema,
	LiveVolumeQuerySchema,
	PolymarketProfileSchema,
	PolymarketProfileQuerySchema,
	// Error responses
	ErrorResponseSchema,
} from "../types/elysia-schemas";

/**
 * Parse proxy string into ProxyConfigType using Effect for validation
 * Supports formats like:
 * - http://proxy.com:8080
 * - http://user:pass@proxy.com:8080
 * - https://proxy.com:3128
 */
const parseProxyStringEffect = (
	proxyString: string,
): Effect.Effect<ProxyConfigType, Error> =>
	Effect.try({
		try: () => {
			const url = new URL(proxyString);
			const config: ProxyConfigType = {
				protocol: url.protocol.slice(0, -1) as "http" | "https",
				host: url.hostname,
				port: parseInt(url.port, 10),
			};

			if (url.username) {
				config.username = decodeURIComponent(url.username);
			}
			if (url.password) {
				config.password = decodeURIComponent(url.password);
			}

			return config;
		},
		catch: () =>
			new Error(`[DataRoutes] Invalid proxy URL format: ${proxyString}`),
	});

const createDataSDKEffect = (
	proxyHeader: string | undefined,
): Effect.Effect<DataSDK, never> =>
	proxyHeader
		? Effect.catchAll(
				Effect.map(
					parseProxyStringEffect(proxyHeader),
					(proxyConfig) => new DataSDK({ proxy: proxyConfig }),
				),
				(error) =>
					Effect.sync(() => {
						console.warn(`Invalid proxy header format: ${proxyHeader}`, error);
						return new DataSDK();
					}),
			)
		: Effect.succeed(new DataSDK());

/**
 * Create Data API routes with proper typing and validation for all available endpoints
 */
export const dataRoutes = new Elysia({ prefix: "/data" })
	// Middleware to create DataSDK instance based on proxy header
	.derive(({ headers }) => {
		const proxyHeaderValue = headers["x-http-proxy"];
		const proxyHeader = Array.isArray(proxyHeaderValue)
			? proxyHeaderValue[0]
			: typeof proxyHeaderValue === "string"
				? proxyHeaderValue
				: undefined;

		const dataSDK = Effect.runSync(createDataSDKEffect(proxyHeader));

		return {
			dataSDK,
		};
	})

	// Health Check API
	.get(
		"/health",
		async ({ dataSDK }) => {
			return await dataSDK.healthCheck();
		},
		{
			response: {
				200: DataHealthResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Health"],
				summary: "Health check",
				description: "Check if the Data API is operational",
			},
		},
	)

	// Positions API
	.get(
		"/positions",
		async ({ query, dataSDK }) => {
			return await dataSDK.getCurrentPositions(query);
		},
		{
			query: PositionsQuerySchema,
			response: {
				200: t.Array(PositionSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Positions"],
				summary: "Get current positions",
				description:
					"Retrieve current positions for a user with comprehensive filtering options",
			},
		},
	)

	.get(
		"/positions/closed",
		async ({ query, dataSDK }) => {
			return await dataSDK.getClosedPositions(query);
		},
		{
			query: ClosedPositionsQuerySchema,
			response: {
				200: t.Array(ClosedPositionSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Positions"],
				summary: "Get closed positions",
				description:
					"Retrieve closed positions for a user with filtering options",
			},
		},
	)

	.get(
		"/positions/all",
		async ({ query: { user, ...options }, dataSDK }) => {
			if (!user) {
				throw new Error("User parameter is required");
			}
			return await dataSDK.getAllPositions(user, options);
		},
		{
			query: t.Object({
				user: t.String({ description: "User wallet address" }),
				limit: t.Optional(t.Number()),
				offset: t.Optional(t.Number()),
				sortBy: t.Optional(t.String()),
				sortDirection: t.Optional(t.UnionEnum(["ASC", "DESC"])),
			}),
			response: {
				200: t.Object({
					current: t.Array(PositionSchema),
					closed: t.Array(ClosedPositionSchema),
				}),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Positions"],
				summary: "Get all positions (current and closed)",
				description:
					"Retrieve both current and closed positions for a user in a single request",
			},
		},
	)

	// Trades API
	.get(
		"/trades",
		async ({ query, dataSDK }) => {
			return await dataSDK.getTrades(query);
		},
		{
			query: TradesQuerySchema,
			response: {
				200: t.Array(DataTradeSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Trades"],
				summary: "Get trades",
				description:
					"Retrieve trades for users or markets with filtering options",
			},
		},
	)

	// Holders API
	.get(
		"/holders",
		async ({ query, dataSDK }) => {
			return await dataSDK.getTopHolders(query);
		},
		{
			query: TopHoldersQuerySchema,
			response: {
				200: t.Array(MetaHolderSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Holders"],
				summary: "Get top holders",
				description:
					"Retrieve top holders for specified markets with balance filtering",
			},
		},
	)

	// Portfolio Analytics API
	.get(
		"/portfolio/value",
		async ({ query, dataSDK }) => {
			return await dataSDK.getTotalValue(query);
		},
		{
			query: TotalValueQuerySchema,
			response: {
				200: t.Array(TotalValueSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Portfolio"],
				summary: "Get total portfolio value",
				description: "Retrieve total value of a user's positions",
			},
		},
	)

	.get(
		"/portfolio/markets-traded",
		async ({ query, dataSDK }) => {
			return await dataSDK.getTotalMarketsTraded(query);
		},
		{
			query: TotalMarketsTradedQuerySchema,
			response: {
				200: TotalMarketsTradedSchema,
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Portfolio"],
				summary: "Get total markets traded",
				description: "Get the total number of markets a user has traded",
			},
		},
	)

	.get(
		"/portfolio/summary",
		async ({ query: { user }, dataSDK }) => {
			if (!user) {
				throw new Error("User parameter is required");
			}
			return await dataSDK.getPortfolioSummary(user);
		},
		{
			query: t.Object({
				user: t.String({ description: "User wallet address" }),
			}),
			response: {
				200: t.Object({
					totalValue: t.Array(TotalValueSchema),
					marketsTraded: TotalMarketsTradedSchema,
					currentPositions: t.Array(PositionSchema),
				}),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Portfolio"],
				summary: "Get portfolio summary",
				description:
					"Get a comprehensive portfolio summary including total value, markets traded, and current positions",
			},
		},
	)

	// Market Analytics API
	.get(
		"/analytics/open-interest",
		async ({ query, dataSDK }) => {
			return await dataSDK.getOpenInterest(query);
		},
		{
			query: OpenInterestQuerySchema,
			response: {
				200: t.Array(OpenInterestSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Analytics"],
				summary: "Get open interest",
				description: "Retrieve open interest data for specified markets",
			},
		},
	)

	.get(
		"/analytics/live-volume",
		async ({ query, dataSDK }) => {
			return await dataSDK.getLiveVolume(query);
		},
		{
			query: LiveVolumeQuerySchema,
			response: {
				200: LiveVolumeResponseSchema,
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - Analytics"],
				summary: "Get live volume",
				description: "Retrieve live trading volume for an event",
			},
		},
	)

	// Convenience endpoints for common use cases
	.get(
		"/user/:userAddress/portfolio",
		async ({ params, dataSDK }) => {
			return await dataSDK.getPortfolioSummary(params.userAddress);
		},
		{
			params: t.Object({
				userAddress: t.String({ description: "User wallet address" }),
			}),
			query: t.Object({
				limit: t.Optional(t.Number()),
				offset: t.Optional(t.Number()),
				sortBy: t.Optional(t.String()),
				sortDirection: t.Optional(t.UnionEnum(["ASC", "DESC"])),
			}),
			response: {
				200: t.Object({
					totalValue: t.Array(TotalValueSchema),
					marketsTraded: TotalMarketsTradedSchema,
					currentPositions: t.Array(PositionSchema),
				}),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - User"],
				summary: "Get user portfolio by address",
				description:
					"Get comprehensive portfolio summary for a user by their wallet address",
			},
		},
	)

	.get(
		"/user/:userAddress/positions",
		async ({ params, query, dataSDK }) => {
			return await dataSDK.getCurrentPositions({
				user: params.userAddress,
				...query,
			});
		},
		{
			params: t.Object({
				userAddress: t.String({ description: "User wallet address" }),
			}),
			query: t.Object({
				market: t.Optional(t.Array(t.String())),
				eventId: t.Optional(t.Array(t.String())),
				sizeThreshold: t.Optional(t.Union([t.String(), t.Number()])),
				redeemable: t.Optional(t.Boolean()),
				mergeable: t.Optional(t.Boolean()),
				limit: t.Optional(t.Number()),
				offset: t.Optional(t.Number()),
				sortBy: t.Optional(t.String()),
				sortDirection: t.Optional(t.UnionEnum(["ASC", "DESC"])),
				title: t.Optional(t.String()),
			}),
			response: {
				200: t.Array(PositionSchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - User"],
				summary: "Get user positions by address",
				description: "Get current positions for a user by their wallet address",
			},
		},
	)

	.get(
		"/user/:userAddress/activity",
		async ({ params, query, dataSDK }) => {
			const response = await dataSDK.getUserActivity({
				user: params.userAddress,
				...query,
			});
			return response;
		},
		{
			params: t.Object({
				userAddress: t.String({ description: "User wallet address" }),
			}),
			query: UserActivityQueryWithoutUserSchema,
			response: {
				200: t.Array(ActivitySchema),
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - User"],
				summary: "Get user activity by address",
				description: "Get activity history for a user by their wallet address",
			},
		},
	)

	// Polymarket Profile API
	.get(
		"/user/:userAddress/profile",
		async ({ params, set }): Promise<
			typeof PolymarketProfileSchema.static | typeof ErrorResponseSchema.static
		> => {
			const address = params.userAddress;
			const url = `https://polymarket.com/api/profile/userData?address=${encodeURIComponent(address)}`;
			
			try {
				const response = await fetch(url);
				if (!response.ok) {
					set.status = response.status >= 500 ? 500 : 400;
					return {
						error: "Bad Request",
						message: `Polymarket API returned ${response.status}`,
					};
				}
				const data = (await response.json()) as typeof PolymarketProfileSchema.static;
				return data;
			} catch (error) {
				console.error("[Profile API] Error fetching user profile:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					message: `Failed to fetch user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
				};
			}
		},
		{
			params: t.Object({
				userAddress: t.String({ description: "User wallet address" }),
			}),
			response: {
				200: PolymarketProfileSchema,
				400: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Data API - User"],
				summary: "Get user profile from Polymarket",
				description:
					"Retrieve user profile information including name, avatar, and verification status from Polymarket's profile API",
			},
		},
	);
