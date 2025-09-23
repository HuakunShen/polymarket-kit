/**
 * Elysia Type Schemas for Polymarket Proxy Server
 *
 * This file contains all the type schemas used by the Elysia server for request/response validation.
 * Uses Zod for schema validation and type inference.
 */

import { z } from "zod";

// Base types used across different schemas
const StringArray = z.array(z.string());
const OptionalString = z.string().optional();
const OptionalNumber = z.number().optional();
const OptionalBoolean = z.boolean().optional();

/**
 * HTTP Proxy Configuration Schema
 *
 * Configuration for HTTP/HTTPS proxy settings
 */
export const ProxyConfigSchema = z.object({
	host: z.string().describe("Proxy server hostname or IP address"),
	port: z.number().describe("Proxy server port number"),
	username: z.string().describe("Proxy authentication username").optional(),
	password: z.string().describe("Proxy authentication password").optional(),
	protocol: z
		.enum(["http", "https"])
		.describe("Proxy protocol (defaults to http)")
		.optional(),
});

/**
 * Schema for market objects returned by the Gamma API
 *
 * Defines the structure for Polymarket prediction market data including
 * pricing, volume, liquidity, and associated metadata.
 */
export const MarketSchema = z.object({
	id: z.string(),
	question: z.string(),
	conditionId: z.string(),
	slug: z.string(),
	liquidity: OptionalString,
	startDate: OptionalString,
	image: z.string(),
	icon: z.string(),
	description: z.string(),
	active: z.boolean(),
	volume: z.string(),
	outcomes: StringArray,
	outcomePrices: StringArray,
	closed: z.boolean(),
	new: OptionalBoolean,
	questionID: OptionalString,
	volumeNum: z.number(),
	liquidityNum: OptionalNumber,
	startDateIso: OptionalString,
	hasReviewedDates: OptionalBoolean,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	clobTokenIds: StringArray,
	events: z
		.array(
			z.object({
				id: z.string(),
				ticker: z.string(),
				slug: z.string(),
				title: z.string(),
				description: z.string(),
				active: z.boolean(),
				closed: z.boolean(),
				archived: z.boolean(),
			}),
		)
		.optional(),
});

/**
 * Schema for market objects that belong to events
 *
 * Represents markets that are part of an event, containing similar
 * market data but in the context of event groupings.
 */
