/**
 * Elysia Type Schemas for Polymarket Proxy Server
 *
 * This file contains all the type schemas used by the Elysia server for request/response validation.
 * Uses Elysia's built-in type validation system with `t` from 'elysia'.
 */

import { t } from "elysia";

// Base types used across different schemas
const StringArray = t.Array(t.String());
const OptionalString = t.Optional(t.String());
const OptionalNumber = t.Optional(t.Number());
const OptionalBoolean = t.Optional(t.Boolean());

/**
 * Schema for market objects returned by the Gamma API
 *
 * Defines the structure for Polymarket prediction market data including
 * pricing, volume, liquidity, and associated metadata.
 */
export const MarketSchema = t.Object({
	id: t.String(),
	question: t.String(),
	conditionId: t.String(),
	slug: t.String(),
	liquidity: OptionalString,
	startDate: OptionalString,
	image: t.String(),
	icon: t.String(),
	description: t.String(),
	active: t.Boolean(),
	volume: t.String(),
	outcomes: StringArray,
	outcomePrices: StringArray,
	closed: t.Boolean(),
	new: OptionalBoolean,
	questionID: OptionalString,
	volumeNum: t.Number(),
	liquidityNum: OptionalNumber,
	startDateIso: OptionalString,
	hasReviewedDates: OptionalBoolean,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	clobTokenIds: StringArray,
	events: t.Optional(
		t.Array(
			t.Object({
				id: t.String(),
				ticker: t.String(),
				slug: t.String(),
				title: t.String(),
				description: t.String(),
				active: t.Boolean(),
				closed: t.Boolean(),
				archived: t.Boolean(),
			}),
		),
	),
});

/**
 * Schema for market objects that belong to events
 *
 * Represents markets that are part of an event, containing similar
 * market data but in the context of event groupings.
 */
export const EventMarketSchema = t.Object({
	id: t.String(),
	question: t.String(),
	conditionId: t.String(),
	slug: t.String(),
	resolutionSource: OptionalString,
	endDate: OptionalString,
	liquidity: OptionalString,
	startDate: OptionalString,
	image: t.String(),
	icon: t.String(),
	description: t.String(),
	outcomes: StringArray,
	outcomePrices: StringArray,
	volume: OptionalString,
	active: t.Boolean(),
	closed: t.Boolean(),
	marketMakerAddress: OptionalString,
	createdAt: t.String(),
	updatedAt: t.String(),
	new: OptionalBoolean,
	featured: OptionalBoolean,
	archived: OptionalBoolean,
	restricted: OptionalBoolean,
	groupItemTitle: OptionalString,
	groupItemThreshold: OptionalString,
	questionID: OptionalString,
	enableOrderBook: OptionalBoolean,
	orderPriceMinTickSize: OptionalNumber,
	orderMinSize: OptionalNumber,
	volumeNum: OptionalNumber,
	liquidityNum: OptionalNumber,
	endDateIso: OptionalString,
	startDateIso: OptionalString,
	hasReviewedDates: OptionalBoolean,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	clobTokenIds: StringArray,
	spread: OptionalNumber,
	oneDayPriceChange: OptionalNumber,
	oneHourPriceChange: OptionalNumber,
	lastTradePrice: OptionalNumber,
	bestBid: OptionalNumber,
	bestAsk: OptionalNumber,
	competitive: OptionalNumber,
});

// Series Schema
/**
 * Schema for series objects in the Gamma API
 *
 * Defines the structure for market series data, which groups
 * related markets together under a common theme or topic.
 */
export const SeriesSchema = t.Object({
	id: t.String(),
	ticker: t.String(),
	slug: t.String(),
	title: t.String(),
	subtitle: OptionalString,
	seriesType: t.String(),
	recurrence: t.String(),
	image: OptionalString,
	icon: OptionalString,
	active: t.Boolean(),
	closed: t.Boolean(),
	archived: t.Boolean(),
	volume: OptionalNumber,
	liquidity: OptionalNumber,
	startDate: OptionalString,
	createdAt: t.String(),
	updatedAt: t.String(),
	competitive: OptionalString,
	volume24hr: OptionalNumber,
	pythTokenID: OptionalString,
	cgAssetName: OptionalString,
	commentCount: t.Number(),
});

