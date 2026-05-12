/**
 * Elysia Type Schemas for Polymarket Proxy Server
 *
 * This file contains all the type schemas used by the Elysia server for request/response validation.
 * Uses Elysia's built-in type validation system with `t` from 'elysia'.
 */

import { t, type TSchema } from "elysia";
import { TypeCompiler } from "@sinclair/typebox/compiler";

// Base types used across different schemas
const StringArray = t.Array(t.String());
const OptionalString = t.Optional(t.String());
const OptionalNumber = t.Optional(t.Number());
const OptionalBoolean = t.Optional(t.Boolean());

/**
 * HTTP Proxy Configuration Schema
 *
 * Configuration for HTTP/HTTPS proxy settings
 */
export const ProxyConfigSchema = t.Optional(
	t.Object({
		host: t.String({ description: "Proxy server hostname or IP address" }),
		port: t.Number({ description: "Proxy server port number" }),
		username: t.Optional(
			t.String({ description: "Proxy authentication username" }),
		),
		password: t.Optional(
			t.String({ description: "Proxy authentication password" }),
		),
		protocol: t.Optional(
			t.Union([t.Literal("http"), t.Literal("https")], {
				description: "Proxy protocol (defaults to http)",
			}),
		),
	}),
);

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
	endDate: OptionalString,
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
	marketMakerAddress: OptionalString,
	createdAt: OptionalString,
	updatedAt: OptionalString,
	closedTime: OptionalString,
	new: OptionalBoolean,
	featured: OptionalBoolean,
	submitted_by: OptionalString,
	archived: OptionalBoolean,
	resolvedBy: OptionalString,
	restricted: OptionalBoolean,
	groupItemTitle: OptionalString,
	groupItemThreshold: OptionalString,
	questionID: OptionalString,
	umaEndDate: OptionalString,
	enableOrderBook: OptionalBoolean,
	orderPriceMinTickSize: OptionalNumber,
	orderMinSize: OptionalNumber,
	umaResolutionStatus: OptionalString,
	volumeNum: t.Number(),
	liquidityNum: OptionalNumber,
	endDateIso: OptionalString,
	startDateIso: OptionalString,
	hasReviewedDates: OptionalBoolean,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	volume1wkClob: OptionalNumber,
	volume1moClob: OptionalNumber,
	volume1yrClob: OptionalNumber,
	volumeClob: OptionalNumber,
	customLiveness: OptionalNumber,
	acceptingOrders: OptionalBoolean,
	negRisk: OptionalBoolean,
	negRiskMarketID: OptionalString,
	negRiskRequestID: OptionalString,
	clobTokenIds: StringArray,
	umaBond: OptionalString,
	umaReward: OptionalString,
	ready: OptionalBoolean,
	funded: OptionalBoolean,
	acceptingOrdersTimestamp: OptionalString,
	cyom: OptionalBoolean,
	pagerDutyNotificationEnabled: OptionalBoolean,
	approved: OptionalBoolean,
	rewardsMinSize: OptionalNumber,
	rewardsMaxSpread: OptionalNumber,
	spread: OptionalNumber,
	automaticallyResolved: OptionalBoolean,
	oneWeekPriceChange: OptionalNumber,
	oneMonthPriceChange: OptionalNumber,
	lastTradePrice: OptionalNumber,
	bestAsk: OptionalNumber,
	automaticallyActive: OptionalBoolean,
	clearBookOnStart: OptionalBoolean,
	showGmpSeries: OptionalBoolean,
	showGmpOutcome: OptionalBoolean,
	manualActivation: OptionalBoolean,
	negRiskOther: OptionalBoolean,
	umaResolutionStatuses: OptionalString,
	pendingDeployment: OptionalBoolean,
	deploying: OptionalBoolean,
	deployingTimestamp: OptionalString,
	rfqEnabled: OptionalBoolean,
	holdingRewardsEnabled: OptionalBoolean,
	feesEnabled: OptionalBoolean,
	events: t.Optional(
		t.Array(
			t.Object({
				id: t.String(),
				ticker: OptionalString,
				slug: t.String(),
				title: t.String(),
				description: t.String(),
				active: t.Boolean(),
				closed: t.Boolean(),
				archived: OptionalBoolean,
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
	image: OptionalString, // Changed to optional as it can be missing
	icon: OptionalString, // Changed to optional as it can be missing
	description: t.String(),
	outcomes: StringArray, // Can be either array or JSON string
	outcomePrices: t.Union([StringArray, t.String()]), // Can be either array or JSON string
	volume: OptionalString,
	active: t.Boolean(),
	closed: t.Boolean(),
	marketMakerAddress: OptionalString,
	createdAt: t.String(),
	updatedAt: OptionalString, // Can be missing in API responses
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
	clobTokenIds: StringArray, // Can be either array or JSON string
	// clobTokenIds: t.Union([StringArray, t.String()]), // Can be either array or JSON string
	spread: OptionalNumber,
	oneDayPriceChange: OptionalNumber,
	oneHourPriceChange: OptionalNumber,
	lastTradePrice: OptionalNumber,
	bestBid: OptionalNumber,
	bestAsk: OptionalNumber,
	competitive: OptionalNumber,
});

/**
 * Schema for event objects within a series
 *
 * Represents simplified event objects that are part of a series.
 * These are different from EventMarketSchema as they don't contain
 * market-specific fields like outcomes, conditionId, etc.
 */
export const SeriesEventSchema = t.Object({
	id: t.String(),
	slug: t.String(),
	title: t.String(),
	resolutionSource: OptionalString,
	endDate: OptionalString,
	startDate: OptionalString,
	image: OptionalString,
	icon: OptionalString,
	description: t.String(),
	volume: OptionalNumber, // Number, not string
	liquidity: OptionalNumber, // Number, not string
	active: t.Boolean(),
	closed: t.Boolean(),
	createdAt: t.String(),
	updatedAt: OptionalString,
	new: OptionalBoolean,
	featured: OptionalBoolean,
	archived: OptionalBoolean,
	restricted: OptionalBoolean,
	enableOrderBook: OptionalBoolean,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
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
	ticker: OptionalString,
	slug: t.String(),
	title: t.String(),
	subtitle: OptionalString,
	seriesType: OptionalString,
	recurrence: OptionalString,
	image: OptionalString,
	icon: OptionalString,
	active: t.Boolean(),
	closed: t.Boolean(),
	archived: OptionalBoolean,
	events: t.Optional(t.Array(SeriesEventSchema)),
	volume: OptionalNumber,
	liquidity: OptionalNumber,
	startDate: OptionalString,
	createdAt: t.String(),
	updatedAt: OptionalString,
	competitive: t.Optional(t.Union([t.String(), t.Number()])), // Can be string or number, but optional
	volume24hr: OptionalNumber,
	pythTokenID: OptionalString,
	cgAssetName: OptionalString,
	commentCount: t.Optional(t.Number()),
	// Additional fields that may be present but are optional
	featured: OptionalBoolean,
	restricted: OptionalBoolean,
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
	ticker: OptionalString,
	slug: t.String(),
	title: t.String(),
	description: OptionalString,
	resolutionSource: OptionalString,
	startDate: OptionalString,
	creationDate: OptionalString,
	// endDate: t.String(), // Changed from t.String() to OptionalString to handle missing endDate
	endDate: OptionalString, // Changed from t.String() to OptionalString to handle missing endDate
	image: t.String(),
	icon: t.String(),
	active: t.Boolean(),
	closed: t.Boolean(),
	archived: OptionalBoolean,
	new: OptionalBoolean,
	featured: OptionalBoolean,
	restricted: OptionalBoolean,
	liquidity: OptionalNumber,
	volume: OptionalNumber, // Changed from t.Number() to OptionalNumber to handle missing values
	openInterest: OptionalNumber,
	createdAt: t.String(),
	updatedAt: OptionalString,
	competitive: OptionalNumber,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	enableOrderBook: OptionalBoolean,
	liquidityClob: OptionalNumber,
	negRisk: OptionalBoolean,
	commentCount: t.Optional(t.Number()),
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
	// Additional fields found in actual API responses
	sortBy: OptionalString,
	closedTime: OptionalString,
	liquidityAmm: OptionalNumber,
	automaticallyResolved: OptionalBoolean,
	negRiskMarketID: OptionalString,
	deployingTimestamp: OptionalString,
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

export const BatchPricesHistoryRequestSchema = t.Object({
	markets: t.Array(t.String(), { maxItems: 20 }),
	start_ts: t.Optional(t.Number()),
	end_ts: t.Optional(t.Number()),
	interval: t.Optional(t.Union([
		t.Literal("max"),
		t.Literal("all"),
		t.Literal("1m"),
		t.Literal("1w"),
		t.Literal("1d"),
		t.Literal("6h"),
		t.Literal("1h"),
	])),
	fidelity: t.Optional(t.Number()),
});

export const BatchPricesHistoryResponseSchema = t.Object({
	history: t.Record(t.String(), t.Array(PriceHistoryPointSchema)),
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
// export const PriceHistoryIntervalEnum = t.UnionEnum([
// 	"1m",
// 	"1h",
// 	"6h",
// 	"1d",
// 	"1w",
// 	"max",
// ]);

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
	// Using t.Union with explicit undefined to prevent defaulting to first enum value
	interval: t.Optional(
		t.Union([
			t.Literal("1m"),
			t.Literal("1h"),
			t.Literal("6h"),
			t.Literal("1d"),
			t.Literal("1w"),
			t.Literal("max"),
		]),
	),

	// Data resolution
	fidelity: t.Optional(t.Number()), // Resolution in minutes
});

/**
 * Schema for CLOB client configuration
 *
 * Defines the required and optional parameters for initializing
 * a Polymarket CLOB client with authentication credentials or public access.
 */
export const ClobClientConfigSchema = t.Object({
	privateKey: t.Optional(t.String()),
	funderAddress: t.Optional(t.String()),
	host: t.Optional(t.String()),
	chainId: t.Optional(t.Number()),
	signatureType: t.Optional(t.Number()),
	builderConfig: t.Optional(t.Any()), // BuilderConfig instance
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
 * Schema for Gamma API specific error responses
 *
 * Error response format specific to Gamma API endpoints
 * when requests fail (especially 404 errors).
 */
export const GammaErrorResponseSchema = t.Object({
	type: t.String(),
	error: t.String(),
});

/**
 * Schema for Polymarket user profile data
 *
 * Represents user profile information from Polymarket's profile API
 * including display name, avatar, verification status, and user metadata.
 */
export const PolymarketProfileSchema = t.Object({
	id: t.String({ description: "User profile ID" }),
	createdAt: t.String({ description: "Profile creation timestamp (ISO 8601)" }),
	proxyWallet: t.String({ description: "User wallet address" }),
	profileImage: t.String({ description: "URL to user's profile image" }),
	displayUsernamePublic: t.Boolean({
		description: "Whether username is displayed publicly",
	}),
	pseudonym: t.Optional(t.String({ description: "User's pseudonym/display name" })),
	name: t.Optional(t.String({ description: "User's name" })),
	users: t.Array(
		t.Object({
			id: t.String(),
			creator: t.Boolean(),
			mod: t.Boolean(),
		}),
		{ description: "Associated user accounts" },
	),
	verifiedBadge: t.Boolean({ description: "Whether user has verified badge" }),
});

/**
 * Schema for Polymarket profile query parameters
 */
export const PolymarketProfileQuerySchema = t.Object({
	address: t.String({ description: "User wallet address" }),
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
	side: t.Optional(t.Union([t.Literal("BUY"), t.Literal("SELL")])),
});

/**
 * Schema for price query parameters
 */
export const PriceQuerySchema = t.Object({
	tokenId: t.String(),
	side: t.Union([t.Literal("buy"), t.Literal("sell")]),
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
	side: t.Union([t.Literal("BUY"), t.Literal("SELL")]),
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

// Health Check Schema
/**
 * Schema for health check response
 */
export const GammaHealthResponseSchema = t.Object({
	data: t.String(),
});

// Team Schema for Sports API
/**
 * Schema for team objects returned by the Sports API
 */
export const TeamSchema = t.Object({
	id: t.Number(),
	name: t.String(),
	league: t.String(),
	record: OptionalString,
	logo: t.String(),
	abbreviation: t.String(),
	alias: t.Optional(t.Nullable(t.String())),
	createdAt: t.String(),
	updatedAt: OptionalString,
});

// Team Query Schema
/**
 * Schema for team query parameters
 */
export const TeamQuerySchema = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	order: OptionalString,
	ascending: OptionalBoolean,
	league: t.Optional(t.Array(t.String())),
	name: t.Optional(t.Array(t.String())),
	abbreviation: t.Optional(t.Array(t.String())),
});

// Updated Tag Schema with new fields
/**
 * Updated schema for tag objects with new API fields
 */
export const UpdatedTagSchema = t.Object({
	id: t.String(),
	label: t.String(),
	slug: t.String(),
	forceShow: OptionalBoolean,
	publishedAt: OptionalString,
	createdBy: OptionalNumber,
	updatedBy: OptionalNumber,
	createdAt: OptionalString,
	updatedAt: OptionalString,
	forceHide: OptionalBoolean,
	isCarousel: OptionalBoolean,
});

// Tag Query Schema
/**
 * Schema for tag query parameters
 */
export const TagQuerySchema = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	order: OptionalString,
	ascending: OptionalBoolean,
	include_template: OptionalBoolean,
	is_carousel: OptionalBoolean,
});

// Tag by ID Query Schema
/**
 * Schema for tag by ID query parameters
 */
export const TagByIdQuerySchema = t.Object({
	include_template: OptionalBoolean,
});

// Related Tags Relationship Schema
/**
 * Schema for related tags relationship objects
 */
export const RelatedTagRelationshipSchema = t.Object({
	id: t.String(),
	tagID: t.Number(),
	relatedTagID: t.Number(),
	rank: t.Number(),
});

// Related Tags Query Schema
/**
 * Schema for related tags query parameters
 */
export const RelatedTagsQuerySchema = t.Object({
	omit_empty: OptionalBoolean,
	status: t.Optional(
		t.Union([t.Literal("active"), t.Literal("closed"), t.Literal("all")]),
	),
});

// Updated Event Query Schema with new fields
/**
 * Updated schema for event query parameters with new API fields
 */
export const UpdatedEventQuerySchema = t.Object({
	// Pagination
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),

	// Sorting
	order: OptionalString,
	ascending: OptionalBoolean,

	// Filters
	id: t.Optional(t.Array(t.Number())),
	slug: t.Optional(t.Array(t.String())),
	tag_id: OptionalNumber,
	exclude_tag_id: t.Optional(t.Array(t.Number())),
	featured: OptionalBoolean,
	cyom: OptionalBoolean,
	archived: OptionalBoolean,
	active: OptionalBoolean,
	closed: OptionalBoolean,

	// Additional filters
	include_chat: OptionalBoolean,
	include_template: OptionalBoolean,
	recurrence: OptionalString,

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,
});

// Paginated Event Query Schema
/**
 * Schema for paginated event query parameters
 */
export const PaginatedEventQuerySchema = t.Object({
	limit: t.Number(),
	offset: t.Number(),
	order: OptionalString,
	ascending: OptionalBoolean,
	include_chat: OptionalBoolean,
	include_template: OptionalBoolean,
	recurrence: OptionalString,
});

// Paginated Response Schema
/**
 * Schema for paginated responses
 */
export const PaginatedResponseSchema = <T extends TSchema>(schema: T) =>
	t.Object({
		data: t.Array(schema),
		pagination: t.Object({
			hasMore: t.Boolean(),
			totalResults: t.Number(),
		}),
	});

// Event by ID Query Schema
/**
 * Schema for event by ID query parameters
 */
export const EventByIdQuerySchema = t.Object({
	include_chat: OptionalBoolean,
	include_template: OptionalBoolean,
});

/**
 * Schema for markdown formatting options
 */
export const MarkdownOptionsSchema = t.Object({
	verbose: t.Optional(
		t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.String()], {
			description: "Verbosity level: 0=basic, 1=medium, 2=full details",
			default: 2,
		}),
	),
	include_markets: t.Optional(
		t.Boolean({
			description: "Whether to include market details in event markdown",
			default: true,
		}),
	),
});

// Updated Market Query Schema with new fields
/**
 * Updated schema for market query parameters with new API fields
 */
export const UpdatedMarketQuerySchema = t.Object({
	// Pagination
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),

	// Sorting
	order: OptionalString,
	ascending: OptionalBoolean,

	// Filters
	id: t.Optional(t.Array(t.Number())),
	slug: t.Optional(t.Array(t.String())),
	tag_id: OptionalNumber,
	closed: OptionalBoolean,
	active: OptionalBoolean,
	archived: OptionalBoolean,
	sports_market_types: t.Optional(t.Array(t.String())),

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,
});