export const EventMarketSchema = z.object({
	id: z.string(),
	question: z.string(),
	conditionId: z.string(),
	slug: z.string(),
	resolutionSource: OptionalString,
	endDate: OptionalString,
	liquidity: OptionalString,
	startDate: OptionalString,
	image: z.string(),
	icon: z.string(),
	description: z.string(),
	outcomes: StringArray,
	outcomePrices: StringArray,
	volume: OptionalString,
	active: z.boolean(),
	closed: z.boolean(),
	marketMakerAddress: OptionalString,
	createdAt: z.string(),
	updatedAt: z.string(),
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
export const SeriesSchema = z.object({
	id: z.string(),
	ticker: z.string(),
	slug: z.string(),
	title: z.string(),
	subtitle: OptionalString,
	seriesType: z.string(),
	recurrence: z.string(),
	image: OptionalString,
	icon: OptionalString,
	active: z.boolean(),
	closed: z.boolean(),
	archived: z.boolean(),
	volume: OptionalNumber,
	liquidity: OptionalNumber,
	startDate: OptionalString,
	createdAt: z.string(),
	updatedAt: z.string(),
	competitive: OptionalString,
	volume24hr: OptionalNumber,
	pythTokenID: OptionalString,
	cgAssetName: OptionalString,
	commentCount: z.number().optional(),
});

// Tag Schema
/**
 * Schema for tag objects used to categorize markets and events
 *
 * Tags provide categorization and filtering capabilities for
 * markets and events in the Polymarket ecosystem.
 */
export const TagSchema = z.object({
	id: z.string(),
	label: z.string(),
	slug: z.string(),
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
export const EventSchema = z.object({
	id: z.string(),
	ticker: z.string(),
	slug: z.string(),
	title: z.string(),
	description: OptionalString,
	resolutionSource: OptionalString,
	startDate: OptionalString,
	creationDate: z.string(),
	endDate: z.string(),
	image: z.string(),
	icon: z.string(),
	active: z.boolean(),
	closed: z.boolean(),
	archived: z.boolean(),
	new: OptionalBoolean,
	featured: OptionalBoolean,
	restricted: OptionalBoolean,
	liquidity: OptionalNumber,
	volume: z.number(),
	openInterest: OptionalNumber,
	createdAt: z.string(),
	updatedAt: z.string(),
	competitive: OptionalNumber,
	volume24hr: OptionalNumber,
	volume1wk: OptionalNumber,
	volume1mo: OptionalNumber,
	volume1yr: OptionalNumber,
	enableOrderBook: OptionalBoolean,
	liquidityClob: OptionalNumber,
	negRisk: OptionalBoolean,
	commentCount: z.number().optional(),
	markets: z.array(EventMarketSchema),
	series: z.array(SeriesSchema).optional(),
	tags: z.array(TagSchema).optional(),
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
export const PriceHistoryPointSchema = z.object({
	t: z.number(), // timestamp
	p: z.number(), // price
});

/**
 * Schema for price history API responses
 *
 * Contains an array of price history points and optional time range
 * metadata for the requested historical data.
 */
export const PriceHistoryResponseSchema = z.object({
	history: z.array(PriceHistoryPointSchema),
	timeRange: z.union([
		z.object({
			start: z.string(),
			end: z.string(),
		}),
		z.null(),
	]),
});

/**
 * Schema for market query parameters
 *
 * Defines all possible query parameters for filtering, sorting,
 * and paginating market data from the Gamma API.
 */
export const MarketQuerySchema = z.object({
	// Pagination
	limit: z.string().optional(),
	offset: z.string().optional(),

	// Sorting
	order: OptionalString,
	ascending: z.string().optional(), // String because query params come as strings

	// Filters
	id: z.string().optional(),
	slug: OptionalString,
	archived: z.string().optional(),
	active: z.string().optional(),
	closed: z.string().optional(),
	clob_token_ids: OptionalString,
	condition_ids: OptionalString,

	// Numeric filters
	liquidity_num_min: z.string().optional(),
	liquidity_num_max: z.string().optional(),
	volume_num_min: z.string().optional(),
	volume_num_max: z.string().optional(),

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,

	// Tag filters
	tag_id: z.string().optional(),
	related_tags: z.string().optional(),
});

/**
 * Schema for event query parameters
 *
 * Defines all possible query parameters for filtering, sorting,
 * and paginating event data from the Gamma API.
 */
export const EventQuerySchema = z.object({
	// Pagination
	limit: z.string().optional(),
	offset: z.string().optional(),

	// Sorting
	order: OptionalString,
	ascending: z.string().optional(), // String because query params come as strings

	// Filters
	id: z.string().optional(),
	slug: OptionalString,
	archived: z.string().optional(),
	active: z.string().optional(),
	closed: z.string().optional(),

	// Numeric filters
	liquidity_min: z.string().optional(),
	liquidity_max: z.string().optional(),
	volume_min: z.string().optional(),
	volume_max: z.string().optional(),

	// Date filters
	start_date_min: OptionalString,
	start_date_max: OptionalString,
	end_date_min: OptionalString,
	end_date_max: OptionalString,

	// Tag filters
	tag: OptionalString,
	tag_id: z.string().optional(),
	related_tags: z.string().optional(),
	tag_slug: OptionalString,
});

/**
 * Enum for price history time intervals
 *
 * Defines the available time intervals for fetching historical
 * price data from the CLOB API.
 */
export const PriceHistoryIntervalEnum = z.enum([
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
export const PriceHistoryQuerySchema = z.object({
	// Required market parameter
	market: z.string(), // The CLOB token ID for which to fetch price history

	// Time range options (mutually exclusive with interval)
	startTs: z.number().optional(), // Unix timestamp in seconds
	endTs: z.number().optional(), // Unix timestamp in seconds

	// Human-readable date alternatives (converted to startTs/endTs)
	startDate: z.string().optional(), // Date string like "2025-08-13" or "2025-08-13T00:00:00.000Z"
	endDate: z.string().optional(), // Date string like "2025-08-13" or "2025-08-13T00:00:00.000Z"

	// Interval option (mutually exclusive with startTs/endTs/startDate/endDate)
	interval: PriceHistoryIntervalEnum.optional(),

	// Data resolution
	fidelity: z.number().optional(), // Resolution in minutes
});

/**
 * Schema for CLOB client configuration
 *
 * Defines the required and optional parameters for initializing
 * a Polymarket CLOB client with authentication credentials.
 */
export const ClobClientConfigSchema = z.object({
	privateKey: z.string(),
	funderAddress: z.string(),
	host: z.string().optional(),
	chainId: z.number().optional(),
	signatureType: z.number().optional(),
});

/**
 * Schema for error responses
 *
 * Standard error response format used across all API endpoints
 * when requests fail or encounter errors.
 */
export const ErrorResponseSchema = z.object({
	error: z.string(),
	message: z.string(),
	details: z.string().optional(),
});

/**
 * Schema for Gamma API specific error responses
 *
 * Error response format specific to Gamma API endpoints
 * when requests fail (especially 404 errors).
 */
export const GammaErrorResponseSchema = z.object({
	type: z.string(),
	error: z.string(),
});

/**
 * Schema for health check responses
 *
 * Response format for API health check endpoints that indicate
 * service status and operational metrics.
 */
export const HealthResponseSchema = z.object({
	status: z.enum(["healthy", "unhealthy"]),
	timestamp: z.string(),
	clob: z.string(),
	cached: z.boolean().optional(),
	error: z.string().optional(),
});

/**
 * Schema for order summary in order book
 *
 * Represents a single price level in the order book with price and size.
 */
export const OrderSummarySchema = z.object({
	price: z.string(),
	size: z.string(),
});

/**
 * Schema for order book summary response
 *
 * Complete order book data including bids, asks, and market metadata.
 */
export const OrderBookSummarySchema = z.object({
	market: z.string(),
	asset_id: z.string(),
	timestamp: z.string(),
	bids: z.array(OrderSummarySchema),
	asks: z.array(OrderSummarySchema),
	min_order_size: z.string(),
	tick_size: z.string(),
	neg_risk: z.boolean(),
	hash: z.string(),
});

/**
 * Schema for book parameters used in batch operations (requires side)
 */
export const BookParamsSchema = z.object({
	token_id: z.string(),
	side: z.enum(["BUY", "SELL"]),
});

/**
 * Schema for price query parameters
 */
export const PriceQuerySchema = z.object({
	tokenId: z.string(),
	side: z.enum(["buy", "sell"]),
});

/**
 * Schema for midpoint query parameters
 */
export const MidpointQuerySchema = z.object({
	tokenId: z.string(),
});

/**
 * Schema for simple token parameters (just token_id)
 */
export const TokenParamsSchema = z.object({
	token_id: z.string(),
});

/**
 * Schema for trade query parameters
 */
export const TradeParamsSchema = z.object({
	id: z.string().optional(),
	maker_address: z.string().optional(),
	market: z.string().optional(),
	asset_id: z.string().optional(),
	before: z.string().optional(),
	after: z.string().optional(),
});

/**
 * Schema for trade objects
 */
export const TradeSchema = z.object({
	id: z.string(),
	taker_order_id: z.string(),
	market: z.string(),
	asset_id: z.string(),
	side: z.enum(["BUY", "SELL"]),
	size: z.string(),
	fee_rate_bps: z.string(),
	price: z.string(),
	status: z.string(),
	match_time: z.string(),
	last_update: z.string(),
	outcome: z.string(),
	bucket_index: z.number(),
	owner: z.string(),
	maker_address: z.string(),
});

/**
 * Schema for pagination payload
 */
export const PaginationPayloadSchema = z.object({
	limit: z.number(),
	count: z.number(),
	next_cursor: z.string(),
	data: z.array(z.any()),
});

/**
 * Schema for market query parameters (with pagination)
 */
export const MarketPaginationQuerySchema = z.object({
	next_cursor: z.string().optional(),
});

// Health Check Schema
/**
 * Schema for health check response
 */
export const GammaHealthResponseSchema = z.object({
	data: z.string(),
});

// Team Schema for Sports API
/**
 * Schema for team objects returned by the Sports API
 */
export const TeamSchema = z.object({
	id: z.number(),
	name: z.string(),
	league: z.string(),
	record: OptionalString,
	logo: z.string(),
	abbreviation: z.string(),
	alias: z.string().nullable().optional(),
	createdAt: z.string(),
	updatedAt: OptionalString,
});

// Team Query Schema
/**
 * Schema for team query parameters
 */
export const TeamQuerySchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	order: OptionalString,
	ascending: OptionalBoolean,
	league: z.array(z.string()).optional(),
	name: z.array(z.string()).optional(),
	abbreviation: z.array(z.string()).optional(),
});

// Updated Tag Schema with new fields
/**
 * Updated schema for tag objects with new API fields
 */
export const UpdatedTagSchema = z.object({
	id: z.string(),
	label: z.string(),
	slug: z.string(),
	forceShow: OptionalBoolean,
	publishedAt: OptionalString,
	createdBy: OptionalNumber,
	updatedBy: OptionalNumber,
	createdAt: z.string(),
	updatedAt: OptionalString,
	forceHide: OptionalBoolean,
	isCarousel: OptionalBoolean,
});

// Tag Query Schema
/**
 * Schema for tag query parameters
 */
export const TagQuerySchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	order: OptionalString,
	ascending: OptionalBoolean,
	include_template: OptionalBoolean,
	is_carousel: OptionalBoolean,
});

// Tag by ID Query Schema
/**
 * Schema for tag by ID query parameters
 */
export const TagByIdQuerySchema = z.object({
	include_template: OptionalBoolean,
});

// Related Tags Relationship Schema
/**
 * Schema for related tags relationship objects
 */
export const RelatedTagRelationshipSchema = z.object({
	id: z.string(),
	tagID: z.number(),
	relatedTagID: z.number(),
	rank: z.number(),
});

// Related Tags Query Schema
/**
 * Schema for related tags query parameters
 */
export const RelatedTagsQuerySchema = z.object({
	omit_empty: OptionalBoolean,
	status: z.enum(["active", "closed", "all"]).optional(),
});

// Updated Event Query Schema with new fields
/**
 * Updated schema for event query parameters with new API fields
 */
export const UpdatedEventQuerySchema = z.object({
	// Pagination
	limit: z.number().optional(),
	offset: z.number().optional(),

	// Sorting
	order: OptionalString,
	ascending: OptionalBoolean,

	// Filters
	id: z.array(z.number()).optional(),
	slug: z.array(z.string()).optional(),
	tag_id: OptionalNumber,
	exclude_tag_id: z.array(z.number()).optional(),
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
export const PaginatedEventQuerySchema = z.object({
	limit: z.number(),
	offset: z.number(),
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
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.object({
		data: z.array(schema),
		pagination: z.object({
			hasMore: z.boolean(),
			totalResults: z.number(),
		}),
	});

// Event by ID Query Schema
/**
 * Schema for event by ID query parameters
 */
export const EventByIdQuerySchema = z.object({
	include_chat: OptionalBoolean,
	include_template: OptionalBoolean,
});

/**
 * Schema for markdown formatting options
 */
export const MarkdownOptionsSchema = z.object({
	verbose: z
		.union([z.literal(0), z.literal(1), z.literal(2)])
		.describe("Verbosity level: 0=basic, 1=medium, 2=full details")
		.default(2)
		.optional(),
	include_markets: z
		.boolean()
		.describe("Whether to include market details in event markdown")
		.default(true)
		.optional(),
});

// Updated Market Query Schema with new fields
/**
 * Updated schema for market query parameters with new API fields
 */
export const UpdatedMarketQuerySchema = z.object({
	// Pagination
	limit: z.number().optional(),
	offset: z.number().optional(),

	// Sorting
	order: OptionalString,
	ascending: OptionalBoolean,

	// Filters
	id: z.array(z.number()).optional(),
	slug: z.array(z.string()).optional(),
	tag_id: OptionalNumber,
	closed: OptionalBoolean,
	active: OptionalBoolean,
	archived: OptionalBoolean,
	sports_market_types: z.array(z.string()).optional(),

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
export const MarketByIdQuerySchema = z.object({
	include_tag: OptionalBoolean,
});

// Series Query Schema
/**
 * Schema for series query parameters
 */
export const SeriesQuerySchema = z.object({
	limit: z.number(),
	offset: z.number(),
	order: OptionalString,
	ascending: OptionalBoolean,
	slug: z.array(z.string()).optional(),
	categories_ids: z.array(z.number()).optional(),
	categories_labels: z.array(z.string()).optional(),
	closed: OptionalBoolean,
	include_chat: OptionalBoolean,
	recurrence: OptionalString,
});

// Series by ID Query Schema
/**
 * Schema for series by ID query parameters
 */
export const SeriesByIdQuerySchema = z.object({
	include_chat: OptionalBoolean,
});

// Comment Schema
/**
 * Schema for comment objects
 */
export const CommentSchema = z.object({
	id: z.string(),
	body: z.string(),
	parentEntityType: z.string(),
	parentEntityID: z.number(),
	userAddress: z.string(),
	createdAt: z.string(),
	profile: z.any().optional(), // Profile object structure can vary
	reactions: z.array(z.any()).optional(), // Reaction objects can vary
	reportCount: z.number(),
	reactionCount: z.number(),
});

// Comment Query Schema
/**
 * Schema for comment query parameters
 */
export const CommentQuerySchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	order: OptionalString,
	ascending: OptionalBoolean,
	parent_entity_type: z.enum(["Event", "Series", "market"]).optional(),
	parent_entity_id: OptionalNumber,
	get_positions: OptionalBoolean,
	holders_only: OptionalBoolean,
});

// Comment by ID Query Schema
/**
 * Schema for comment by ID query parameters
 */
export const CommentByIdQuerySchema = z.object({
	get_positions: OptionalBoolean,
});

// Comments by User Address Query Schema
/**
 * Schema for comments by user address query parameters
 */
export const CommentsByUserQuerySchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	order: OptionalString,
	ascending: OptionalBoolean,
});

// Search Query Schema
/**
 * Schema for public search query parameters
 */
export const SearchQuerySchema = z.object({
	q: z.string(), // Required search query
	cache: OptionalBoolean,
	events_status: OptionalString,
	limit_per_type: OptionalNumber,
	page: OptionalNumber,
	events_tag: z.array(z.string()).optional(),
	sort: OptionalString,
	ascending: OptionalBoolean,
});

// Search Response Schema
/**
 * Schema for public search response
 */
export const SearchResponseSchema = z.object({
	events: z.array(z.any()).optional(), // Event objects
	tags: z.array(z.any()).optional(), // Tag objects with counts
	profiles: z.array(z.any()).optional(), // Profile objects
	pagination: z
		.object({
			hasMore: OptionalBoolean,
		})
		.optional(),
});

// Type exports for use in handlers and SDK

/** TypeScript type for market objects derived from MarketSchema */
export type MarketType = z.infer<typeof MarketSchema>;

/** TypeScript type for event objects derived from EventSchema */
export type EventType = z.infer<typeof EventSchema>;

/** TypeScript type for event market objects derived from EventMarketSchema */
export type EventMarketType = z.infer<typeof EventMarketSchema>;

/** TypeScript type for series objects derived from SeriesSchema */
export type SeriesType = z.infer<typeof SeriesSchema>;

/** TypeScript type for tag objects derived from TagSchema */
export type TagType = z.infer<typeof TagSchema>;

/** TypeScript type for price history responses derived from PriceHistoryResponseSchema */
export type PriceHistoryResponseType = z.infer<
	typeof PriceHistoryResponseSchema
>;

/** TypeScript type for price history data points derived from PriceHistoryPointSchema */
export type PriceHistoryPointType = z.infer<typeof PriceHistoryPointSchema>;

/** TypeScript type for market query parameters derived from MarketQuerySchema */
export type MarketQueryType = z.infer<typeof MarketQuerySchema>;

/** TypeScript type for event query parameters derived from EventQuerySchema */
export type EventQueryType = z.infer<typeof EventQuerySchema>;

/** TypeScript type for price history query parameters derived from PriceHistoryQuerySchema */
export type PriceHistoryQueryType = z.infer<typeof PriceHistoryQuerySchema>;

/** TypeScript type for CLOB client configuration derived from ClobClientConfigSchema */
export type ClobClientConfigType = z.infer<typeof ClobClientConfigSchema>;

/** TypeScript type for order summary derived from OrderSummarySchema */
export type OrderSummaryType = z.infer<typeof OrderSummarySchema>;

/** TypeScript type for order book summary derived from OrderBookSummarySchema */
export type OrderBookSummaryType = z.infer<typeof OrderBookSummarySchema>;

/** TypeScript type for book parameters derived from BookParamsSchema */
export type BookParamsType = z.infer<typeof BookParamsSchema>;

/** TypeScript type for price query parameters derived from PriceQuerySchema */
export type PriceQueryType = z.infer<typeof PriceQuerySchema>;

/** TypeScript type for midpoint query parameters derived from MidpointQuerySchema */
export type MidpointQueryType = z.infer<typeof MidpointQuerySchema>;

/** TypeScript type for token parameters derived from TokenParamsSchema */
export type TokenParamsType = z.infer<typeof TokenParamsSchema>;

/** TypeScript type for trade parameters derived from TradeParamsSchema */
export type TradeParamsType = z.infer<typeof TradeParamsSchema>;

/** TypeScript type for trade objects derived from TradeSchema */
export type TradeType = z.infer<typeof TradeSchema>;

/** TypeScript type for pagination payload derived from PaginationPayloadSchema */
export type PaginationPayloadType = z.infer<typeof PaginationPayloadSchema>;

/** TypeScript type for market pagination query derived from MarketPaginationQuerySchema */
export type MarketPaginationQueryType = z.infer<
	typeof MarketPaginationQuerySchema
>;

// New type exports for Gamma API endpoints

/** TypeScript type for gamma health response derived from GammaHealthResponseSchema */
export type GammaHealthResponseType = z.infer<typeof GammaHealthResponseSchema>;

/** TypeScript type for team objects derived from TeamSchema */
export type TeamType = z.infer<typeof TeamSchema>;

/** TypeScript type for team query parameters derived from TeamQuerySchema */
export type TeamQueryType = z.infer<typeof TeamQuerySchema>;

/** TypeScript type for updated tag objects derived from UpdatedTagSchema */
export type UpdatedTagType = z.infer<typeof UpdatedTagSchema>;

/** TypeScript type for tag query parameters derived from TagQuerySchema */
export type TagQueryType = z.infer<typeof TagQuerySchema>;

/** TypeScript type for tag by ID query parameters derived from TagByIdQuerySchema */
export type TagByIdQueryType = z.infer<typeof TagByIdQuerySchema>;

/** TypeScript type for related tag relationship objects derived from RelatedTagRelationshipSchema */
export type RelatedTagRelationshipType = z.infer<
	typeof RelatedTagRelationshipSchema
>;

/** TypeScript type for related tags query parameters derived from RelatedTagsQuerySchema */
export type RelatedTagsQueryType = z.infer<typeof RelatedTagsQuerySchema>;

/** TypeScript type for updated event query parameters derived from UpdatedEventQuerySchema */
export type UpdatedEventQueryType = z.infer<typeof UpdatedEventQuerySchema>;

/** TypeScript type for paginated event query parameters derived from PaginatedEventQuerySchema */
export type PaginatedEventQueryType = z.infer<typeof PaginatedEventQuerySchema>;

/** TypeScript type for event by ID query parameters derived from EventByIdQuerySchema */
export type EventByIdQueryType = z.infer<typeof EventByIdQuerySchema>;

/** TypeScript type for updated market query parameters derived from UpdatedMarketQuerySchema */
export type UpdatedMarketQueryType = z.infer<typeof UpdatedMarketQuerySchema>;

/** TypeScript type for market by ID query parameters derived from MarketByIdQuerySchema */
export type MarketByIdQueryType = z.infer<typeof MarketByIdQuerySchema>;

/** TypeScript type for series query parameters derived from SeriesQuerySchema */
export type SeriesQueryType = z.infer<typeof SeriesQuerySchema>;

/** TypeScript type for series by ID query parameters derived from SeriesByIdQuerySchema */
export type SeriesByIdQueryType = z.infer<typeof SeriesByIdQuerySchema>;

/** TypeScript type for comment objects derived from CommentSchema */
export type CommentType = z.infer<typeof CommentSchema>;

/** TypeScript type for comment query parameters derived from CommentQuerySchema */
export type CommentQueryType = z.infer<typeof CommentQuerySchema>;

/** TypeScript type for comment by ID query parameters derived from CommentByIdQuerySchema */
export type CommentByIdQueryType = z.infer<typeof CommentByIdQuerySchema>;

/** TypeScript type for comments by user address query parameters derived from CommentsByUserQuerySchema */
export type CommentsByUserQueryType = z.infer<typeof CommentsByUserQuerySchema>;

/** TypeScript type for search query parameters derived from SearchQuerySchema */
export type SearchQueryType = z.infer<typeof SearchQuerySchema>;

/** TypeScript type for search response derived from SearchResponseSchema */
export type SearchResponseType = z.infer<typeof SearchResponseSchema>;

/** TypeScript type for Gamma API error response derived from GammaErrorResponseSchema */
export type GammaErrorResponseType = z.infer<typeof GammaErrorResponseSchema>;

/** TypeScript type for HTTP proxy configuration derived from ProxyConfigSchema */
export type ProxyConfigType = z.infer<typeof ProxyConfigSchema>;
