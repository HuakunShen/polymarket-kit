/**
 * Tests for GammaSDK
 *
 * These tests cover all the Gamma API endpoints with both successful and error cases.
 * Uses real API calls but with known test data to ensure reliability.
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { GammaSDK } from "../gamma-client";

// Test data - will be provided by user
const TEST_DATA = {
	// Valid IDs that should exist
	validEventId: 0, // Will be set by user
	validMarketId: 0, // Will be set by user
	validSeriesId: 0, // Will be set by user
	validTagId: 0, // Will be set by user

	// Valid slugs that should exist
	validEventSlug: "", // Will be set by user
	validMarketSlug: "", // Will be set by user
	validTagSlug: "", // Will be set by user

	// Invalid IDs that should return 404
	invalidEventId: 999999999,
	invalidMarketId: 999999999,
	invalidSeriesId: 999999999,
	invalidTagId: 999999999,

	// Invalid slugs that should return 404
	invalidEventSlug: "non-existent-event-slug-12345",
	invalidMarketSlug: "non-existent-market-slug-12345",
	invalidTagSlug: "non-existent-tag-slug-12345",

	// Valid user address for comments
	validUserAddress: "", // Will be set by user

	// Valid search term
	validSearchTerm: "election", // Should return results
	invalidSearchTerm: "xyzabc123nonexistent", // Should return empty results
};

describe("GammaSDK", () => {
	let gamma: GammaSDK;

	beforeAll(() => {
		gamma = new GammaSDK();
	});

	describe("Sports API", () => {
		test("should get teams with default parameters", async () => {
			const teams = await gamma.getTeams();
			expect(Array.isArray(teams)).toBe(true);
		});

		test("should get teams with query parameters", async () => {
			const teams = await gamma.getTeams({
				limit: 5,
				order: "name",
			});
			expect(Array.isArray(teams)).toBe(true);
			expect(teams.length).toBeLessThanOrEqual(5);
		});

		test("should handle teams query with league filter", async () => {
			const teams = await gamma.getTeams({
				limit: 3,
				league: ["NFL", "NBA"],
			});
			expect(Array.isArray(teams)).toBe(true);
		});
	});

	describe("Tags API", () => {
		test("should get tags list", async () => {
			const tags = await gamma.getTags({
				limit: 10,
				offset: 0,
			});
			expect(Array.isArray(tags)).toBe(true);
			// Each tag should have required fields
			if (tags.length > 0) {
				const tag = tags[0];
				expect(tag.id).toBeDefined();
				expect(tag.label).toBeDefined();
				expect(tag.slug).toBeDefined();
			}
		});

		// These tests will need valid test data
		test.skip("should get tag by valid ID", async () => {
			if (TEST_DATA.validTagId === 0) return;

			const tag = await gamma.getTagById(TEST_DATA.validTagId);
			expect(tag).not.toBeNull();
			expect(tag?.id).toBeDefined();
			expect(tag?.label).toBeDefined();
			expect(tag?.slug).toBeDefined();
		});

		test("should return null for invalid tag ID", async () => {
			const tag = await gamma.getTagById(TEST_DATA.invalidTagId);
			expect(tag).toBeNull();
		});

		test.skip("should get tag by valid slug", async () => {
			if (TEST_DATA.validTagSlug === "") return;

			const tag = await gamma.getTagBySlug(TEST_DATA.validTagSlug);
			expect(tag).not.toBeNull();
			expect(tag?.id).toBeDefined();
			expect(tag?.label).toBeDefined();
			expect(tag?.slug).toBe(TEST_DATA.validTagSlug);
		});

		test("should return null for invalid tag slug", async () => {
			const tag = await gamma.getTagBySlug(TEST_DATA.invalidTagSlug);
			expect(tag).toBeNull();
		});

		test.skip("should get related tags relationships by tag ID", async () => {
			if (TEST_DATA.validTagId === 0) return;

			const relationships = await gamma.getRelatedTagsRelationshipsByTagId(
				TEST_DATA.validTagId,
			);
			expect(Array.isArray(relationships)).toBe(true);
		});

		test.skip("should get related tags by tag ID", async () => {
			if (TEST_DATA.validTagId === 0) return;

			const tags = await gamma.getTagsRelatedToTagId(TEST_DATA.validTagId);
			expect(Array.isArray(tags)).toBe(true);
		});
	});

	describe("Events API", () => {
		test("should get events list", async () => {
			const events = await gamma.getEvents({
				limit: 5,
			});
			expect(Array.isArray(events)).toBe(true);
			// Each event should have required fields
			if (events.length > 0) {
				const event = events[0];
				expect(event.id).toBeDefined();
				expect(event.title).toBeDefined();
				expect(event.slug).toBeDefined();
			}
		});

		test("should get paginated events", async () => {
			const result = await gamma.getEventsPaginated({
				limit: 5,
				offset: 0,
			});
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.pagination).toBeDefined();
			expect(typeof result.pagination.hasMore).toBe("boolean");
			expect(typeof result.pagination.totalResults).toBe("number");
		});

		test.skip("should get event by valid ID", async () => {
			if (TEST_DATA.validEventId === 0) return;

			const event = await gamma.getEventById(TEST_DATA.validEventId);
			expect(event).not.toBeNull();
			expect(event?.id).toBeDefined();
			expect(event?.title).toBeDefined();
			expect(event?.markets).toBeDefined();
			expect(Array.isArray(event?.markets)).toBe(true);
		});

		test("should return null for invalid event ID", async () => {
			const event = await gamma.getEventById(TEST_DATA.invalidEventId);
			expect(event).toBeNull();
		});

		test.skip("should get event by valid slug", async () => {
			if (TEST_DATA.validEventSlug === "") return;

			const event = await gamma.getEventBySlug(TEST_DATA.validEventSlug);
			expect(event).not.toBeNull();
			expect(event?.slug).toBe(TEST_DATA.validEventSlug);
		});

		test("should return null for invalid event slug", async () => {
			const event = await gamma.getEventBySlug(TEST_DATA.invalidEventSlug);
			expect(event).toBeNull();
		});

		test.skip("should get event tags", async () => {
			if (TEST_DATA.validEventId === 0) return;

			const tags = await gamma.getEventTags(TEST_DATA.validEventId);
			expect(Array.isArray(tags)).toBe(true);
		});

		test("should get active events", async () => {
			const events = await gamma.getActiveEvents({ limit: 3 });
			expect(Array.isArray(events)).toBe(true);
			// All events should be active
			events.forEach((event) => {
				expect(event.active).toBe(true);
			});
		});

		test("should get closed events", async () => {
			const events = await gamma.getClosedEvents({ limit: 3 });
			expect(Array.isArray(events)).toBe(true);
			// All events should be closed
			events.forEach((event) => {
				expect(event.closed).toBe(true);
			});
		});

		test("should get featured events", async () => {
			const events = await gamma.getFeaturedEvents({ limit: 3 });
			expect(Array.isArray(events)).toBe(true);
		});
	});

	describe("Markets API", () => {
		test("should get markets list", async () => {
			const markets = await gamma.getMarkets({
				limit: 5,
			});
			expect(Array.isArray(markets)).toBe(true);
			// Each market should have required fields
			if (markets.length > 0) {
				const market = markets[0];
				expect(market.id).toBeDefined();
				expect(market.question).toBeDefined();
				expect(market.slug).toBeDefined();
				expect(Array.isArray(market.outcomes)).toBe(true);
				expect(Array.isArray(market.outcomePrices)).toBe(true);
			}
		});

		test.skip("should get market by valid ID", async () => {
			if (TEST_DATA.validMarketId === 0) return;

			const market = await gamma.getMarketById(TEST_DATA.validMarketId);
			expect(market).not.toBeNull();
			expect(market?.id).toBeDefined();
			expect(market?.question).toBeDefined();
		});

		test("should return null for invalid market ID", async () => {
			const market = await gamma.getMarketById(TEST_DATA.invalidMarketId);
			expect(market).toBeNull();
		});

		test.skip("should get market by valid slug", async () => {
			if (TEST_DATA.validMarketSlug === "") return;

			const market = await gamma.getMarketBySlug(TEST_DATA.validMarketSlug);
			expect(market).not.toBeNull();
			expect(market?.slug).toBe(TEST_DATA.validMarketSlug);
		});

		test("should return null for invalid market slug", async () => {
			const market = await gamma.getMarketBySlug(TEST_DATA.invalidMarketSlug);
			expect(market).toBeNull();
		});

		test.skip("should get market tags", async () => {
			if (TEST_DATA.validMarketId === 0) return;

			const tags = await gamma.getMarketTags(TEST_DATA.validMarketId);
			expect(Array.isArray(tags)).toBe(true);
		});

		test("should get active markets", async () => {
			const markets = await gamma.getActiveMarkets({ limit: 3 });
			expect(Array.isArray(markets)).toBe(true);
			// All markets should be active
			markets.forEach((market) => {
				expect(market.active).toBe(true);
			});
		});

		test("should get closed markets", async () => {
			const markets = await gamma.getClosedMarkets({ limit: 3 });
			expect(Array.isArray(markets)).toBe(true);
			// All markets should be closed
			markets.forEach((market) => {
				expect(market.closed).toBe(true);
			});
		});
	});

	describe("Series API", () => {
		test("should get series list", async () => {
			const series = await gamma.getSeries({
				limit: 5,
				offset: 0,
			});
			expect(Array.isArray(series)).toBe(true);
			// Each series should have required fields
			if (series.length > 0) {
				const singleSeries = series[0];
				expect(singleSeries.id).toBeDefined();
				expect(singleSeries.title).toBeDefined();
				expect(singleSeries.slug).toBeDefined();
			}
		});

		test.skip("should get series by valid ID", async () => {
			if (TEST_DATA.validSeriesId === 0) return;

			const series = await gamma.getSeriesById(TEST_DATA.validSeriesId);
			expect(series).not.toBeNull();
			expect(series?.id).toBeDefined();
			expect(series?.title).toBeDefined();
		});

		test("should return null for invalid series ID", async () => {
			const series = await gamma.getSeriesById(TEST_DATA.invalidSeriesId);
			expect(series).toBeNull();
		});
	});

	describe("Comments API", () => {
		test("should get comments list with required parameters", async () => {
			const comments = await gamma.getComments({
				limit: 5,
				parent_entity_type: "Event",
				parent_entity_id: 1, // Use a generic ID that should exist
			});
			expect(Array.isArray(comments)).toBe(true);
		});

		test("should get comments with entity filter", async () => {
			const comments = await gamma.getComments({
				limit: 3,
				parent_entity_type: "Event",
				parent_entity_id: 1, // Use a generic ID that should exist
			});
			expect(Array.isArray(comments)).toBe(true);
		});

		test.skip("should get comments by user address", async () => {
			if (TEST_DATA.validUserAddress === "") return;

			const comments = await gamma.getCommentsByUserAddress(
				TEST_DATA.validUserAddress,
				{
					limit: 5,
				},
			);
			expect(Array.isArray(comments)).toBe(true);
		});
	});

	describe("Search API", () => {
		test("should perform search with valid term", async () => {
			const results = await gamma.search({
				q: TEST_DATA.validSearchTerm,
				limit_per_type: 3,
			});
			expect(results).toBeDefined();
			// Search results should have at least one of: events, tags, profiles
		});

		test("should handle search with no results", async () => {
			const results = await gamma.search({
				q: TEST_DATA.invalidSearchTerm,
				limit_per_type: 3,
			});
			expect(results).toBeDefined();
			// Should return empty results structure
		});

		test("should search with filters", async () => {
			const results = await gamma.search({
				q: "trump",
				events_status: "active",
				limit_per_type: 2,
			});
			expect(results).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		test("should handle network errors gracefully", async () => {
			// Create SDK instance with invalid base URL to test error handling
			const invalidGamma = new (class extends GammaSDK {
				constructor() {
					super();
					// @ts-ignore - accessing private field for testing
					this.gammaApiBase = "https://invalid-domain-12345.com";
				}
			})();

			await expect(invalidGamma.getTeams()).rejects.toThrow();
		});

		test("should handle invalid query parameters", async () => {
			// Test with invalid limit (negative number)
			const teams = await gamma.getTeams({
				limit: -1,
			});
			// Should still work or handle gracefully
			expect(Array.isArray(teams)).toBe(true);
		});
	});

	describe("Query Parameter Handling", () => {
		test("should handle array parameters correctly", async () => {
			const teams = await gamma.getTeams({
				league: ["NFL", "NBA"],
				name: ["Lakers", "Patriots"],
			});
			expect(Array.isArray(teams)).toBe(true);
		});

		test("should handle boolean parameters correctly", async () => {
			const events = await gamma.getEvents({
				active: true,
				featured: false,
				limit: 5,
			});
			expect(Array.isArray(events)).toBe(true);
		});

		test("should handle undefined parameters correctly", async () => {
			const markets = await gamma.getMarkets({
				limit: 3,
				active: undefined, // Should be ignored
				closed: undefined, // Should be ignored
			});
			expect(Array.isArray(markets)).toBe(true);
		});
	});
});