// Tag Schema
/**
 * Schema for tag objects used to categorize markets and events
 *
 * Tags provide categorization and filtering capabilities for
 * markets and events in the Polymarket ecosystem.
 */
export const TagSchema = t.Object({
	id: t.String(),
	label: t.String(),
	slug: t.String(),
	forceShow: OptionalBoolean,
	createdAt: OptionalString,
	isCarousel: OptionalBoolean,
});

// Event Schema
/**
 * Schema for event objects returned by the Gamma API
 *
 * Events are collections of related markets that share a common
 * theme, topic, or timeframe (e.g., "2024 US Presidential Election").
 */
export const EventSchema = t.Object({
	id: t.String(),
	ticker: t.String(),
	slug: t.String(),
	title: t.String(),
	description: t.String(),
	resolutionSource: OptionalString,
	startDate: OptionalString,
	creationDate: t.String(),
	endDate: t.String(),
	image: t.String(),
	icon: t.String(),
	active: t.Boolean(),
	closed: t.Boolean(),
	archived: t.Boolean(),
	new: OptionalBoolean,
	featured: OptionalBoolean,
	restricted: OptionalBoolean,
	liquidity: OptionalNumber,
	volume: t.Number(),
	openInterest: t.Number(),
	createdAt: t.String(),
	updatedAt: t.String(),
	competitive: OptionalNumber,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	enableOrderBook: OptionalBoolean,
	liquidityClob: OptionalNumber,
	negRisk: OptionalBoolean,
	commentCount: t.Number(),
	markets: t.Array(EventMarketSchema),
	series: t.Optional(t.Array(SeriesSchema)),
	tags: t.Optional(t.Array(TagSchema)),
	cyom: OptionalBoolean,
	showAllOutcomes: OptionalBoolean,
	showMarketImages: OptionalBoolean,
	enableNegRisk: OptionalBoolean,
	automaticallyActive: OptionalBoolean,
	seriesSlug: OptionalString,
	gmpChartMode: OptionalString,
	negRiskAugmented: OptionalBoolean,
	pendingDeployment: OptionalBoolean,
	deploying: OptionalBoolean,
});

/**
 * Schema for individual price history data points
 *
 * Represents a single point in time with timestamp and price data
 * for market price history tracking.
 */
export const PriceHistoryPointSchema = t.Object({
	t: t.Number(), // timestamp
	p: t.Number(), // price
});

/**
 * Schema for price history API responses
 *
 * Contains an array of price history points and optional time range
 * metadata for the requested historical data.
 */
export const PriceHistoryResponseSchema = t.Object({
	history: t.Array(PriceHistoryPointSchema),
	timeRange: t.Union([
		t.Object({
			start: t.String(),
			end: t.String(),
		}),
		t.Null(),
	]),
});

/**
 * Schema for market query parameters
 *
 * Defines all possible query parameters for filtering, sorting,
 * and paginating market data from the Gamma API.
 */
export const MarketQuerySchema = t.Object({
	// Pagination
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),

	// Sorting
	order: OptionalString,
	ascending: t.Optional(t.String()), // String because query params come as strings

	// Filters
	id: t.Optional(t.String()),
	slug: OptionalString,
	archived: t.Optional(t.String()),
	active: t.Optional(t.String()),
	closed: t.Optional(t.String()),
	clob_token_ids: OptionalString,
	condition_ids: OptionalString,

	// Numeric filters
	liquidity_num_min: t.Optional(t.String()),
	liquidity_num_max: t.Optional(t.String()),
	volume_num_min: t.Optional(t.String()),
	volume_num_max: t.Optional(t.String()),

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,

	// Tag filters
	tag_id: t.Optional(t.String()),
	related_tags: t.Optional(t.String()),
});

/**
 * Schema for event query parameters
 *
 * Defines all possible query parameters for filtering, sorting,
 * and paginating event data from the Gamma API.
 */