// Market by ID Query Schema
/**
 * Schema for market by ID query parameters
 */
export const MarketByIdQuerySchema = t.Object({
	include_tag: OptionalBoolean,
});

// Series Query Schema
/**
 * Schema for series query parameters
 */
export const SeriesQuerySchema = t.Object({
	limit: t.Number(),
	offset: t.Number(),
	order: OptionalString,
	ascending: OptionalBoolean,
	slug: t.Optional(t.Array(t.String())),
	categories_ids: t.Optional(t.Array(t.Number())),
	categories_labels: t.Optional(t.Array(t.String())),
	closed: OptionalBoolean,
	include_chat: OptionalBoolean,
	recurrence: OptionalString,
});

// Series by ID Query Schema
/**
 * Schema for series by ID query parameters
 */
export const SeriesByIdQuerySchema = t.Object({
	include_chat: OptionalBoolean,
});

// Comment Schema
/**
 * Schema for comment objects
 */
export const CommentSchema = t.Object({
	id: t.String(),
	body: t.String(),
	parentEntityType: t.String(),
	parentEntityID: t.Number(),
	userAddress: t.String(),
	createdAt: t.String(),
	profile: t.Optional(t.Any()), // Profile object structure can vary
	reactions: t.Optional(t.Array(t.Any())), // Reaction objects can vary
	reportCount: t.Number(),
	reactionCount: t.Number(),
});

