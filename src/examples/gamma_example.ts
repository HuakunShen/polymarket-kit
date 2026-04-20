/**
 * Example: Polymarket Gamma API — events, markets, and keyset pagination.
 *
 * Usage:
 *   bun run src/examples/gamma_example.ts
 */

import { GammaSDK } from "../sdk";

const gamma = new GammaSDK();

// ── 1. Active events ──────────────────────────────────────────────────────────
console.log("1. Active events (limit 3)");
const events = await gamma.getActiveEvents({ limit: 3 });
for (const e of events) {
	console.log(`   [${e.id}] ${e.title} — markets: ${e.markets?.length ?? 0}`);
}

// ── 2. Event by ID and slug ───────────────────────────────────────────────────
if (events[0]) {
	const first = events[0];

	console.log(`\n2. Event by ID: ${first.id}`);
	const byId = await gamma.getEventById(Number(first.id));
	if (byId) console.log(`   ${byId.title}`);

	console.log(`\n3. Event by slug: ${first.slug}`);
	const bySlug = await gamma.getEventBySlug(first.slug);
	if (bySlug) console.log(`   ${bySlug.title}`);
}

// ── 3. Active markets ─────────────────────────────────────────────────────────
console.log("\n4. Active markets (limit 3)");
const markets = await gamma.getActiveMarkets({ limit: 3 });
for (const m of markets) {
	console.log(`   [${m.id}] ${m.question.slice(0, 60)}`);
}

// ── 4. Keyset pagination — events ─────────────────────────────────────────────
console.log("\n5. Events keyset pagination");
const page1 = await gamma.getEventsKeyset({ limit: 3, active: true });
console.log(`   Page 1: ${page1.data.length} events, next_cursor=${JSON.stringify(page1.next_cursor)}`);

if (page1.next_cursor) {
	const page2 = await gamma.getEventsKeyset({ limit: 3, after_cursor: page1.next_cursor });
	console.log(`   Page 2: ${page2.data.length} events, next_cursor=${JSON.stringify(page2.next_cursor)}`);

	const ids1 = new Set(page1.data.map((e) => e.id));
	const overlap = page2.data.filter((e) => ids1.has(e.id)).length;
	console.log(`   Overlap: ${overlap} (expected 0)`);
}

// ── 5. Keyset pagination — markets ────────────────────────────────────────────
console.log("\n6. Markets keyset pagination");
const mpage1 = await gamma.getMarketsKeyset({ limit: 3, active: true });
console.log(`   Page 1: ${mpage1.data.length} markets, next_cursor=${JSON.stringify(mpage1.next_cursor)}`);

if (mpage1.next_cursor) {
	const mpage2 = await gamma.getMarketsKeyset({ limit: 3, after_cursor: mpage1.next_cursor });
	console.log(`   Page 2: ${mpage2.data.length} markets`);
}

// ── 6. Tags ───────────────────────────────────────────────────────────────────
console.log("\n7. Tags (limit 5)");
const tags = await gamma.getTags({ limit: 5 });
for (const tag of tags) {
	console.log(`   ${tag.label} (${tag.slug})`);
}