export const EventQuerySchema = t.Object({
	// Pagination
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),

	// Sorting
	order: OptionalString,
	ascending: t.Optional(t.String()), // String because query params come as strings

	// Filters
	id: t.Optional(t.String()),
	slug: OptionalString,
	archived: t.Optional(t.String()),
	active: t.Optional(t.String()),
	closed: t.Optional(t.String()),

	// Numeric filters
	liquidity_min: t.Optional(t.String()),
	liquidity_max: t.Optional(t.String()),
	volume_min: t.Optional(t.String()),
	volume_max: t.Optional(t.String()),

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,

	// Tag filters
	tag: OptionalString,
	tag_id: t.Optional(t.String()),
	related_tags: t.Optional(t.String()),
	tag_slug: OptionalString,
});

/**
 * Enum for price history time intervals
 *
 * Defines the available time intervals for fetching historical
 * price data from the CLOB API.
 */
export const PriceHistoryIntervalEnum = t.UnionEnum([
	"1m",
	"1h",
	"6h",
	"1d",
	"1w",
	"max",
]);

/**
 * Schema for price history query parameters
 *
 * Defines parameters for fetching historical price data from the CLOB API,
 * including market identification, time ranges, and data fidelity options.
 */
export const PriceHistoryQuerySchema = t.Object({
	// Required market parameter
	market: t.String(), // The CLOB token ID for which to fetch price history

	// Time range options (mutually exclusive with interval)
	startTs: t.Optional(t.Number()), // Unix timestamp in seconds
	endTs: t.Optional(t.Number()), // Unix timestamp in seconds

	// Human-readable date alternatives (converted to startTs/endTs)
	startDate: t.Optional(t.String()), // Date string like "2025-08-13" or "2025-08-13T00:00:00.000Z"
	endDate: t.Optional(t.String()), // Date string like "2025-08-13" or "2025-08-13T00:00:00.000Z"

	// Interval option (mutually exclusive with startTs/endTs/startDate/endDate)
	interval: t.Optional(PriceHistoryIntervalEnum),

	// Data resolution
	fidelity: t.Optional(t.Number()), // Resolution in minutes
});

/**
 * Schema for CLOB client configuration
 *
 * Defines the required and optional parameters for initializing
 * a Polymarket CLOB client with authentication credentials.
 */
export const ClobClientConfigSchema = t.Object({
	privateKey: t.String(),
	funderAddress: t.String(),
	host: t.Optional(t.String()),
	chainId: t.Optional(t.Number()),
	signatureType: t.Optional(t.Number()),
});

/**
 * Schema for error responses
 *
 * Standard error response format used across all API endpoints
 * when requests fail or encounter errors.
 */
export const ErrorResponseSchema = t.Object({
	error: t.String(),
	message: t.String(),
	details: t.Optional(t.String()),
});

/**
 * Schema for health check responses
 *
 * Response format for API health check endpoints that indicate
 * service status and operational metrics.
 */
export const HealthResponseSchema = t.Object({
	status: t.Union([t.Literal("healthy"), t.Literal("unhealthy")]),
	timestamp: t.String(),
	clob: t.String(),
	cached: t.Optional(t.Boolean()),
	error: t.Optional(t.String()),
});

/**
 * Schema for order summary in order book
 *
 * Represents a single price level in the order book with price and size.
 */
export const OrderSummarySchema = t.Object({
	price: t.String(),
	size: t.String(),
});

/**
 * Schema for order book summary response
 *
 * Complete order book data including bids, asks, and market metadata.
 */
export const OrderBookSummarySchema = t.Object({
	market: t.String(),
	asset_id: t.String(),
	timestamp: t.String(),
	bids: t.Array(OrderSummarySchema),
	asks: t.Array(OrderSummarySchema),
	min_order_size: t.String(),
	tick_size: t.String(),
	neg_risk: t.Boolean(),
	hash: t.String(),
});

/**
 * Schema for book parameters used in batch operations (requires side)
 */
export const BookParamsSchema = t.Object({
	token_id: t.String(),
	side: t.UnionEnum(["BUY", "SELL"]),
});

/**
 * Schema for price query parameters
 */
export const PriceQuerySchema = t.Object({
	tokenId: t.String(),
	side: t.UnionEnum(["buy", "sell"]),
});

/**
 * Schema for midpoint query parameters
 */
export const MidpointQuerySchema = t.Object({
	tokenId: t.String(),
});

/**
 * Schema for simple token parameters (just token_id)
 */
export const TokenParamsSchema = t.Object({
	token_id: t.String(),
});