// Comment Query Schema
/**
 * Schema for comment query parameters
 */
export const CommentQuerySchema = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	order: OptionalString,
	ascending: OptionalBoolean,
	parent_entity_type: t.Optional(
		t.Union([t.Literal("Event"), t.Literal("Series"), t.Literal("market")]),
	),
	parent_entity_id: OptionalNumber,
	get_positions: OptionalBoolean,
	holders_only: OptionalBoolean,
});

// Comment by ID Query Schema
/**
 * Schema for comment by ID query parameters
 */
export const CommentByIdQuerySchema = t.Object({
	get_positions: OptionalBoolean,
});

// Comments by User Address Query Schema
/**
 * Schema for comments by user address query parameters
 */
export const CommentsByUserQuerySchema = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	order: OptionalString,
	ascending: OptionalBoolean,
});

// Search Query Schema
/**
 * Schema for public search query parameters
 */
export const SearchQuerySchema = t.Object({
	q: t.String(), // Required search query
	cache: OptionalBoolean,
	events_status: OptionalString,
	limit_per_type: OptionalNumber,
	page: OptionalNumber,
	events_tag: t.Optional(t.Array(t.String())),
	sort: OptionalString,
	ascending: OptionalBoolean,
	search_profiles: OptionalBoolean,
});

// Search Response Schema
/**
 * Schema for public search response
 */
export const SearchResponseSchema = t.Object({
	events: t.Optional(t.Array(t.Any())), // Event objects
	tags: t.Optional(t.Array(t.Any())), // Tag objects with counts
	profiles: t.Optional(t.Array(t.Any())), // Profile objects
	pagination: t.Optional(
		t.Object({
			hasMore: OptionalBoolean,
		}),
	),
});

// Type exports for use in handlers and SDK

/** TypeScript type for market objects derived from MarketSchema */
export type MarketType = typeof MarketSchema.static;

