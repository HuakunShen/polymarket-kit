/**
 * Unit tests for markdown formatters
 *
 * These tests ensure the markdown formatter functions don't crash and demonstrate
 * how to use them for converting Polymarket event and market data.
 */

import { describe, test, expect } from "bun:test";
import {
	formatEventToMarkdown,
	formatMarketToMarkdown,
	type EventData,
	type MarketData,
} from "../markdown-formatters";

// Sample market data for testing
const sampleMarket: MarketData = {
	id: "581554",
	question: "1,415+ Measles cases in U.S. by September 12?",
	conditionId:
		"0xb5454a5643e2f61fa78d7cd1039049f4208f9fc995c3eee19c164d58e9ff3fdc",
	slug: "1415-measles-cases-in-us-by-september-12",
	description:
		'This market will resolve to "Yes" if there have been 1,415 or more confirmed cases of Measles (Rubeola) in humans in the territory of the United States of America in 2025, according to the CDC case counter, by September 12, 2025, 11:59 PM ET. Otherwise, this market will resolve to "No".',
	outcomes: ["Yes", "No"],
	outcomePrices: ["1", "0"],
	volume: "9916.517481",
	active: true,
	closed: true,
	startDate: "2025-08-26T16:24:33.702Z",
	endDate: "2025-09-12T00:00:00Z",
	endDateIso: "2025-09-12",
	startDateIso: "2025-08-26",
	volumeNum: 9916.517481,
	volume24hr: 8987.90623,
	volume1wk: 8987.90623,
	volume1mo: 9916.517481,
	volume1yr: 9916.517481,
	spread: 0.001,
	oneDayPriceChange: 0.012,
	lastTradePrice: 1,
	bestBid: 0.999,
	bestAsk: 1,
	orderPriceMinTickSize: 0.001,
	orderMinSize: 5,
	enableOrderBook: true,
	restricted: true,
};

// Sample event data for testing
const sampleEvent: EventData = {
	id: "39822",
	title: "1,415+ Measles cases in U.S. by September 12?",
	slug: "1415-measles-cases-in-us-by-september-12",
	description:
		'This market will resolve to "Yes" if there have been 1,415 or more confirmed cases of Measles (Rubeola) in humans in the territory of the United States of America in 2025, according to the CDC case counter, by September 12, 2025, 11:59 PM ET. Otherwise, this market will resolve to "No".',
	startDate: "2025-08-26T16:47:21.777321Z",
	endDate: "2025-09-12T00:00:00Z",
	active: true,
	closed: true,
	archived: false,
	restricted: true,
	volume: 9916.517481,
	openInterest: 0,
	volume24hr: 8987.90623,
	volume1wk: 8987.90623,
	volume1mo: 9916.517481,
	volume1yr: 9916.517481,
	enableOrderBook: true,
	commentCount: 24,
	markets: [sampleMarket],
	series: [
		{
			id: "10112",
			title: "measles",
			slug: "measles",
			seriesType: "single",
			recurrence: "monthly",
			active: true,
			closed: false,
			volume: 17081.82659,
			liquidity: 13904.47306,
			commentCount: 352,
		},
	],
	tags: [
		{
			id: "570",
			label: "Pandemics",
			slug: "pandemics",
		},
		{
			id: "74",
			label: "Science",
			slug: "science",
		},
	],
};

