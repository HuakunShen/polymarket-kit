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

// Market Schema for API responses
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
      })
    )
  ),
});

// Event Market Schema (markets within events)
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
export const TagSchema = t.Object({
  id: t.String(),
  label: t.String(),
  slug: t.String(),
  forceShow: OptionalBoolean,
  createdAt: OptionalString,
  isCarousel: OptionalBoolean,
});

// Event Schema
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

// Price History Data Point Schema
export const PriceHistoryPointSchema = t.Object({
  t: t.Number(), // timestamp
  p: t.Number(), // price
});

// Price History Response Schema
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

// Request parameter schemas
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

// Price History Interval Enum for dropdown in Swagger

export const PriceHistoryIntervalEnum = t.UnionEnum([
  "1m",
  "1h",
  "6h",
  "1d",
  "1w",
  "max",
]);

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

// CLOB Client Configuration Schema
export const ClobClientConfigSchema = t.Object({
  privateKey: t.String(),
  funderAddress: t.String(),
  host: t.Optional(t.String()),
  chainId: t.Optional(t.Number()),
  signatureType: t.Optional(t.Number()),
});

// Common response schemas
export const ErrorResponseSchema = t.Object({
  error: t.String(),
  message: t.String(),
  details: t.Optional(t.String()),
});

export const HealthResponseSchema = t.Object({
  status: t.Union([t.Literal("healthy"), t.Literal("unhealthy")]),
  timestamp: t.String(),
  clob: t.String(),
  cached: t.Optional(t.Boolean()),
  error: t.Optional(t.String()),
});

// Type exports for use in handlers and SDK
export type MarketType = typeof MarketSchema.static;
export type EventType = typeof EventSchema.static;
export type EventMarketType = typeof EventMarketSchema.static;
export type SeriesType = typeof SeriesSchema.static;
export type TagType = typeof TagSchema.static;
export type PriceHistoryResponseType = typeof PriceHistoryResponseSchema.static;
export type PriceHistoryPointType = typeof PriceHistoryPointSchema.static;
export type MarketQueryType = typeof MarketQuerySchema.static;
export type EventQueryType = typeof EventQuerySchema.static;
export type PriceHistoryQueryType = typeof PriceHistoryQuerySchema.static;
export type ClobClientConfigType = typeof ClobClientConfigSchema.static;