/** TypeScript type for event objects derived from EventSchema */
export type EventType = typeof EventSchema.static;

/** TypeScript type for event objects within a series derived from SeriesEventSchema */
export type SeriesEventType = typeof SeriesEventSchema.static;

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

/** TypeScript type for batch price history request derived from BatchPricesHistoryRequestSchema */
export type BatchPricesHistoryRequestType = typeof BatchPricesHistoryRequestSchema.static;

/** TypeScript type for batch price history response derived from BatchPricesHistoryResponseSchema */
export type BatchPricesHistoryResponseType = typeof BatchPricesHistoryResponseSchema.static;

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

// New type exports for Gamma API endpoints

/** TypeScript type for gamma health response derived from GammaHealthResponseSchema */
export type GammaHealthResponseType = typeof GammaHealthResponseSchema.static;

/** TypeScript type for team objects derived from TeamSchema */
export type TeamType = typeof TeamSchema.static;

/** TypeScript type for team query parameters derived from TeamQuerySchema */
export type TeamQueryType = typeof TeamQuerySchema.static;

/** TypeScript type for updated tag objects derived from UpdatedTagSchema */
export type UpdatedTagType = typeof UpdatedTagSchema.static;

/** TypeScript type for tag query parameters derived from TagQuerySchema */
export type TagQueryType = typeof TagQuerySchema.static;

/** TypeScript type for tag by ID query parameters derived from TagByIdQuerySchema */
export type TagByIdQueryType = typeof TagByIdQuerySchema.static;

/** TypeScript type for related tag relationship objects derived from RelatedTagRelationshipSchema */
export type RelatedTagRelationshipType =
	typeof RelatedTagRelationshipSchema.static;

/** TypeScript type for related tags query parameters derived from RelatedTagsQuerySchema */
export type RelatedTagsQueryType = typeof RelatedTagsQuerySchema.static;

/** TypeScript type for updated event query parameters derived from UpdatedEventQuerySchema */
export type UpdatedEventQueryType = typeof UpdatedEventQuerySchema.static;

/** TypeScript type for paginated event query parameters derived from PaginatedEventQuerySchema */
export type PaginatedEventQueryType = typeof PaginatedEventQuerySchema.static;

/** TypeScript type for event by ID query parameters derived from EventByIdQuerySchema */
export type EventByIdQueryType = typeof EventByIdQuerySchema.static;

/** TypeScript type for updated market query parameters derived from UpdatedMarketQuerySchema */
export type UpdatedMarketQueryType = typeof UpdatedMarketQuerySchema.static;

/** TypeScript type for market by ID query parameters derived from MarketByIdQuerySchema */
export type MarketByIdQueryType = typeof MarketByIdQuerySchema.static;

/** TypeScript type for series query parameters derived from SeriesQuerySchema */
export type SeriesQueryType = typeof SeriesQuerySchema.static;

/** TypeScript type for series by ID query parameters derived from SeriesByIdQuerySchema */
export type SeriesByIdQueryType = typeof SeriesByIdQuerySchema.static;

/** TypeScript type for comment objects derived from CommentSchema */
export type CommentType = typeof CommentSchema.static;

/** TypeScript type for comment query parameters derived from CommentQuerySchema */
export type CommentQueryType = typeof CommentQuerySchema.static;

/** TypeScript type for comment by ID query parameters derived from CommentByIdQuerySchema */
export type CommentByIdQueryType = typeof CommentByIdQuerySchema.static;

/** TypeScript type for comments by user address query parameters derived from CommentsByUserQuerySchema */
export type CommentsByUserQueryType = typeof CommentsByUserQuerySchema.static;

/** TypeScript type for search query parameters derived from SearchQuerySchema */
export type SearchQueryType = typeof SearchQuerySchema.static;

/** TypeScript type for search response derived from SearchResponseSchema */
export type SearchResponseType = typeof SearchResponseSchema.static;

/** TypeScript type for Gamma API error response derived from GammaErrorResponseSchema */
export type GammaErrorResponseType = typeof GammaErrorResponseSchema.static;

// Data API Schemas

/**
 * Schema for Data API health check response
 */
export const DataHealthResponseSchema = t.Object({
	data: t.String(),
});

/**
 * Schema for position objects from Data API
 */
export const PositionSchema = t.Object({
	proxyWallet: t.String(),
	asset: t.String(),
	conditionId: t.String(),
	size: t.Number(),
	avgPrice: t.Number(),
	initialValue: t.Number(),
	currentValue: t.Number(),
	cashPnl: t.Number(),
	percentPnl: t.Number(),
	totalBought: t.Number(),
	realizedPnl: t.Number(),
	percentRealizedPnl: t.Number(),
	curPrice: t.Number(),
	redeemable: t.Boolean(),
	mergeable: t.Boolean(),
	title: t.String(),
	slug: t.String(),
	icon: t.String(),
	eventId: t.String(),
	eventSlug: t.String(),
	outcome: t.String(),
	outcomeIndex: t.Number(),
	oppositeOutcome: t.String(),
	oppositeAsset: t.String(),
	endDate: t.Optional(t.String()),
	negativeRisk: t.Optional(t.Boolean()),
});

/**
 * Schema for closed position objects from Data API
 */
export const ClosedPositionSchema = t.Object({
	proxyWallet: t.String(),
	size: t.String(),
	avgPrice: t.String(),
	realizedPnl: t.Union([t.String(), t.Number()]),
	assetId: t.String(),
	conditionId: t.String(),
	outcome: t.String(),
	market: t.String(),
	timestamp: t.String(),
	side: t.Union([t.Literal("BUY"), t.Literal("SELL")]),
	cost: t.String(),
	value: t.String(),
	fees: t.String(),
	price: t.String(),
	closedAt: t.String(),
	closedPrice: t.String(),
	lastUpdate: t.String(),
});

/**
 * Schema for trade objects from Data API
 * Matches the official API documentation structure
 */
export const DataTradeSchema = t.Object({
	proxyWallet: t.String(),
	side: t.Union([t.Literal("BUY"), t.Literal("SELL")]),
	asset: t.String(),
	conditionId: t.String(),
	size: t.Number(),
	price: t.Number(),
	timestamp: t.Number(),
	title: t.String(),
	slug: t.String(),
	icon: t.String(),
	eventSlug: t.String(),
	outcome: t.String(),
	outcomeIndex: t.Number(),
	name: t.String(),
	pseudonym: t.String(),
	bio: t.String(),
	profileImage: t.String(),
	profileImageOptimized: t.String(),
	transactionHash: t.String(),
});

/**
 * Schema for user activity objects from Data API
 * Matches the official API documentation structure
 */
