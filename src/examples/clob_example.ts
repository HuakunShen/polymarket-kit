/**
 * Example: Polymarket CLOB Public API — market data without authentication.
 *
 * Usage:
 *   bun run src/examples/clob_example.ts
 */

import { ClobPublicClient } from "../sdk";

const clob = new ClobPublicClient();

// ── 1. Server time ────────────────────────────────────────────────────────────
console.log("1. Server time");
const time = await clob.getServerTime();
console.log(`   unix=${time.time}  (${new Date(time.time * 1000).toISOString()})`);

// Bootstrap: get an active token ID from sampling-simplified-markets
const samplingResp = await fetch(
	"https://clob.polymarket.com/sampling-simplified-markets?next_cursor=MA==",
);
const samplingData = (await samplingResp.json()) as {
	data: Array<{
		condition_id: string;
		tokens: Array<{ token_id: string }>;
		active: boolean;
		accepting_orders: boolean;
	}>;
};
const market = samplingData.data.find(
	(m) => m.active && m.accepting_orders && m.tokens.length >= 2,
);
if (!market) {
	console.error("No active CLOB market found — cannot continue.");
	process.exit(1);
}

const { condition_id: conditionId, tokens } = market;
const tokenId = tokens[0]!.token_id;
const secondTokenId = tokens[1]!.token_id;

console.log(`\nUsing conditionId: ${conditionId}`);
console.log(`       tokenId:     ${tokenId.slice(0, 20)}...`);

// ── 2. Tick size ──────────────────────────────────────────────────────────────
console.log("\n2. Tick size");
const tickSize = await clob.getTickSize(tokenId);
console.log(`   minimum_tick_size=${tickSize.minimum_tick_size}`);

// ── 3. Fee rate ───────────────────────────────────────────────────────────────
console.log("\n3. Fee rate");
const feeRate = await clob.getFeeRate(tokenId);
console.log(`   base_fee=${feeRate.base_fee}`);

// ── 4. Neg risk ───────────────────────────────────────────────────────────────
console.log("\n4. Neg risk");
const negRisk = await clob.getNegRisk(tokenId);
console.log(`   neg_risk=${negRisk.neg_risk}`);

// ── 5. Last trade price ───────────────────────────────────────────────────────
console.log("\n5. Last trade price");
const lastPrice = await clob.getLastTradePrice(tokenId);
console.log(`   price=${JSON.stringify(lastPrice)}`);

// ── 6. Batch last trade prices ────────────────────────────────────────────────
console.log("\n6. Batch last trade prices");
const prices = await clob.getLastTradesPrices([
	{ token_id: tokenId },
	{ token_id: secondTokenId },
]);
console.log(`   ${prices.length} prices returned`);
for (const p of prices) {
	console.log(`   ${JSON.stringify(p)}`);
}

// ── 7. CLOB market info ───────────────────────────────────────────────────────
console.log("\n7. CLOB market info");
const marketInfo = await clob.getClobMarketInfo(conditionId);
console.log(`   condition_id=${marketInfo.c}`);
console.log(`   tokens: ${marketInfo.t?.length ?? 0}`);

// ── 8. Market by token ────────────────────────────────────────────────────────
console.log("\n8. Market by token");
const byToken = await clob.getMarketByToken(tokenId);
console.log(`   condition_id=${byToken.condition_id}`);
