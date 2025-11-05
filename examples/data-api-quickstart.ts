/**
 * Polymarket Data API Quickstart Example
 *
 * This is a simple getting started example for the Data API SDK.
 * It demonstrates the most common use cases.
 */

import { DataSDK } from "../src/sdk";

// Initialize the Data SDK
const data = new DataSDK();

// User wallet address for demonstration
const USER_ADDRESS = "0x9fc4da94a5175e9c1a0eaca45bb2d6f7a0d27bb2";

async function quickstart() {
	console.log("🚀 Polymarket Data API Quickstart\n");

	// 1. Check API health
	console.log("1. Checking API health...");
	try {
		const health = await data.healthCheck();
		console.log("✅ API Status:", health.data);
	} catch (error) {
		console.error("❌ API health check failed:", error);
		return;
	}

	// 2. Get user's current positions
	console.log("\n2. Fetching current positions...");
	try {
		const positions = await data.getCurrentPositions({
			user: USER_ADDRESS,
			limit: 5,
		});

		console.log(`✅ Found ${positions.length} current positions:`);
		positions.forEach((position, index) => {
			console.log(
				`  ${index + 1}. ${position.outcome}: ${position.size} shares (PnL: ${position.cashPnl})`,
			);
		});
	} catch (error) {
		console.error("❌ Failed to fetch positions:", error.message);
	}

	// 3. Get recent user activity
	console.log("\n3. Fetching recent activity...");
	try {
		const activity = await data.getUserActivity({
			user: USER_ADDRESS,
			limit: 10,
			sortBy: "TIMESTAMP",
			sortDirection: "DESC",
		});

		console.log(`✅ Found ${activity.length} recent activities:`);
		activity.slice(0, 3).forEach((entry, index) => {
			console.log(
				`  ${index + 1}. ${entry.type} ${entry.size} of ${entry.outcome}`,
			);
		});
	} catch (error) {
		console.error("❌ Failed to fetch activity:", error.message);
	}

	// 4. Get portfolio summary
	console.log("\n4. Getting portfolio summary...");
	try {
		const portfolio = await data.getPortfolioSummary(USER_ADDRESS);

		console.log("✅ Portfolio Summary:");
		console.log(`  Total Value: ${portfolio.totalValue[0]?.value || "N/A"}`);
		console.log(`  Markets Traded: ${portfolio.marketsTraded.traded}`);
		console.log(`  Active Positions: ${portfolio.currentPositions.length}`);
	} catch (error) {
		console.error("❌ Failed to get portfolio summary:", error.message);
	}

	console.log("\n✅ Quickstart completed!");
}

// Run if executed directly
if (require.main === module) {
	quickstart().catch(console.error);
}

export { quickstart };