export const ActivitySchema = t.Object({
	proxyWallet: t.String(),
	timestamp: t.Number(),
	conditionId: t.String(),
	type: t.Union([t.Literal("TRADE"), t.Literal("SPLIT"), t.Literal("MERGE"), t.Literal("REDEEM"), t.Literal("REWARD"), t.Literal("CONVERSION"), t.Literal("YIELD")]),
	size: t.Number(),
	usdcSize: t.Optional(t.Number()), // May be missing in some activity types
	transactionHash: t.String(),
	price: t.Optional(t.Number()),
	asset: t.Optional(t.String()),
	side: t.Optional(t.Union([t.Literal("BUY"), t.Literal("SELL"), t.Literal("")])),
	outcomeIndex: t.Number(),
	title: t.String(),
	slug: t.String(),
	icon: t.String(),
	eventSlug: t.String(),
	outcome: t.String(),
	name: t.String(),
	pseudonym: t.String(),
	bio: t.String(),
	profileImage: t.String(),
	profileImageOptimized: t.String(),
});

/**
 * Schema for holder objects from Data API
 * Matches the actual API response structure
 */
export const HolderSchema = t.Object({
	proxyWallet: t.String(),
	bio: t.Optional(t.String()),
	asset: t.Optional(t.String()),
	pseudonym: t.Optional(t.String()),
	amount: t.Optional(t.Number()),
	displayUsernamePublic: t.Optional(t.Boolean()),
	outcomeIndex: t.Optional(t.Number()),
	name: t.Optional(t.String()),
	profileImage: t.Optional(t.String()),
	profileImageOptimized: t.Optional(t.String()),
	verified: t.Optional(t.Boolean()),
});

/**
 * Schema for meta holder objects from Data API
 */
export const MetaHolderSchema = t.Object({
	token: t.String(),
	holders: t.Array(HolderSchema),
});

/**
 * Schema for total value response from Data API
 */
export const TotalValueSchema = t.Object({
	user: t.String(),
	value: t.Number(),
});

/**
 * Schema for total markets traded response from Data API
 */
export const TotalMarketsTradedSchema = t.Object({
	user: t.String(),
	traded: t.Number(),
});

/**
 * Schema for open interest objects from Data API
 */
export const OpenInterestSchema = t.Object({
	market: t.String(),
	value: t.Union([t.String(), t.Number()]),
});

/**
 * Schema for live volume market objects from Data API
 */
export const LiveVolumeMarketSchema = t.Object({
	market: t.String(),
	value: t.Number(),
});

/**
 * Schema for live volume response from Data API
 */
export const LiveVolumeResponseSchema = t.Object({
	total: t.Number(),
	markets: t.Array(LiveVolumeMarketSchema),
});

// Data API Query Schemas

/**
 * Schema for positions query parameters
 */
export const PositionsQuerySchema = t.Object({
	user: t.String(), // Required
	market: t.Optional(t.Array(t.String())),
	eventId: t.Optional(t.Array(t.String())),
	sizeThreshold: t.Optional(t.Union([t.String(), t.Number()])),
	redeemable: t.Optional(t.Boolean()),
	mergeable: t.Optional(t.Boolean()),
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	sortBy: t.Optional(t.String()),
	sortDirection: t.Optional(t.Union([t.Literal("ASC"), t.Literal("DESC")])),
	title: t.Optional(t.String()),
});

/**
 * Schema for closed positions query parameters
 */
export const ClosedPositionsQuerySchema = t.Object({
	user: t.String(), // Required
	market: t.Optional(t.Array(t.String())),
	eventId: t.Optional(t.Array(t.String())),
	title: t.Optional(t.String()),
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	sortBy: t.Optional(t.String()),
	sortDirection: t.Optional(t.Union([t.Literal("ASC"), t.Literal("DESC")])),
});

/**
 * Schema for trades query parameters
 */
export const TradesQuerySchema = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	takerOnly: t.Optional(t.Boolean()),
	filterType: t.Optional(t.String()),
	filterAmount: t.Optional(t.Union([t.String(), t.Number()])),
	market: t.Optional(t.Array(t.String())),
	eventId: t.Optional(t.Array(t.String())),
	user: t.Optional(t.String()),
	side: t.Optional(t.Union([t.Literal("BUY"), t.Literal("SELL")])),
});

/**
 * Schema for user activity query parameters
 */
export const UserActivityQuerySchema = t.Object({
	user: t.String(), // Required
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
	market: t.Optional(t.Array(t.String())),
	eventId: t.Optional(t.Array(t.String())),
	type: t.Optional(t.Union([t.Literal("TRADE"), t.Literal("SPLIT"), t.Literal("MERGE"), t.Literal("REDEEM"), t.Literal("REWARD"), t.Literal("CONVERSION")])),
	start: t.Optional(t.String()),
	end: t.Optional(t.String()),
	sortBy: t.Optional(t.String()),
	sortDirection: t.Optional(t.Union([t.Literal("ASC"), t.Literal("DESC")])),
	side: t.Optional(t.Union([t.Literal("BUY"), t.Literal("SELL")])),
});

/**
 * Schema for user activity query parameters without user field
 * Used for routes where user is provided in the path parameter
 */
export const UserActivityQueryWithoutUserSchema = t.Omit(
	UserActivityQuerySchema,
	["user"],
);

/**
 * Schema for top holders query parameters
 */
export const TopHoldersQuerySchema = t.Object({
	limit: t.Optional(t.Number({ minimum: 0, maximum: 500, default: 100 })),
	market: t.Array(t.String()), // Required, comma-separated condition IDs
	minBalance: t.Optional(t.Number({ minimum: 0, maximum: 999999, default: 1 })),
});

/**
 * Schema for total value query parameters
 */
export const TotalValueQuerySchema = t.Object({
	user: t.String(), // Required
	market: t.Optional(t.Array(t.String())),
});

/**
 * Schema for total markets traded query parameters
 */
export const TotalMarketsTradedQuerySchema = t.Object({
	user: t.String(), // Required
});

/**
 * Schema for open interest query parameters
 */
export const OpenInterestQuerySchema = t.Object({
	market: t.Array(t.String()), // Required, array of Hash64 strings
});

/**
 * Schema for live volume query parameters
 */
export const LiveVolumeQuerySchema = t.Object({
	id: t.Number({ minimum: 1 }), // Required, event ID
});

/**
 * Schema for builder leaderboard query parameters
 */
export const BuilderLeaderboardQuerySchema = t.Object({
	timePeriod: t.Optional(t.Union([t.Literal("DAY"), t.Literal("WEEK"), t.Literal("MONTH"), t.Literal("ALL")])),
	limit: t.Optional(t.Number({ minimum: 0, maximum: 50 })),
	offset: t.Optional(t.Number({ minimum: 0, maximum: 1000 })),
});

/**
 * Schema for builder leaderboard entry
 */
