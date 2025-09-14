/**
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

export interface MarkdownOptions {
	verbose?: 0 | 1 | 2;
	includeMarkets?: boolean;
}

export interface MarketData {
	id: string;
	question: string;
	conditionId: string;
	slug: string;
	description: string;
	outcomes: string[];
	outcomePrices: string[];
	volume?: string;
	active: boolean;
	closed: boolean;
	startDate?: string;
	endDate?: string;
	endDateIso?: string;
	startDateIso?: string;
	volumeNum?: number;
	liquidityNum?: number;
	volume24hr?: number;
	volume1wk?: number;
	volume1mo?: number;
	volume1yr?: number;
	spread?: number;
	oneDayPriceChange?: number;
	oneHourPriceChange?: number;
	lastTradePrice?: number;
	bestBid?: number;
	bestAsk?: number;
	orderPriceMinTickSize?: number;
	orderMinSize?: number;
	enableOrderBook?: boolean;
	restricted?: boolean;
}

export interface SeriesData {
	id: string;
	title: string;
	slug: string;
	seriesType: string;
	recurrence: string;
	active: boolean;
	closed: boolean;
	volume?: number;
	liquidity?: number;
	commentCount?: number;
}

export interface TagData {
	id: string;
	label: string;
	slug: string;
}

export interface EventData {
	id: string;
	title: string;
	slug: string;
	description?: string;
	startDate?: string;
	endDate: string;
	active: boolean;
	closed: boolean;
	archived: boolean;
	restricted?: boolean;
	volume: number;
	openInterest?: number;
	volume24hr?: number;
	volume1wk?: number;
	volume1mo?: number;
	volume1yr?: number;
	markets: MarketData[];
	series?: SeriesData[];
	tags?: TagData[];
	enableOrderBook?: boolean;
	commentCount?: number;
}

/**
 * Format a single market for markdown output
 * Focuses on key metrics relevant for arbitrage analysis
 */
export function formatMarketToMarkdown(
	market: MarketData,
	options: MarkdownOptions = {},
): string {
	const { verbose = 2 } = options;
	const parts = [`## Market: ${market.question}`];

	// Verbose 0: Only basic info
	if (verbose === 0) {
		if (market.startDateIso || market.endDateIso) {
			parts.push(
				`**Trading Period**: ${market.startDateIso || "N/A"} → ${market.endDateIso || "N/A"}`,
			);
		}
		return parts.join("\n\n") + "\n\n---\n";
	}

	// Verbose 1+: Add ID and status
	parts.push(`**ID**: ${market.id}`);
	parts.push(
		`**Status**: ${market.active ? "Active" : "Inactive"} | ${market.closed ? "Closed" : "Open"} | ${market.restricted ? "Restricted" : "Unrestricted"}`,
	);

	// Trading dates
	if (market.startDateIso || market.endDateIso) {
		parts.push(
			`**Trading Period**: ${market.startDateIso || "N/A"} → ${market.endDateIso || "N/A"}`,
		);
	}

	// Market outcomes and pricing (key for arbitrage)
	if (
		market.outcomes &&
		market.outcomePrices &&
		market.outcomes.length === market.outcomePrices.length
	) {
		parts.push(`**Outcomes & Prices**:`);
		for (let i = 0; i < market.outcomes.length; i++) {
			parts.push(`- ${market.outcomes[i]}: $${market.outcomePrices[i]}`);
		}
	}

	// Basic volume info for verbose 1
	if (verbose === 1) {
		const basicMetrics = [];
		if (market.volumeNum !== undefined)
			basicMetrics.push(`Volume: $${market.volumeNum.toLocaleString()}`);
		else if (market.volume !== undefined)
			basicMetrics.push(`Volume: $${market.volume}`);
		if (basicMetrics.length > 0) {
			parts.push(`**Metrics**: ${basicMetrics.join(" | ")}`);
		}
		return parts.join("\n\n") + "\n\n---\n";
	}

	// Verbose 2: Full details
	// Key trading metrics for arbitrage analysis
	const tradingMetrics = [];
	if (market.lastTradePrice !== undefined)
		tradingMetrics.push(`Last Trade: $${market.lastTradePrice}`);
	if (market.bestBid !== undefined)
		tradingMetrics.push(`Best Bid: $${market.bestBid}`);
	if (market.bestAsk !== undefined)
		tradingMetrics.push(`Best Ask: $${market.bestAsk}`);
	if (market.spread !== undefined)
		tradingMetrics.push(`Spread: ${(market.spread * 100).toFixed(2)}%`);

	if (tradingMetrics.length > 0) {
		parts.push(`**Trading Metrics**: ${tradingMetrics.join(" | ")}`);
	}

	// Price changes (momentum indicators)
	const priceChanges = [];
	if (market.oneHourPriceChange !== undefined)
		priceChanges.push(`1hr: ${(market.oneHourPriceChange * 100).toFixed(2)}%`);
	if (market.oneDayPriceChange !== undefined)
		priceChanges.push(`24hr: ${(market.oneDayPriceChange * 100).toFixed(2)}%`);

	if (priceChanges.length > 0) {
		parts.push(`**Price Changes**: ${priceChanges.join(" | ")}`);
	}

	// Volume metrics (liquidity indicators)
	const volumeMetrics = [];
	if (market.volumeNum !== undefined)
		volumeMetrics.push(`Total: $${market.volumeNum.toLocaleString()}`);
	else if (market.volume !== undefined)
		volumeMetrics.push(`Total: $${market.volume}`);
	if (market.volume24hr !== undefined)
		volumeMetrics.push(`24hr: $${market.volume24hr.toLocaleString()}`);
	if (market.volume1wk !== undefined)
		volumeMetrics.push(`1wk: $${market.volume1wk.toLocaleString()}`);
	if (market.liquidityNum !== undefined)
		volumeMetrics.push(`Liquidity: $${market.liquidityNum.toLocaleString()}`);

	if (volumeMetrics.length > 0) {
		parts.push(`**Volume**: ${volumeMetrics.join(" | ")}`);
	}

	// Order book constraints
	if (market.enableOrderBook) {
		const constraints = [];
		if (market.orderMinSize !== undefined)
			constraints.push(`Min Size: $${market.orderMinSize}`);
		if (market.orderPriceMinTickSize !== undefined)
			constraints.push(`Min Tick: $${market.orderPriceMinTickSize}`);
		if (constraints.length > 0) {
			parts.push(`**Order Book**: Enabled | ${constraints.join(" | ")}`);
		}
	}

	// Market description (for context)
	if (market.description) {
		const shortDesc =
			market.description.length > 200
				? market.description.substring(0, 200) + "..."
				: market.description;
		parts.push(`**Description**: ${shortDesc}`);
	}

	return parts.join("\n\n") + "\n\n---\n";
}

