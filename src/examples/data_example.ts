/**
 * Example: Polymarket Data API — leaderboards.
 *
 * Usage:
 *   bun run src/examples/data_example.ts
 */

import { DataSDK } from "../sdk";

const data = new DataSDK();

// ── 1. Health check ───────────────────────────────────────────────────────────
console.log("1. Health check");
const health = await data.healthCheck();
console.log(`   ${health.data}`);

// ── 2. Trader leaderboard — top 5 by PnL this week ────────────────────────────
console.log("\n2. Trader leaderboard — top 5 by PnL this week");
const traders = await data.getTraderLeaderboard({
	category: "OVERALL",
	timePeriod: "WEEK",
	orderBy: "PNL",
	limit: 5,
});
for (const t of traders) {
	console.log(`   #${t.rank}  ${t.userName ?? t.proxyWallet ?? "anon"}  pnl=${t.pnl}  vol=${t.vol}`);
}

// ── 3. Trader leaderboard — top 5 by volume (all time) ────────────────────────
console.log("\n3. Trader leaderboard — top 5 by volume (all time)");
const volTraders = await data.getTraderLeaderboard({ timePeriod: "ALL", orderBy: "VOL", limit: 5 });
for (const t of volTraders) {
	console.log(`   #${t.rank}  vol=${t.vol}`);
}

// ── 4. Builder leaderboard ────────────────────────────────────────────────────
console.log("\n4. Builder leaderboard (this month, limit 5)");
const builders = await data.getAggregatedBuilderLeaderboard({ timePeriod: "MONTH", limit: 5 });
for (const b of builders) {
	console.log(`   #${b.rank}  ${b.builder ?? "unknown"}  volume=${b.volume}  active_users=${b.activeUsers}`);
}

// ── 5. Builder daily volume timeseries ────────────────────────────────────────
console.log("\n5. Builder daily volume timeseries (this week)");
const volumeSeries = await data.getDailyBuilderVolumeTimeSeries({ timePeriod: "WEEK" });
console.log(`   ${volumeSeries.length} entries`);
for (const entry of volumeSeries.slice(0, 3)) {
	console.log(`   ${entry.dt}  ${entry.builder}  volume=${entry.volume}`);
}