/**
 * Schema for trade query parameters
 */
export const TradeParamsSchema = t.Object({
	id: t.Optional(t.String()),
	maker_address: t.Optional(t.String()),
	market: t.Optional(t.String()),
	asset_id: t.Optional(t.String()),
	before: t.Optional(t.String()),
	after: t.Optional(t.String()),
});

/**
 * Schema for trade objects
 */
export const TradeSchema = t.Object({
	id: t.String(),
	taker_order_id: t.String(),
	market: t.String(),
	asset_id: t.String(),
	side: t.UnionEnum(["BUY", "SELL"]),
	size: t.String(),
	fee_rate_bps: t.String(),
	price: t.String(),
	status: t.String(),
	match_time: t.String(),
	last_update: t.String(),
	outcome: t.String(),
	bucket_index: t.Number(),
	owner: t.String(),
	maker_address: t.String(),
});

/**
 * Schema for pagination payload
 */
export const PaginationPayloadSchema = t.Object({
	limit: t.Number(),
	count: t.Number(),
	next_cursor: t.String(),
	data: t.Array(t.Any()),
});

/**
 * Schema for market query parameters (with pagination)
 */
export const MarketPaginationQuerySchema = t.Object({
	next_cursor: t.Optional(t.String()),
});

// Type exports for use in handlers and SDK

/** TypeScript type for market objects derived from MarketSchema */
export type MarketType = typeof MarketSchema.static;

/** TypeScript type for event objects derived from EventSchema */
export type EventType = typeof EventSchema.static;

/** TypeScript type for event market objects derived from EventMarketSchema */
export type EventMarketType = typeof EventMarketSchema.static;

/** TypeScript type for series objects derived from SeriesSchema */
export type SeriesType = typeof SeriesSchema.static;

/** TypeScript type for tag objects derived from TagSchema */
export type TagType = typeof TagSchema.static;

/** TypeScript type for price history responses derived from PriceHistoryResponseSchema */
export type PriceHistoryResponseType = typeof PriceHistoryResponseSchema.static;

/** TypeScript type for price history data points derived from PriceHistoryPointSchema */
export type PriceHistoryPointType = typeof PriceHistoryPointSchema.static;

/** TypeScript type for market query parameters derived from MarketQuerySchema */
export type MarketQueryType = typeof MarketQuerySchema.static;

/** TypeScript type for event query parameters derived from EventQuerySchema */
export type EventQueryType = typeof EventQuerySchema.static;

/** TypeScript type for price history query parameters derived from PriceHistoryQuerySchema */
export type PriceHistoryQueryType = typeof PriceHistoryQuerySchema.static;

/** TypeScript type for CLOB client configuration derived from ClobClientConfigSchema */
export type ClobClientConfigType = typeof ClobClientConfigSchema.static;

/** TypeScript type for order summary derived from OrderSummarySchema */
export type OrderSummaryType = typeof OrderSummarySchema.static;

/** TypeScript type for order book summary derived from OrderBookSummarySchema */
export type OrderBookSummaryType = typeof OrderBookSummarySchema.static;

/** TypeScript type for book parameters derived from BookParamsSchema */
export type BookParamsType = typeof BookParamsSchema.static;

/** TypeScript type for price query parameters derived from PriceQuerySchema */
export type PriceQueryType = typeof PriceQuerySchema.static;

/** TypeScript type for midpoint query parameters derived from MidpointQuerySchema */
export type MidpointQueryType = typeof MidpointQuerySchema.static;

/** TypeScript type for token parameters derived from TokenParamsSchema */
export type TokenParamsType = typeof TokenParamsSchema.static;

/** TypeScript type for trade parameters derived from TradeParamsSchema */
export type TradeParamsType = typeof TradeParamsSchema.static;

/** TypeScript type for trade objects derived from TradeSchema */
export type TradeType = typeof TradeSchema.static;

/** TypeScript type for pagination payload derived from PaginationPayloadSchema */
export type PaginationPayloadType = typeof PaginationPayloadSchema.static;

/** TypeScript type for market pagination query derived from MarketPaginationQuerySchema */
export type MarketPaginationQueryType =
	typeof MarketPaginationQuerySchema.static;
