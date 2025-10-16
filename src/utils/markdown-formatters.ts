/**
 * @module utils/markdown-formatters
 * @description Markdown formatting utilities for polymarket data
 * Markdown Formatters for Polymarket Events and Markets
 *
 * These functions convert event and market data into markdown format
 * optimized for LLM analysis, particularly for identifying arbitrage opportunities.
 * Focus is on key trading metrics, pricing data, and temporal constraints.
 *
 * Verbose Levels:
 * - 0: Basic info (title, description, dates, market questions only)
 * - 1: Include key metrics (volume, status, outcomes with prices)
 * - 2: Full details (all trading metrics, spreads, price changes, order book info)
 */

import { Effect, pipe } from "effect";
import type {
	MarkdownOptionsSchema,
	EventType,
	EventMarketType,
	SeriesType,
	TagType,
	MarketType,
} from "../types/elysia-schemas";

// Use inferred types from the centralized schemas to avoid duplication
export type MarkdownOptions = typeof MarkdownOptionsSchema.static;
export type MarketData = EventMarketType | MarketType; // Accept both types
export type SeriesData = SeriesType;
export type TagData = TagType;
export type EventData = EventType;

// Accept both camelCase and snake_case for consumer convenience
export type MarkdownOptionsInput = MarkdownOptions & {
	includeMarkets?: boolean;
};

const toError = (cause: unknown): Error =>
	cause instanceof Error ? cause : new Error(String(cause));

const safeExecute = <A>(compute: () => A, fallback: () => A): A =>
	Effect.runSync(
		pipe(
			Effect.try({
				try: compute,
				catch: toError,
			}),
			Effect.catchAll(() => Effect.succeed(fallback())),
		),
	);

const formatMetric = (
	label: string,
	value: number | undefined,
	format: (val: number) => string,
): string | undefined => {
	if (value === undefined) return undefined;
	return safeExecute(
		() => `${label}: ${format(value)}`,
		() => `${label}: ${value}`,
	);
};

const formatCurrencyMetric = (
	label: string,
	value?: number,
): string | undefined =>
	formatMetric(label, value, (val) => `$${val.toLocaleString()}`);

const formatPercentMetric = (
	label: string,
	value?: number,
): string | undefined =>
	formatMetric(label, value, (val) => `${(val * 100).toFixed(2)}%`);

const formatLiteralMetric = (
	label: string,
	value: string | number | undefined,
): string | undefined => {
	if (value === undefined) return undefined;
	return safeExecute(
		() => `${label}: ${value}`,
		() => `${label}: ${value}`,
	);
};

const collectMetrics = (metrics: Array<string | undefined>): string[] =>
	metrics.filter((value): value is string => Boolean(value));

const safeTruncate = (
	value: string | undefined | null,
	limit: number,
): string | undefined => {
	if (!value) return undefined;
	return safeExecute(
		() => (value.length > limit ? `${value.slice(0, limit)}...` : value),
		() => value,
	);
};

// Helper to safely access properties that might not exist on all MarketData types
const hasProperty = <K extends string, T = unknown>(
	obj: unknown,
	prop: K,
): obj is Record<K, T> => {
	return typeof obj === "object" && obj !== null && prop in obj;
};

// Helper to safely get a property value with proper typing
const getProperty = <K extends string, T>(
	obj: unknown,
	prop: K,
): T | undefined => {
	return hasProperty<K, T>(obj, prop) ? (obj as Record<K, T>)[prop] : undefined;
};

/**
 * Format a single market for markdown output
 * Focuses on key metrics relevant for arbitrage analysis
 */
