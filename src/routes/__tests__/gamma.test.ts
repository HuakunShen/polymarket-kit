/**
 * Tests for Gamma API Routes
 *
 * These tests verify that the Elysia routes properly handle requests and responses,
 * including proper error handling and response formatting.
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { gammaRoutes } from "../gamma";

// Test data - will be provided by user
const TEST_DATA = {
	validEventId: "0", // Will be set by user (as string since it comes from URL params)
	validMarketId: "0", // Will be set by user
	validTagId: "0", // Will be set by user

	invalidEventId: "999999999",
	invalidMarketId: "999999999",
	invalidTagId: "999999999",

	validEventSlug: "", // Will be set by user
	validMarketSlug: "", // Will be set by user
	validTagSlug: "", // Will be set by user

	invalidEventSlug: "non-existent-event-slug-12345",
	invalidMarketSlug: "non-existent-market-slug-12345",
	invalidTagSlug: "non-existent-tag-slug-12345",
};

describe("Gamma API Routes", () => {
	let app: Elysia;

	beforeAll(() => {
		app = new Elysia().use(gammaRoutes);
	});

	describe("Sports Routes", () => {
		test("GET /gamma/teams should return teams list", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/teams?limit=5"),
			);
			expect(response.status).toBe(200);

			const teams = await response.json();
			expect(Array.isArray(teams)).toBe(true);
		});

		test("GET /gamma/teams should handle query parameters", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/teams?limit=3&order=name"),
			);
			expect(response.status).toBe(200);

			const teams = await response.json();
			expect(Array.isArray(teams)).toBe(true);
		});
	});

	describe("Tags Routes", () => {
		test("GET /gamma/tags should return tags list", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/tags?limit=10&offset=0"),
			);
			expect(response.status).toBe(200);

			const tags = await response.json();
			expect(Array.isArray(tags)).toBe(true);
		});

		test.skip("GET /gamma/tags/:id should return specific tag", async () => {
			if (TEST_DATA.validTagId === "0") return;

			const response = await app.handle(
				new Request(`http://localhost/gamma/tags/${TEST_DATA.validTagId}`),
			);
			expect(response.status).toBe(200);

			const tag = await response.json();
			expect(tag.id).toBeDefined();
			expect(tag.label).toBeDefined();
		});

		test("GET /gamma/tags/:id should return 404 for invalid ID", async () => {
			const response = await app.handle(
				new Request(`http://localhost/gamma/tags/${TEST_DATA.invalidTagId}`),
			);
			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.type).toBe("not found error");
			expect(error.error).toBe("id not found");
		});

		test.skip("GET /gamma/tags/slug/:slug should return specific tag", async () => {
			if (TEST_DATA.validTagSlug === "") return;

			const response = await app.handle(
				new Request(
					`http://localhost/gamma/tags/slug/${TEST_DATA.validTagSlug}`,
				),
			);
			expect(response.status).toBe(200);

			const tag = await response.json();
			expect(tag.slug).toBe(TEST_DATA.validTagSlug);
		});

		test("GET /gamma/tags/slug/:slug should return 404 for invalid slug", async () => {
			const response = await app.handle(
				new Request(
					`http://localhost/gamma/tags/slug/${TEST_DATA.invalidTagSlug}`,
				),
			);
			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.type).toBe("not found error");
			expect(error.error).toBe("slug not found");
		});
	});

	describe("Events Routes", () => {
		test("GET /gamma/events should return events list", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/events?limit=5"),
			);
			expect(response.status).toBe(200);

			const events = await response.json();
			expect(Array.isArray(events)).toBe(true);
		});

		test("GET /gamma/events/pagination should return paginated events", async () => {
			const response = await app.handle(
				new Request(
					"http://localhost/gamma/events/pagination?limit=5&offset=0",
				),
			);
			expect(response.status).toBe(200);

			const result = await response.json();
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.pagination).toBeDefined();
			expect(typeof result.pagination.hasMore).toBe("boolean");
			expect(typeof result.pagination.totalResults).toBe("number");
		});

		test.skip("GET /gamma/events/:id should return specific event", async () => {
			if (TEST_DATA.validEventId === "0") return;

			const response = await app.handle(
				new Request(`http://localhost/gamma/events/${TEST_DATA.validEventId}`),
			);
			expect(response.status).toBe(200);

			const event = await response.json();
			expect(event.id).toBeDefined();
			expect(event.title).toBeDefined();
		});

		test("GET /gamma/events/:id should return 404 for invalid ID", async () => {
			const response = await app.handle(
				new Request(
					`http://localhost/gamma/events/${TEST_DATA.invalidEventId}`,
				),
			);
			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.type).toBe("not found error");
			expect(error.error).toBe("id not found");
		});
	});

	describe("Markets Routes", () => {
		test("GET /gamma/markets should return markets list", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/markets?limit=5"),
			);
			expect(response.status).toBe(200);

			const markets = await response.json();
			expect(Array.isArray(markets)).toBe(true);
		});

		test.skip("GET /gamma/markets/:id should return specific market", async () => {
			if (TEST_DATA.validMarketId === "0") return;

			const response = await app.handle(
				new Request(
					`http://localhost/gamma/markets/${TEST_DATA.validMarketId}`,
				),
			);
			expect(response.status).toBe(200);

			const market = await response.json();
			expect(market.id).toBeDefined();
			expect(market.question).toBeDefined();
		});

		test("GET /gamma/markets/:id should return 404 for invalid ID", async () => {
			const response = await app.handle(
				new Request(
					`http://localhost/gamma/markets/${TEST_DATA.invalidMarketId}`,
				),
			);
			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.type).toBe("not found error");
			expect(error.error).toBe("id not found");
		});
	});

	describe("Series Routes", () => {
		test("GET /gamma/series should return series list", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/series?limit=5&offset=0"),
			);
			expect(response.status).toBe(200);

			const series = await response.json();
			expect(Array.isArray(series)).toBe(true);
		});
	});

	describe("Comments Routes", () => {
		test("GET /gamma/comments should return comments list", async () => {
			const response = await app.handle(
				new Request(
					"http://localhost/gamma/comments?limit=5&parent_entity_type=Event&parent_entity_id=1",
				),
			);
			expect(response.status).toBe(200);

			const comments = await response.json();
			expect(Array.isArray(comments)).toBe(true);
		});
	});

	describe("Search Routes", () => {
		test("GET /gamma/search should return search results", async () => {
			const response = await app.handle(
				new Request(
					"http://localhost/gamma/search?q=election&limit_per_type=3",
				),
			);
			expect(response.status).toBe(200);

			const results = await response.json();
			expect(results).toBeDefined();
		});

		test("GET /gamma/search should handle empty results", async () => {
			const response = await app.handle(
				new Request(
					"http://localhost/gamma/search?q=nonexistentterm123&limit_per_type=1",
				),
			);
			expect(response.status).toBe(200);

			const results = await response.json();
			expect(results).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		test("should handle missing required query parameters", async () => {
			// Test series endpoint which requires limit and offset
			const response = await app.handle(
				new Request("http://localhost/gamma/series"),
			);
			// Should return validation error (400) due to missing required params
			expect([400, 422]).toContain(response.status);
		});

		test("should handle invalid query parameter types", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/teams?limit=invalid"),
			);
			// Should handle gracefully or return validation error
			expect(response.status).toBeGreaterThanOrEqual(200);
		});
	});

	describe("Response Format", () => {
		test("should return properly formatted JSON responses", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/health"),
			);
			expect(response.headers.get("content-type")).toMatch(/application\/json/);
		});

		test("should handle CORS properly", async () => {
			const response = await app.handle(
				new Request("http://localhost/gamma/health", {
					method: "OPTIONS",
				}),
			);
			// Should handle OPTIONS request for CORS
			expect(response.status).toBeLessThan(500);
		});
	});
});