export const BuilderLeaderboardEntrySchema = t.Object({
	rank: t.Optional(t.String()),
	builder: t.Optional(t.String()),
	volume: t.Optional(t.Number()),
	activeUsers: t.Optional(t.Number()),
	verified: t.Optional(t.Boolean()),
	builderLogo: t.Optional(t.String()),
});

/**
 * Schema for builder daily volume time-series query parameters
 */
export const BuilderVolumeQuerySchema = t.Object({
	timePeriod: t.Optional(t.Union([t.Literal("DAY"), t.Literal("WEEK"), t.Literal("MONTH"), t.Literal("ALL")])),
});

/**
 * Schema for builder daily volume entry
 */
export const BuilderVolumeEntrySchema = t.Object({
	dt: t.Optional(t.String()),
	builder: t.Optional(t.String()),
	builderLogo: t.Optional(t.String()),
	verified: t.Optional(t.Boolean()),
	volume: t.Optional(t.Number()),
	activeUsers: t.Optional(t.Number()),
	rank: t.Optional(t.String()),
});


// Data API Type Exports

/** TypeScript type for Data API health response derived from DataHealthResponseSchema */
export type DataHealthResponseType = typeof DataHealthResponseSchema.static;

/** TypeScript type for position objects derived from PositionSchema */
export type PositionType = typeof PositionSchema.static;

/** TypeScript type for closed position objects derived from ClosedPositionSchema */
export type ClosedPositionType = typeof ClosedPositionSchema.static;

/** TypeScript type for Data API trade objects derived from DataTradeSchema */
export type DataTradeType = typeof DataTradeSchema.static;

/** TypeScript type for activity objects derived from ActivitySchema */
export type ActivityType = typeof ActivitySchema.static;

/** TypeScript type for holder objects derived from HolderSchema */
export type HolderType = typeof HolderSchema.static;

/** TypeScript type for meta holder objects derived from MetaHolderSchema */
export type MetaHolderType = typeof MetaHolderSchema.static;

/** TypeScript type for total value response derived from TotalValueSchema */
export type TotalValueType = typeof TotalValueSchema.static;

/** TypeScript type for total markets traded response derived from TotalMarketsTradedSchema */
export type TotalMarketsTradedType = typeof TotalMarketsTradedSchema.static;

/** TypeScript type for open interest objects derived from OpenInterestSchema */
export type OpenInterestType = typeof OpenInterestSchema.static;

/** TypeScript type for live volume market objects derived from LiveVolumeMarketSchema */
export type LiveVolumeMarketType = typeof LiveVolumeMarketSchema.static;

/** TypeScript type for live volume response derived from LiveVolumeResponseSchema */
export type LiveVolumeResponseType = typeof LiveVolumeResponseSchema.static;

/** TypeScript type for positions query parameters derived from PositionsQuerySchema */
export type PositionsQueryType = typeof PositionsQuerySchema.static;

/** TypeScript type for closed positions query parameters derived from ClosedPositionsQuerySchema */
export type ClosedPositionsQueryType = typeof ClosedPositionsQuerySchema.static;

/** TypeScript type for trades query parameters derived from TradesQuerySchema */
export type TradesQueryType = typeof TradesQuerySchema.static;

/** TypeScript type for user activity query parameters derived from UserActivityQuerySchema */
export type UserActivityQueryType = typeof UserActivityQuerySchema.static;

/** TypeScript type for top holders query parameters derived from TopHoldersQuerySchema */
export type TopHoldersQueryType = typeof TopHoldersQuerySchema.static;

/** TypeScript type for total value query parameters derived from TotalValueQuerySchema */
export type TotalValueQueryType = typeof TotalValueQuerySchema.static;

/** TypeScript type for total markets traded query parameters derived from TotalMarketsTradedQuerySchema */
export type TotalMarketsTradedQueryType =
	typeof TotalMarketsTradedQuerySchema.static;

/** TypeScript type for open interest query parameters derived from OpenInterestQuerySchema */
export type OpenInterestQueryType = typeof OpenInterestQuerySchema.static;

/** TypeScript type for live volume query parameters derived from LiveVolumeQuerySchema */
export type LiveVolumeQueryType = typeof LiveVolumeQuerySchema.static;

/** TypeScript type for HTTP proxy configuration derived from ProxyConfigSchema */
export type ProxyConfigType = typeof ProxyConfigSchema.static;

/** TypeScript type for Polymarket profile response derived from PolymarketProfileSchema */
export type PolymarketProfileType = typeof PolymarketProfileSchema.static;

/** TypeScript type for Polymarket profile query parameters derived from PolymarketProfileQuerySchema */
export type PolymarketProfileQueryType = typeof PolymarketProfileQuerySchema.static;

/** TypeScript type for builder leaderboard query parameters derived from BuilderLeaderboardQuerySchema */
export type BuilderLeaderboardQueryType = typeof BuilderLeaderboardQuerySchema.static;

/** TypeScript type for builder leaderboard entry derived from BuilderLeaderboardEntrySchema */
export type BuilderLeaderboardEntryType = typeof BuilderLeaderboardEntrySchema.static;

/** TypeScript type for builder daily volume time-series query parameters derived from BuilderVolumeQuerySchema */
export type BuilderVolumeQueryType = typeof BuilderVolumeQuerySchema.static;

/** TypeScript type for builder volume entry derived from BuilderVolumeEntrySchema */
export type BuilderVolumeEntryType = typeof BuilderVolumeEntrySchema.static;

// ============================================================
// Data API — Trader Leaderboard
// ============================================================

/**
 * Schema for trader leaderboard query parameters
 */
export const TraderLeaderboardQuerySchema = t.Object({
	category: t.Optional(t.UnionEnum([
		"OVERALL", "POLITICS", "SPORTS", "CRYPTO", "CULTURE",
		"MENTIONS", "WEATHER", "ECONOMICS", "TECH", "FINANCE",
	], { description: "Market category for the leaderboard", default: "OVERALL" })),
	timePeriod: t.Optional(t.UnionEnum(["DAY", "WEEK", "MONTH", "ALL"], {
		description: "Time period for leaderboard results",
		default: "DAY",
	})),
	orderBy: t.Optional(t.UnionEnum(["PNL", "VOL"], {
		description: "Leaderboard ordering criteria",
		default: "PNL",
	})),
	limit: t.Optional(t.Number({ description: "Max number of traders to return (1-50)", minimum: 1, maximum: 50, default: 25 })),
	offset: t.Optional(t.Number({ description: "Starting index for pagination (0-1000)", minimum: 0, maximum: 1000, default: 0 })),
	user: t.Optional(t.String({ description: "Limit leaderboard to a single user by address" })),
	userName: t.Optional(t.String({ description: "Limit leaderboard to a single username" })),
});

/**
 * Schema for a single trader leaderboard entry
 */
