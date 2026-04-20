import { describe, test, expect, beforeAll } from "bun:test";
import { ClobPublicClient } from "../clob-public-client";
import { getMarketFixture, type MarketFixture } from "../../__tests__/fixtures/market";

describe("ClobPublicClient", () => {
	let client: ClobPublicClient;
	let fixture: MarketFixture;

	beforeAll(async () => {
		client = new ClobPublicClient();
		fixture = await getMarketFixture();
		console.log("[fixture] conditionId:", fixture.conditionId);
		console.log("[fixture] tokenId:", `${fixture.tokenId.slice(0, 16)}...`);
	});

	test("getServerTime returns a recent unix timestamp", async () => {
		const result = await client.getServerTime();
		expect(typeof result.time).toBe("number");
		expect(result.time).toBeGreaterThan(1_700_000_000);
	});

	test("getTickSize returns minimum_tick_size as string", async () => {
		const result = await client.getTickSize(fixture.tokenId);
		expect(typeof result.minimum_tick_size).toBe("string");
		expect(Number(result.minimum_tick_size)).toBeGreaterThan(0);
	});

	test("getFeeRate returns base_fee", async () => {
		const result = await client.getFeeRate(fixture.tokenId);
		expect(result.base_fee).toBeDefined();
	});

	test("getNegRisk returns a boolean", async () => {
		const result = await client.getNegRisk(fixture.tokenId);
		expect(typeof result.neg_risk).toBe("boolean");
	});

	test("getLastTradePrice returns price for token", async () => {
		const result = await client.getLastTradePrice(fixture.tokenId);
		expect(result).toBeDefined();
	});

	test("getLastTradesPrices returns array", async () => {
		const result = await client.getLastTradesPrices([
			{ token_id: fixture.tokenId },
			{ token_id: fixture.secondTokenId },
		]);
		expect(Array.isArray(result)).toBe(true);
	});

	test("getClobMarketInfo returns market with token array", async () => {
		const result = await client.getClobMarketInfo(fixture.conditionId);
		expect(result).toBeDefined();
		expect(Array.isArray(result.t)).toBe(true);
		expect(result.c).toBe(fixture.conditionId);
	});

	test("getMarketByToken resolves token to condition_id", async () => {
		const result = await client.getMarketByToken(fixture.tokenId);
		expect(result.condition_id).toBe(fixture.conditionId);
	});
});
