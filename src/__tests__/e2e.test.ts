import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../server";
import { getMarketFixture, type MarketFixture } from "./fixtures/market";

describe("E2E API Routes", () => {
	let baseUrl: string;
	let fixture: MarketFixture;

	beforeAll(async () => {
		app.listen(0);
		const port = app.server?.port;
		baseUrl = `http://localhost:${port}`;
		fixture = await getMarketFixture();
		console.log(`[e2e] server on port ${port}`);
		console.log("[e2e] conditionId:", fixture.conditionId);
	});

	afterAll(() => {
		app.stop();
	});

	const get = async (path: string) => {
		const res = await fetch(`${baseUrl}${path}`);
		return res.json();
	};

	const post = async (path: string, body: unknown) => {
		const res = await fetch(`${baseUrl}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return res.json();
	};

	// ── CLOB public (no auth) ────────────────────────────────────────────────

	describe("CLOB – public (no auth)", () => {
		test("GET /clob/time returns server timestamp", async () => {
			const data = await get("/clob/time");
			expect(typeof data.time).toBe("number");
			expect(data.time).toBeGreaterThan(1_700_000_000);
		});

		test("GET /clob/tick-size/:tokenId", async () => {
			const data = await get(`/clob/tick-size/${fixture.tokenId}`);
			expect(typeof data.minimum_tick_size).toBe("string");
		});

		test("GET /clob/fee-rate/:tokenId", async () => {
			const data = await get(`/clob/fee-rate/${fixture.tokenId}`);
			expect(data.base_fee).toBeDefined();
		});

		test("GET /clob/neg-risk/:tokenId", async () => {
			const data = await get(`/clob/neg-risk/${fixture.tokenId}`);
			expect(typeof data.neg_risk).toBe("boolean");
		});

		test("GET /clob/last-trade-price?token_id=...", async () => {
			const data = await get(`/clob/last-trade-price?token_id=${fixture.tokenId}`);
			expect(data).toBeDefined();
		});

		test("POST /clob/last-trades-prices returns array", async () => {
			const data = await post("/clob/last-trades-prices", [
				{ token_id: fixture.tokenId },
				{ token_id: fixture.secondTokenId },
			]);
			expect(Array.isArray(data)).toBe(true);
		});

		test("GET /clob/clob-markets/:conditionId", async () => {
			const data = await get(`/clob/clob-markets/${fixture.conditionId}`);
			expect(Array.isArray(data.t)).toBe(true);
		});

		test("GET /clob/markets-by-token/:tokenId", async () => {
			const data = await get(`/clob/markets-by-token/${fixture.tokenId}`);
			expect(data.condition_id).toBe(fixture.conditionId);
		});
	});

	// ── Gamma ────────────────────────────────────────────────────────────────

	describe("Gamma routes", () => {
		test("GET /gamma/events returns array", async () => {
			const data = await get("/gamma/events?limit=3");
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThan(0);
		});

		test("GET /gamma/events/id/:id returns correct event", async () => {
			const data = await get(`/gamma/events/id/${fixture.eventId}`);
			expect(data.id).toBe(fixture.eventId);
			expect(data.slug).toBe(fixture.eventSlug);
		});

		test("GET /gamma/markets/id/:id returns correct market", async () => {
			const data = await get(`/gamma/markets/id/${fixture.marketId}`);
			expect(data.id).toBe(fixture.marketId);
		});
	});

	// ── Data – no auth needed ────────────────────────────────────────────────

	describe("Data routes – no auth", () => {
		test("GET /data/health returns ok", async () => {
			const data = await get("/data/health");
			expect(data).toBeDefined();
		});

		test("GET /data/leaderboard/traders returns array", async () => {
			const data = await get("/data/leaderboard/traders?limit=5");
			expect(Array.isArray(data)).toBe(true);
		});

		test("GET /data/leaderboard/builders returns array", async () => {
			const data = await get("/data/leaderboard/builders?limit=5");
			expect(Array.isArray(data)).toBe(true);
		});
	});
});