export const TraderLeaderboardEntrySchema = t.Object({
	rank: t.Optional(t.String({ description: "The rank position of the trader" })),
	proxyWallet: t.Optional(t.String({ description: "Trader's proxy wallet address" })),
	userName: t.Optional(t.String({ description: "The trader's username" })),
	vol: t.Optional(t.Number({ description: "Trading volume for this trader" })),
	pnl: t.Optional(t.Number({ description: "Profit and loss for this trader" })),
	profileImage: t.Optional(t.String({ description: "URL to the trader's profile image" })),
	xUsername: t.Optional(t.String({ description: "The trader's X (Twitter) username" })),
	verifiedBadge: t.Optional(t.Boolean({ description: "Whether the trader has a verified badge" })),
});

/** TypeScript type for trader leaderboard query parameters */
export type TraderLeaderboardQueryType = typeof TraderLeaderboardQuerySchema.static;

/** TypeScript type for trader leaderboard entry */
export type TraderLeaderboardEntryType = typeof TraderLeaderboardEntrySchema.static;

// ============================================================
// CLOB Public API — Market Data (no auth required)
// ============================================================

/**
 * Schema for market-by-token response
 */
export const MarketByTokenResponseSchema = t.Object({
	condition_id: t.String({ description: "The condition ID of the market containing the given token" }),
	primary_token_id: t.String({ description: "The primary (Yes) token ID" }),
	secondary_token_id: t.String({ description: "The secondary (No) token ID" }),
});

/**
 * Schema for CLOB tick size response
 */
export const ClobTickSizeResponseSchema = t.Object({
	minimum_tick_size: t.Union([t.String(), t.Number()], { description: "The minimum tick size for the token" }),
});

/**
 * Schema for CLOB neg risk response
 */
export const ClobNegRiskResponseSchema = t.Object({
	neg_risk: t.Boolean({ description: "Whether this token has negative risk" }),
});

/**
 * Schema for CLOB fee rate response
 */
export const ClobFeeRateResponseSchema = t.Object({
	base_fee: t.Number({ description: "Base fee rate in basis points" }),
});

/**
 * Schema for CLOB last trade price response
 */
export const ClobLastTradePriceResponseSchema = t.Object({
	price: t.Optional(t.String({ description: "Last trade price" })),
});

/**
 * Schema for CLOB last trade price with token info (used in batch response)
 */
export const ClobLastTradePriceWithTokenSchema = t.Object({
	token_id: t.Optional(t.String()),
	price: t.Optional(t.String({ description: "Last trade price" })),
});

/**
 * Schema for querying CLOB token-based endpoints
 */
export const ClobTokenQuerySchema = t.Object({
	token_id: t.String({ description: "CLOB token ID" }),
});

/**
 * Schema for CLOB prices-history batch query (multiple markets)
 */
export const ClobPricesHistoryBatchQuerySchema = t.Object({
	markets: t.Array(t.String(), { description: "List of token IDs to get prices for" }),
	interval: t.Optional(t.UnionEnum(["1m", "1h", "6h", "1d", "1w", "max"], { description: "Interval for aggregation" })),
	startTs: t.Optional(t.Number({ description: "Start timestamp in Unix seconds" })),
	endTs: t.Optional(t.Number({ description: "End timestamp in Unix seconds" })),
	fidelity: t.Optional(t.Number({ description: "Data resolution in minutes" })),
});

/** TypeScript type for market-by-token response */
export type MarketByTokenResponseType = typeof MarketByTokenResponseSchema.static;

/** TypeScript type for CLOB tick size response */
export type ClobTickSizeResponseType = typeof ClobTickSizeResponseSchema.static;

/** TypeScript type for CLOB neg risk response */
export type ClobNegRiskResponseType = typeof ClobNegRiskResponseSchema.static;

/** TypeScript type for CLOB fee rate response */
export type ClobFeeRateResponseType = typeof ClobFeeRateResponseSchema.static;

/** TypeScript type for CLOB last trade price response */
export type ClobLastTradePriceResponseType = typeof ClobLastTradePriceResponseSchema.static;

/** TypeScript type for CLOB token query */
export type ClobTokenQueryType = typeof ClobTokenQuerySchema.static;

/** TypeScript type for CLOB batch price history query */
export type ClobPricesHistoryBatchQueryType = typeof ClobPricesHistoryBatchQuerySchema.static;

/**
 * Schema for CLOB midpoint response
 */
export const ClobMidpointResponseSchema = t.Object({
	mid_price: t.String({ description: "Midpoint price as a string" }),
});
export type ClobMidpointResponseType = typeof ClobMidpointResponseSchema.static;

/**
 * Schema for CLOB spread response
 */
export const ClobSpreadResponseSchema = t.Object({
	spread: t.String({ description: "Spread as a string" }),
});
export type ClobSpreadResponseType = typeof ClobSpreadResponseSchema.static;

/**
 * Order side enum
 */
export const ClobOrderSideSchema = t.Union([t.Literal("BUY"), t.Literal("SELL")]);
export type ClobOrderSideType = typeof ClobOrderSideSchema.static;

/**
 * Schema for CLOB market price query (single)
 */
export const ClobPriceQuerySchema = t.Object({
	token_id: t.String({ description: "CLOB token ID" }),
	side: ClobOrderSideSchema,
});
export type ClobPriceQueryType = typeof ClobPriceQuerySchema.static;

/**
 * Schema for CLOB market price response
 */
export const ClobPriceResponseSchema = t.Object({
	price: t.Number({ description: "Market price as a decimal" }),
});
export type ClobPriceResponseType = typeof ClobPriceResponseSchema.static;

/**
 * Schema for CLOB last trade price with token and side (batch response)
 */
export const ClobLastTradePriceWithSideSchema = t.Object({
	token_id: t.String(),
	price: t.String({ description: "Last trade price" }),
	side: t.Union([t.Literal("BUY"), t.Literal("SELL"), t.Literal("")]),
});
export type ClobLastTradePriceWithSideType =
	typeof ClobLastTradePriceWithSideSchema.static;

/**
 * Schema for a single order summary level (bid or ask)
 */
export const ClobOrderSummarySchema = t.Object({
	price: t.String(),
	size: t.String(),
});
export type ClobOrderSummaryType = typeof ClobOrderSummarySchema.static;

/**
 * Schema for the CLOB order book summary response
 */
export const ClobOrderBookSummarySchema = t.Object({
	market: t.String({ description: "Market condition ID" }),
	asset_id: t.String({ description: "Token ID (asset ID)" }),
	timestamp: t.String({ description: "Timestamp of the order book snapshot" }),
	hash: t.String({ description: "Hash of the order book summary" }),
	bids: t.Array(ClobOrderSummarySchema, {
		description: "Bid orders sorted by price descending",
	}),
	asks: t.Array(ClobOrderSummarySchema, {
		description: "Ask orders sorted by price ascending",
	}),
	min_order_size: t.String(),
	tick_size: t.String(),
	neg_risk: t.Boolean(),
	last_trade_price: t.String(),
});
export type ClobOrderBookSummaryType = typeof ClobOrderBookSummarySchema.static;