describe("formatMarketToMarkdown", () => {
	test("should format market with default verbose level (2)", () => {
		const result = formatMarketToMarkdown(sampleMarket);

		expect(result).toContain(
			"## Market: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("**ID**: 581554");
		expect(result).toContain("**Status**: Active | Closed | Restricted");
		expect(result).toContain("**Outcomes & Prices**:");
		expect(result).toContain("- Yes: $1");
		expect(result).toContain("- No: $0");
		expect(result).toContain("**Trading Metrics**:");
		expect(result).toContain("Last Trade: $1");
		expect(result).toContain("Best Bid: $0.999");
		expect(result).toContain("Best Ask: $1");
		expect(result).toContain("Spread: 0.10%");
		expect(result).toContain("**Volume**:");
		expect(result).toContain("**Order Book**: Enabled");
		expect(result).toContain("**Description**:");
	});

	test("should format market with verbose level 0 (basic)", () => {
		const result = formatMarketToMarkdown(sampleMarket, { verbose: 0 });

		expect(result).toContain(
			"## Market: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("**Trading Period**: 2025-08-26 → 2025-09-12");

		// Should not contain detailed metrics
		expect(result).not.toContain("**ID**: 581554");
		expect(result).not.toContain("**Status**:");
		expect(result).not.toContain("**Trading Metrics**:");
		expect(result).not.toContain("**Volume**:");
	});

	test("should format market with verbose level 1 (medium)", () => {
		const result = formatMarketToMarkdown(sampleMarket, { verbose: 1 });

		expect(result).toContain(
			"## Market: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("**ID**: 581554");
		expect(result).toContain("**Status**: Active | Closed | Restricted");
		expect(result).toContain("**Outcomes & Prices**:");
		expect(result).toContain("**Metrics**: Volume: $9,916.517");

		// Should not contain full trading details
		expect(result).not.toContain("**Trading Metrics**:");
		expect(result).not.toContain("**Order Book**:");
	});

	test("should handle market with minimal data", () => {
		const minimalMarket: MarketData = {
			id: "123",
			question: "Will it rain tomorrow?",
			conditionId: "0x123",
			slug: "rain-tomorrow",
			description: "Simple market",
			outcomes: ["Yes", "No"],
			outcomePrices: ["0.5", "0.5"],
			active: true,
			closed: false,
		};

		const result = formatMarketToMarkdown(minimalMarket);
		expect(result).toContain("## Market: Will it rain tomorrow?");
		expect(result).toContain("**ID**: 123");
		expect(result).toContain("**Status**: Active | Open | Unrestricted");
	});
});

describe("formatEventToMarkdown", () => {
	test("should format event with default options (verbose=2, includeMarkets=true)", () => {
		const result = formatEventToMarkdown(sampleEvent);

		expect(result).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain(
			"**ID**: 39822 | **Slug**: 1415-measles-cases-in-us-by-september-12",
		);
		expect(result).toContain("**Status**: Active | Closed | Live | Restricted");
		expect(result).toContain(
			"**Timeline**: 2025-08-26T16:47:21.777321Z → 2025-09-12T00:00:00Z",
		);
		expect(result).toContain("**Event Metrics**:");
		expect(result).toContain("Volume: $9,916.517");
		expect(result).toContain("**Order Book**: Enabled");
		expect(result).toContain("**Tags**: Pandemics, Science");
		expect(result).toContain("## Series Context");
		expect(result).toContain("**measles**");
		expect(result).toContain("## Markets (1 total)");
		expect(result).toContain(
			"## Market: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("## Arbitrage Analysis Summary");
		expect(result).toContain("**Market Count**: 1 markets in this event");
	});

	test("should format event with verbose level 0", () => {
		const result = formatEventToMarkdown(sampleEvent, { verbose: 0 });

		expect(result).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain(
			"**Timeline**: 2025-08-26T16:47:21.777321Z → 2025-09-12T00:00:00Z",
		);
		expect(result).toContain("**Description**:");
		expect(result).toContain("## Markets (1 total)");

		// Should not contain detailed metrics
		expect(result).not.toContain("**ID**: 39822");
		expect(result).not.toContain("**Event Metrics**:");
		expect(result).not.toContain("## Series Context");
		expect(result).not.toContain("## Arbitrage Analysis Summary");
	});

	test("should format event with verbose level 1", () => {
		const result = formatEventToMarkdown(sampleEvent, { verbose: 1 });

		expect(result).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain(
			"**ID**: 39822 | **Slug**: 1415-measles-cases-in-us-by-september-12",
		);
		expect(result).toContain("**Status**: Active | Closed | Live | Restricted");
		expect(result).toContain("**Metrics**: Volume: $9,916.517 | Comments: 24");
		expect(result).toContain("## Markets (1 total)");

		// Should not contain full details
		expect(result).not.toContain("**Event Metrics**:");
		expect(result).not.toContain("## Series Context");
		expect(result).not.toContain("## Arbitrage Analysis Summary");
	});

	test("should format event without markets when includeMarkets=false", () => {
		const result = formatEventToMarkdown(sampleEvent, {
			includeMarkets: false,
		});

		expect(result).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("**Event Metrics**:");
		expect(result).toContain("**Tags**: Pandemics, Science");
		expect(result).toContain("## Series Context");

		// Should not contain markets or analysis
		expect(result).not.toContain("## Markets (1 total)");
		expect(result).not.toContain(
			"## Market: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).not.toContain("## Arbitrage Analysis Summary");
	});

	test("should handle event with no markets", () => {
		const eventWithoutMarkets: EventData = {
			...sampleEvent,
			markets: [],
		};

		const result = formatEventToMarkdown(eventWithoutMarkets);
		expect(result).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(result).toContain("**Market Count**: 0 markets in this event");
	});

	test("should handle event with multiple markets", () => {
		const eventWithMultipleMarkets: EventData = {
			...sampleEvent,
			markets: [
				sampleMarket,
				{ ...sampleMarket, id: "123456", question: "Another question?" },
			],
		};

		const result = formatEventToMarkdown(eventWithMultipleMarkets);
		expect(result).toContain("## Markets (2 total)");
		expect(result).toContain(
			"**Cross-Market Opportunities**: Multiple markets may allow for arbitrage strategies",
		);
	});
});

describe("Real-world usage examples", () => {
	test("should demonstrate how users can map events to markdown", () => {
		// Simulate fetching a list of events and mapping them to markdown
		const events: EventData[] = [sampleEvent];

		// Example: Convert all events to basic markdown for quick overview
		const basicMarkdowns = events.map((event) =>
			formatEventToMarkdown(event, { verbose: 0, includeMarkets: false }),
		);

		expect(basicMarkdowns).toHaveLength(1);
		expect(basicMarkdowns[0]).toContain(
			"# Event: 1,415+ Measles cases in U.S. by September 12?",
		);
		expect(basicMarkdowns[0]).not.toContain("## Markets");
	});

	test("should demonstrate filtering events with markets for arbitrage analysis", () => {
		const events: EventData[] = [sampleEvent];

		// Example: Get detailed markdown for events with multiple markets (arbitrage opportunities)
		const arbitrageOpportunities = events
			.filter((event) => event.markets.length > 1) // Filter for multiple markets
			.map((event) =>
				formatEventToMarkdown(event, { verbose: 2, includeMarkets: true }),
			);

		// This event has only 1 market, so should be filtered out
		expect(arbitrageOpportunities).toHaveLength(0);

		// Test with event having multiple markets
		const multiMarketEvent: EventData = {
			...sampleEvent,
			markets: [
				sampleMarket,
				{ ...sampleMarket, id: "999", question: "Related question?" },
			],
		};

		const multiMarketResults = [multiMarketEvent]
			.filter((event) => event.markets.length > 1)
			.map((event) =>
				formatEventToMarkdown(event, { verbose: 2, includeMarkets: true }),
			);

		expect(multiMarketResults).toHaveLength(1);
		expect(multiMarketResults[0]).toContain("**Cross-Market Opportunities**");
	});

	test("should demonstrate batch processing for different analysis needs", () => {
		const events: EventData[] = [sampleEvent];

		// Example: Quick overview (level 0)
		const overview = events.map((event) =>
			formatEventToMarkdown(event, { verbose: 0, includeMarkets: true }),
		);

		// Example: Medium detail for screening (level 1)
		const screening = events.map((event) =>
			formatEventToMarkdown(event, { verbose: 1, includeMarkets: true }),
		);

		// Example: Full analysis (level 2)
		const fullAnalysis = events.map((event) =>
			formatEventToMarkdown(event, { verbose: 2, includeMarkets: true }),
		);
		if (
			screening.length === 0 ||
			overview.length === 0 ||
			fullAnalysis.length === 0
		) {
			throw new Error("Expected non-empty markdown results");
		}
		expect(overview[0]?.length).toBeLessThan(screening[0]!.length);
		expect(screening[0]?.length).toBeLessThan(fullAnalysis[0]!.length);

		// Verify content differences
		expect(overview[0]).not.toContain("**Trading Metrics**:");
		expect(screening[0]).toContain("**Outcomes & Prices**:");
		expect(screening[0]).not.toContain("**Trading Metrics**:");
		expect(fullAnalysis[0]).toContain("**Trading Metrics**:");
		expect(fullAnalysis[0]).toContain("## Arbitrage Analysis Summary");
	});
});
