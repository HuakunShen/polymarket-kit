import { GammaSDK } from "../../sdk";

export interface MarketFixture {
	// CLOB data — sourced from sampling-simplified-markets (guaranteed active on CLOB)
	conditionId: string;
	tokenId: string;
	secondTokenId: string;
	// Gamma data — sourced independently from Gamma API
	eventId: string;
	marketId: string;
	eventSlug: string;
	marketSlug: string;
}

let _fixture: MarketFixture | null = null;

/**
 * Returns a MarketFixture with:
 * - CLOB fields sourced from /sampling-simplified-markets (guaranteed to be on CLOB)
 * - Gamma fields sourced from the Gamma events/markets API
 *
 * The two halves are independent — they may not refer to the same event.
 * Cached after first call.
 */
export async function getMarketFixture(): Promise<MarketFixture> {
	if (_fixture) return _fixture;

	// ── CLOB half: get the first active market from sampling-simplified-markets ──
	const clobResp = await fetch(
		"https://clob.polymarket.com/sampling-simplified-markets?next_cursor=MA==",
	);
	if (!clobResp.ok) throw new Error(`CLOB sampling endpoint returned ${clobResp.status}`);
	const clobData = (await clobResp.json()) as {
		data: Array<{
			condition_id: string;
			tokens: Array<{ token_id: string }>;
			active: boolean;
			accepting_orders: boolean;
		}>;
	};

	const clobMarket = clobData.data?.find(
		(m) => m.active && m.accepting_orders && m.tokens.length >= 2,
	);
	if (!clobMarket) throw new Error("No active CLOB market found in sampling-simplified-markets");

	const conditionId = clobMarket.condition_id;
	const tokenId = clobMarket.tokens[0]!.token_id;
	const secondTokenId = clobMarket.tokens[1]!.token_id;

	// ── Gamma half: get any active event and its first market ──────────────────
	const gamma = new GammaSDK();
	const events = await gamma.getActiveEvents({ limit: 5 });

	let eventId = "";
	let eventSlug = "";
	let marketId = "";
	let marketSlug = "";

	for (const event of events) {
		if (!event.id || !event.slug) continue;
		const market = event.markets?.find((m) => m.id && m.slug);
		if (market) {
			eventId = event.id;
			eventSlug = event.slug;
			marketId = market.id;
			marketSlug = market.slug;
			break;
		}
	}
	if (!eventId || !marketId) throw new Error("No active Gamma event with markets found");

	_fixture = { conditionId, tokenId, secondTokenId, eventId, marketId, eventSlug, marketSlug };
	return _fixture;
}