/**
 * Schema for the batch prices history request body
 */
export const ClobBatchPricesHistoryRequestSchema = t.Object({
	markets: t.Array(t.String(), {
		description: "Market asset IDs to query. Max 20.",
		maxItems: 20,
	}),
	start_ts: t.Optional(t.Number({ description: "Unix seconds — lower bound" })),
	end_ts: t.Optional(t.Number({ description: "Unix seconds — upper bound" })),
	interval: t.Optional(
		t.Union([
			t.Literal("max"),
			t.Literal("all"),
			t.Literal("1m"),
			t.Literal("1h"),
			t.Literal("6h"),
			t.Literal("1d"),
			t.Literal("1w"),
		]),
	),
	fidelity: t.Optional(
		t.Number({ description: "Data resolution in minutes. Default 1." }),
	),
});
export type ClobBatchPricesHistoryRequestType =
	typeof ClobBatchPricesHistoryRequestSchema.static;

/**
 * Schema for the batch prices history response
 */
export const ClobBatchPricesHistoryResponseSchema = t.Object({
	history: t.Record(t.String(), t.Array(PriceHistoryPointSchema), {
		description: "Map of asset id → price history points",
	}),
});
export type ClobBatchPricesHistoryResponseType =
	typeof ClobBatchPricesHistoryResponseSchema.static;

// ============================================================
// CLOB Rewards API (public, no auth required)
// ============================================================

/**
 * Schema for a single reward config entry inside a market reward
 */
export const CurrentRewardConfigSchema = t.Object({
	id: t.Optional(t.Number({ description: "Rewards config ID" })),
	asset_address: t.String({ description: "Address of the reward asset" }),
	start_date: t.String({ description: "Start date of the rewards period (YYYY-MM-DD)" }),
	end_date: t.Optional(t.String({ description: "End date of the rewards period (YYYY-MM-DD)" })),
	rate_per_day: t.Number({ description: "Daily reward rate" }),
	total_rewards: t.Optional(t.Number({ description: "Total rewards amount" })),
});

/**
 * Schema for a current active reward for a market
 */
export const CurrentRewardSchema = t.Object({
	condition_id: t.String({ description: "Condition ID of the market" }),
	rewards_max_spread: t.Optional(t.Number({ description: "Maximum spread for rewards eligibility" })),
	rewards_min_size: t.Optional(t.Number({ description: "Minimum order size for rewards eligibility" })),
	rewards_config: t.Optional(t.Array(CurrentRewardConfigSchema)),
	sponsored_daily_rate: t.Optional(t.Number({ description: "Sponsored daily rate" })),
	sponsors_count: t.Optional(t.Number({ description: "Number of sponsors" })),
	native_daily_rate: t.Optional(t.Number({ description: "Native daily rate excluding sponsors" })),
	total_daily_rate: t.Optional(t.Number({ description: "Total daily rate including sponsors" })),
});

/**
 * Schema for paginated rewards response
 */
export const PaginatedRewardsResponseSchema = t.Object({
	limit: t.Number({ description: "Maximum number of items per page" }),
	count: t.Number({ description: "Number of items in the current response" }),
	next_cursor: t.String({ description: "Cursor for the next page. LTE= indicates the last page." }),
	data: t.Array(CurrentRewardSchema),
});

/**
 * Schema for current rewards query parameters
 */
export const CurrentRewardsQuerySchema = t.Object({
	sponsored: t.Optional(t.Boolean({ description: "If true, returns sponsored reward configurations", default: false })),
	next_cursor: t.Optional(t.String({ description: "Pagination cursor from previous response" })),
});

/** TypeScript type for reward config entry */
export type CurrentRewardConfigType = typeof CurrentRewardConfigSchema.static;

/** TypeScript type for current market reward */
export type CurrentRewardType = typeof CurrentRewardSchema.static;

/** TypeScript type for paginated rewards response */
export type PaginatedRewardsResponseType = typeof PaginatedRewardsResponseSchema.static;

/** TypeScript type for current rewards query */
export type CurrentRewardsQueryType = typeof CurrentRewardsQuerySchema.static;

// ============================================================
// Gamma API — Keyset Pagination
// ============================================================

/**
 * Schema for events keyset (cursor-based) pagination query
 */
export const EventsKeysetQuerySchema = t.Object({
	after_cursor: t.Optional(t.String({ description: "Cursor from a previous response for keyset pagination" })),
	limit: t.Optional(t.Number({ description: "Number of items to return" })),
	active: t.Optional(t.Boolean({ description: "Filter by active status" })),
	closed: t.Optional(t.Boolean({ description: "Filter by closed status" })),
	archived: t.Optional(t.Boolean({ description: "Filter by archived status" })),
	featured: t.Optional(t.Boolean({ description: "Filter by featured status" })),
	tag_id: t.Optional(t.Number({ description: "Filter by tag ID" })),
	tag_slug: t.Optional(t.String({ description: "Filter by tag slug" })),
});

/**
 * Schema for markets keyset (cursor-based) pagination query
 */
export const MarketsKeysetQuerySchema = t.Object({
	after_cursor: t.Optional(t.String({ description: "Cursor from a previous response for keyset pagination" })),
	limit: t.Optional(t.Number({ description: "Number of items to return" })),
	active: t.Optional(t.Boolean({ description: "Filter by active status" })),
	closed: t.Optional(t.Boolean({ description: "Filter by closed status" })),
	archived: t.Optional(t.Boolean({ description: "Filter by archived status" })),
	featured: t.Optional(t.Boolean({ description: "Filter by featured status" })),
	tag_id: t.Optional(t.Number({ description: "Filter by tag ID" })),
	tag_slug: t.Optional(t.String({ description: "Filter by tag slug" })),
});

/**
 * Generic keyset pagination response with next_cursor
 */
export const KeysetPaginatedEventsResponseSchema = t.Object({
	data: t.Array(t.Any()),
	next_cursor: t.Optional(t.String({ description: "Cursor to use for the next page of results" })),
});

export const KeysetPaginatedMarketsResponseSchema = t.Object({
	data: t.Array(t.Any()),
	next_cursor: t.Optional(t.String({ description: "Cursor to use for the next page of results" })),
});

/** TypeScript type for events keyset query */
export type EventsKeysetQueryType = typeof EventsKeysetQuerySchema.static;

/** TypeScript type for markets keyset query */
export type MarketsKeysetQueryType = typeof MarketsKeysetQuerySchema.static;