export function formatMarketToMarkdown(
	market: MarketData,
	options: MarkdownOptionsInput = {},
): string {
	const { verbose = 2 } = options;
	const parts = [`## Market: ${market.question}`];

	// Verbose 0: Only basic info
	if (verbose === 0) {
		if (market.startDateIso || ("endDateIso" in market && market.endDateIso)) {
			parts.push(
				`**Trading Period**: ${market.startDateIso || "N/A"} → ${"endDateIso" in market ? market.endDateIso : "N/A"}`,
			);
		}
		return `${parts.join("\n\n")}\n\n---\n`;
	}

	// Verbose 1+: Add ID and status
	parts.push(`**ID**: ${market.id}`);
	parts.push(
		`**Status**: ${market.active ? "Active" : "Inactive"} | ${market.closed ? "Closed" : "Open"} | ${getProperty(market, "restricted") ? "Restricted" : "Unrestricted"}`,
	);

	// Trading dates
	if (market.startDateIso || ("endDateIso" in market && market.endDateIso)) {
		parts.push(
			`**Trading Period**: ${market.startDateIso || "N/A"} → ${"endDateIso" in market ? market.endDateIso : "N/A"}`,
		);
	}

	// Market outcomes and pricing (key for arbitrage)
	// Handle both string and array formats for outcomes and outcomePrices
	const outcomes = Array.isArray(market.outcomes)
		? market.outcomes
		: typeof market.outcomes === "string"
			? JSON.parse(market.outcomes || "[]")
			: [];

	const outcomePrices = Array.isArray(market.outcomePrices)
		? market.outcomePrices
		: typeof market.outcomePrices === "string"
			? JSON.parse(market.outcomePrices || "[]")
			: [];

	if (
		outcomes.length > 0 &&
		outcomePrices.length > 0 &&
		outcomes.length === outcomePrices.length
	) {
		parts.push(`**Outcomes & Prices**:`);
		for (let i = 0; i < outcomes.length; i++) {
			parts.push(`- ${outcomes[i]}: $${outcomePrices[i]}`);
		}
	}

	// Basic volume info for verbose 1
	if (verbose === 1) {
		const basicMetrics = collectMetrics([
			...(market.volumeNum !== undefined
				? [formatCurrencyMetric("Volume", market.volumeNum)]
				: market.volume !== undefined
					? [formatLiteralMetric("Volume", `$${market.volume}`)]
					: []),
		]);
		if (basicMetrics.length > 0) {
			parts.push(`**Metrics**: ${basicMetrics.join(" | ")}`);
		}
		return `${parts.join("\n\n")}\n\n---\n`;
	}

	// Verbose 2: Full details
	// Key trading metrics for arbitrage analysis
	const tradingMetrics = collectMetrics([
		formatCurrencyMetric("Last Trade", getProperty(market, "lastTradePrice")),
		formatCurrencyMetric("Best Bid", getProperty(market, "bestBid")),
		formatCurrencyMetric("Best Ask", getProperty(market, "bestAsk")),
		formatPercentMetric("Spread", getProperty(market, "spread")),
	]);

	if (tradingMetrics.length > 0) {
		parts.push(`**Trading Metrics**: ${tradingMetrics.join(" | ")}`);
	}

	// Price changes (momentum indicators)
	const priceChanges = collectMetrics([
		formatPercentMetric("1hr", getProperty(market, "oneHourPriceChange")),
		formatPercentMetric("24hr", getProperty(market, "oneDayPriceChange")),
	]);

	if (priceChanges.length > 0) {
		parts.push(`**Price Changes**: ${priceChanges.join(" | ")}`);
	}

	// Volume metrics (liquidity indicators)
	const volumeMetrics = collectMetrics([
		...(market.volumeNum !== undefined
			? [formatCurrencyMetric("Total", market.volumeNum)]
			: market.volume !== undefined
				? [formatLiteralMetric("Total", `$${market.volume}`)]
				: []),
		formatCurrencyMetric("24hr", market.volume24hr),
		formatCurrencyMetric("1wk", market.volume1wk),
		formatCurrencyMetric("Liquidity", market.liquidityNum),
	]);

	if (volumeMetrics.length > 0) {
		parts.push(`**Volume**: ${volumeMetrics.join(" | ")}`);
	}

	// Order book constraints
	if (getProperty(market, "enableOrderBook")) {
		const constraints = collectMetrics([
			...(getProperty(market, "orderMinSize") !== undefined
				? [
						formatLiteralMetric(
							"Min Size",
							`$${getProperty(market, "orderMinSize")}`,
						),
					]
				: []),
			...(getProperty(market, "orderPriceMinTickSize") !== undefined
				? [
						formatLiteralMetric(
							"Min Tick",
							`$${getProperty(market, "orderPriceMinTickSize")}`,
						),
					]
				: []),
		]);
		if (constraints.length > 0) {
			parts.push(`**Order Book**: Enabled | ${constraints.join(" | ")}`);
		}
	}

	// Market description (for context)
	const marketDescription = safeTruncate(market.description, 200);
	if (marketDescription) {
		parts.push(`**Description**: ${marketDescription}`);
	}

	return `${parts.join("\n\n")}\n\n---\n`;
}

/**
 * Format series information for context
 */
function formatSeriesToMarkdown(series: SeriesData[]): string {
	if (!series || series.length === 0) return "";

	const parts = ["## Series Context"];

	series.forEach((s) => {
		const metrics = collectMetrics([
			formatCurrencyMetric("Volume", s.volume),
			formatCurrencyMetric("Liquidity", s.liquidity),
			formatLiteralMetric("Comments", s.commentCount),
		]);

		parts.push(
			`**${s.title}** (${s.seriesType}, ${s.recurrence}) - ${s.active ? "Active" : "Inactive"} | ${metrics.join(" | ")}`,
		);
	});

	return `${parts.join("\n")}\n\n`;
}

/**
 * Format tags for categorization
 */
function formatTagsToMarkdown(tags: TagData[]): string {
	if (!tags || tags.length === 0) return "";

	return `**Tags**: ${tags.map((t) => t.label).join(", ")}\n\n`;
}

/**
 * Format event data to markdown optimized for LLM arbitrage analysis
 * Calls formatMarketToMarkdown for each market within the event
 */