/**
 * Format series information for context
 */
function formatSeriesToMarkdown(series: SeriesData[]): string {
	if (!series || series.length === 0) return "";

	const parts = ["## Series Context"];

	series.forEach((s) => {
		const metrics = [];
		if (s.volume !== undefined)
			metrics.push(`Volume: $${s.volume.toLocaleString()}`);
		if (s.liquidity !== undefined)
			metrics.push(`Liquidity: $${s.liquidity.toLocaleString()}`);
		if (s.commentCount !== undefined)
			metrics.push(`Comments: ${s.commentCount}`);

		parts.push(
			`**${s.title}** (${s.seriesType}, ${s.recurrence}) - ${s.active ? "Active" : "Inactive"} | ${metrics.join(" | ")}`,
		);
	});

	return parts.join("\n") + "\n\n";
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
	options: MarkdownOptions = {},
): string {
	const { verbose = 2, includeMarkets = true } = options;
	const parts = [`# Event: ${event.title}`];

	// Verbose 0: Only basic info
	if (verbose === 0) {
		// Event timeline (critical for time-sensitive arbitrage)
		parts.push(`**Timeline**: ${event.startDate || "N/A"} → ${event.endDate}`);

		// Event description
		if (event.description) {
			const shortDesc =
				event.description.length > 200
					? event.description.substring(0, 200) + "..."
					: event.description;
			parts.push(`**Description**: ${shortDesc}`);
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
		const basicMetrics = [];
		basicMetrics.push(`Volume: $${event.volume.toLocaleString()}`);
		if (event.commentCount !== undefined)
			basicMetrics.push(`Comments: ${event.commentCount}`);
		parts.push(`**Metrics**: ${basicMetrics.join(" | ")}`);

		// Event description
		if (event.description) {
			const shortDesc =
				event.description.length > 250
					? event.description.substring(0, 250) + "..."
					: event.description;
			parts.push(`**Description**: ${shortDesc}`);
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
	const eventMetrics = [];
	eventMetrics.push(`Volume: $${event.volume.toLocaleString()}`);
	if (event.openInterest !== undefined)
		eventMetrics.push(`Open Interest: $${event.openInterest.toLocaleString()}`);
	if (event.volume24hr !== undefined)
		eventMetrics.push(`24hr Vol: $${event.volume24hr.toLocaleString()}`);
	if (event.volume1wk !== undefined)
		eventMetrics.push(`1wk Vol: $${event.volume1wk.toLocaleString()}`);
	if (event.commentCount !== undefined)
		eventMetrics.push(`Comments: ${event.commentCount}`);

	parts.push(`**Event Metrics**: ${eventMetrics.join(" | ")}`);

	// Order book availability
	if (event.enableOrderBook !== undefined) {
		parts.push(
			`**Order Book**: ${event.enableOrderBook ? "Enabled" : "Disabled"}`,
		);
	}

	// Event description
	if (event.description) {
		const shortDesc =
			event.description.length > 300
				? event.description.substring(0, 300) + "..."
				: event.description;
		parts.push(`**Description**: ${shortDesc}`);
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
			`- **Liquidity**: Total volume $${event.volume.toLocaleString()}`,
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
			const avgSpread =
				activeMarkets
					.filter((m) => m.spread !== undefined)
					.reduce((sum, m) => sum + (m.spread || 0), 0) / activeMarkets.length;
			if (avgSpread > 0) {
				analysisPoints.push(
					`- **Average Spread**: ${(avgSpread * 100).toFixed(2)}% across active markets`,
				);
			}
		}

		parts.push(analysisPoints.join("\n"));
	}

	return parts.join("\n\n");
}