export function formatEventToMarkdown(
	event: EventData,
	options: MarkdownOptionsInput = {},
): string {
	const verbose = options.verbose ?? 2;
	const includeMarkets =
		(options as { includeMarkets?: boolean }).includeMarkets ??
		options.include_markets ??
		true;
	const parts = [`# Event: ${event.title}`];

	// Verbose 0: Only basic info
	if (verbose === 0) {
		// Event timeline (critical for time-sensitive arbitrage)
		parts.push(`**Timeline**: ${event.startDate || "N/A"} → ${event.endDate}`);

		// Event description
		const eventDescription = safeTruncate(event.description, 200);
		if (eventDescription) {
			parts.push(`**Description**: ${eventDescription}`);
		}

		// Only market questions if includeMarkets is true
		if (includeMarkets && event.markets && event.markets.length > 0) {
			parts.push(`## Markets (${event.markets.length} total)`);
			event.markets.forEach((market) => {
				parts.push(formatMarketToMarkdown(market, options));
			});
		}

		return parts.join("\n\n");
	}

	// Verbose 1+: Add more details
	parts.push(`**ID**: ${event.id} | **Slug**: ${event.slug}`);
	parts.push(
		`**Status**: ${event.active ? "Active" : "Inactive"} | ${event.closed ? "Closed" : "Open"} | ${event.archived ? "Archived" : "Live"} | ${event.restricted ? "Restricted" : "Unrestricted"}`,
	);

	// Event timeline (critical for time-sensitive arbitrage)
	parts.push(`**Timeline**: ${event.startDate || "N/A"} → ${event.endDate}`);

	// Basic event metrics for verbose 1
	if (verbose === 1) {
		const basicMetrics = collectMetrics([
			formatCurrencyMetric("Volume", event.volume),
			formatLiteralMetric("Comments", event.commentCount),
		]);
		if (basicMetrics.length > 0) {
			parts.push(`**Metrics**: ${basicMetrics.join(" | ")}`);
		}

		// Event description
		const description = safeTruncate(event.description, 250);
		if (description) {
			parts.push(`**Description**: ${description}`);
		}

		// Markets with basic info
		if (includeMarkets && event.markets && event.markets.length > 0) {
			parts.push(`## Markets (${event.markets.length} total)`);
			event.markets.forEach((market) => {
				parts.push(formatMarketToMarkdown(market, options));
			});
		}

		return parts.join("\n\n");
	}

	// Verbose 2: Full details
	// Event-level metrics
	const eventMetrics = collectMetrics([
		formatCurrencyMetric("Volume", event.volume),
		formatCurrencyMetric("Open Interest", event.openInterest),
		formatCurrencyMetric("24hr Vol", event.volume24hr),
		formatCurrencyMetric("1wk Vol", event.volume1wk),
		formatLiteralMetric("Comments", event.commentCount),
	]);

	if (eventMetrics.length > 0) {
		parts.push(`**Event Metrics**: ${eventMetrics.join(" | ")}`);
	}

	// Order book availability
	if (event.enableOrderBook !== undefined) {
		parts.push(
			`**Order Book**: ${event.enableOrderBook ? "Enabled" : "Disabled"}`,
		);
	}

	// Event description
	const eventDescription = safeTruncate(event.description, 300);
	if (eventDescription) {
		parts.push(`**Description**: ${eventDescription}`);
	}

	// Tags for categorization
	if (event.tags) {
		parts.push(formatTagsToMarkdown(event.tags));
	}

	// Series context
	if (event.series) {
		parts.push(formatSeriesToMarkdown(event.series));
	}

	// Markets (the core data for arbitrage analysis)
	if (includeMarkets && event.markets && event.markets.length > 0) {
		parts.push(`## Markets (${event.markets.length} total)`);
		event.markets.forEach((market) => {
			parts.push(formatMarketToMarkdown(market, options));
		});
	}

	// Analysis summary (only for verbose 2)
	if (includeMarkets) {
		parts.push("## Arbitrage Analysis Summary");
		const analysisPoints = [
			`- **Market Count**: ${event.markets.length} markets in this event`,
			`- **Liquidity**: Total volume $${event.volume ? event.volume.toLocaleString() : "N/A"}`,
			`- **Status**: ${event.active && !event.closed ? "Currently tradeable" : "Not tradeable"}`,
			`- **Time Constraint**: Event ends ${event.endDate}`,
		];

		if (event.markets.length > 1) {
			analysisPoints.push(
				"- **Cross-Market Opportunities**: Multiple markets may allow for arbitrage strategies",
			);
		}

		const activeMarkets = event.markets.filter((m) => m.active && !m.closed);
		if (activeMarkets.length > 0) {
			const avgSpread = Effect.runSync(
				pipe(
					Effect.try({
						try: () => {
							const spreadSum = activeMarkets
								.filter((m) => m.spread !== undefined)
								.reduce((sum, m) => sum + (m.spread ?? 0), 0);
							return spreadSum / activeMarkets.length;
						},
						catch: toError,
					}),
					Effect.catchAll(() => Effect.succeed<number | undefined>(undefined)),
				),
			);
			if (avgSpread !== undefined && avgSpread > 0) {
				analysisPoints.push(
					`- **Average Spread**: ${(avgSpread * 100).toFixed(2)}% across active markets`,
				);
			}
		}

		parts.push(analysisPoints.join("\n"));
	}

	return parts.join("\n\n");
}
