/**
 * Polymarket Data API Examples
 *
 * This file contains comprehensive examples of how to use the Data API SDK
 * for fetching user data, positions, trades, activity, and market analytics.
 */

import { DataSDK } from "../src/sdk";

// Initialize the Data SDK
const data = new DataSDK();

// Example user address for demonstration
const EXAMPLE_USER = "0x9fc4da94a5175e9c1a0eaca45bb2d6f7a0d27bb2";

// Example market condition IDs for demonstration
const EXAMPLE_MARKETS = [
	"0x4d44a053a75c91b0c7a71b2f2e5c9c3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
	"0x5e55b064b76d81c1d8b72c3f3e6d9d3a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
];

// Example event ID for demonstration
const EXAMPLE_EVENT_ID = 12345;

/**
 * Health Check Example
 * Checks if the Data API is operational
 */
async function healthCheckExample() {
	console.log("=== Health Check Example ===");

	try {
		const health = await data.healthCheck();
		console.log("✅ Data API is healthy:", health.data);
	} catch (error) {
		console.error("❌ Health check failed:", error);
	}

	console.log("\n");
}

/**
 * User Positions Examples
 * Demonstrates fetching current and closed positions for a user
 */
async function userPositionsExample() {
	console.log("=== User Positions Example ===");

	try {
		// Get current positions
		console.log("Fetching current positions...");
		const currentPositions = await data.getCurrentPositions({
			user: EXAMPLE_USER,
			limit: 10,
			sortBy: "SIZE",
			sortDirection: "DESC",
		});

		console.log(`✅ Found ${currentPositions.length} current positions:`);
		currentPositions.forEach((position, index) => {
			console.log(
				`  ${index + 1}. ${position.market} - Size: ${position.size}, PnL: ${position.cashPnl}`,
			);
		});

		// Get closed positions
		console.log("\nFetching closed positions...");
		const closedPositions = await data.getClosedPositions({
			user: EXAMPLE_USER,
			limit: 10,
			sortBy: "REALIZEDPNL",
			sortDirection: "DESC",
		});

		console.log(`✅ Found ${closedPositions.length} closed positions:`);
		closedPositions.forEach((position, index) => {
			console.log(
				`  ${index + 1}. ${position.market} - Realized PnL: ${position.realizedPnl}`,
			);
		});

		// Get all positions (both current and closed)
		console.log("\nFetching all positions using convenience method...");
		const allPositions = await data.getAllPositions(EXAMPLE_USER, { limit: 5 });

		console.log(`✅ All positions summary:`);
		console.log(`  Current: ${allPositions.current.length}`);
		console.log(`  Closed: ${allPositions.closed.length}`);

	} catch (error) {
		console.error("❌ Positions fetch failed:", error);
	}

	console.log("\n");
}

/**
 * User Activity Example
 * Shows how to fetch user transaction history and activity
 */
async function userActivityExample() {
	console.log("=== User Activity Example ===");

	try {
		// Get all activity for a user
		console.log("Fetching user activity...");
		const activity = await data.getUserActivity({
			user: EXAMPLE_USER,
			limit: 20,
			sortBy: "TIMESTAMP",
			sortDirection: "DESC",
		});

		console.log(`✅ Found ${activity.length} activity entries:`);
		activity.slice(0, 5).forEach((entry, index) => {
			console.log(
				`  ${index + 1}. ${entry.type} ${entry.size} of ${entry.outcome} at ${entry.price}`,
			);
		});

		// Filter activity by type
		console.log("\nFetching BUY activity only...");
		const buyActivity = await data.getUserActivity({
			user: EXAMPLE_USER,
			type: "BUY",
			limit: 10,
		});

		console.log(`✅ Found ${buyActivity.length} BUY activities`);

		// Filter activity by date range
		console.log("\nFetching activity from last 30 days...");
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentActivity = await data.getUserActivity({
			user: EXAMPLE_USER,
			start: thirtyDaysAgo.toISOString(),
			limit: 15,
		});

		console.log(`✅ Found ${recentActivity.length} activities from last 30 days`);

	} catch (error) {
		console.error("❌ Activity fetch failed:", error);
	}

	console.log("\n");
}

/**
 * User Trades Example
 * Demonstrates fetching trade history for users and markets
 */
async function userTradesExample() {
	console.log("=== User Trades Example ===");

	try {
		// Get trades for a specific user
		console.log("Fetching trades for user...");
		const userTrades = await data.getTrades({
			user: EXAMPLE_USER,
			limit: 15,
			side: "BUY",
		});

		console.log(`✅ Found ${userTrades.length} BUY trades:`);
		userTrades.slice(0, 3).forEach((trade, index) => {
			console.log(
				`  ${index + 1}. ${trade.size} shares at ${trade.price} on ${trade.timestamp}`,
			);
		});

		// Get trades for specific markets
		console.log("\nFetching trades for specific markets...");
		const marketTrades = await data.getTrades({
			market: EXAMPLE_MARKETS,
			limit: 10,
		});

		console.log(`✅ Found ${marketTrades.length} trades for specified markets`);

	} catch (error) {
		console.error("❌ Trades fetch failed:", error);
	}

	console.log("\n");
}

/**
 * Market Holders Example
 * Shows how to fetch top holders for markets
 */
async function marketHoldersExample() {
	console.log("=== Market Holders Example ===");

	try {
		// Get top holders for markets
		console.log("Fetching top holders for markets...");
		const holders = await data.getTopHolders({
			market: EXAMPLE_MARKETS,
			limit: 20,
			minBalance: 5,
		});

		console.log(`✅ Found holders for ${holders.length} markets:`);
		holders.forEach((metaHolder, index) => {
			console.log(
				`  Market ${index + 1}: ${metaHolder.token} has ${metaHolder.holders.length} holders`,
			);

			// Show top 3 holders for each market
			metaHolder.holders.slice(0, 3).forEach((holder, holderIndex) => {
				console.log(
					`    ${holderIndex + 1}. ${holder.wallet}: ${holder.balance} shares (${holder.value})`,
				);
			});
		});

	} catch (error) {
		console.error("❌ Holders fetch failed:", error);
	}

	console.log("\n");
}

/**
 * Portfolio Analytics Example
 * Demonstrates portfolio valuation and analytics
 */
async function portfolioAnalyticsExample() {
	console.log("=== Portfolio Analytics Example ===");

	try {
		// Get total portfolio value
		console.log("Fetching portfolio value...");
		const totalValue = await data.getTotalValue({
			user: EXAMPLE_USER,
		});

		console.log("✅ Portfolio value:");
		totalValue.forEach((value) => {
			console.log(`  User: ${value.user}, Total Value: ${value.value}`);
		});

		// Get markets traded count
		console.log("\nFetching markets traded count...");
		const marketsTraded = await data.getTotalMarketsTraded({
			user: EXAMPLE_USER,
		});

		console.log(`✅ Markets traded: ${marketsTraded.traded}`);

		// Get complete portfolio summary
		console.log("\nFetching complete portfolio summary...");
		const portfolioSummary = await data.getPortfolioSummary(EXAMPLE_USER);

		console.log("✅ Portfolio Summary:");
		console.log(`  Total Value: ${portfolioSummary.totalValue[0]?.value || "N/A"}`);
		console.log(`  Markets Traded: ${portfolioSummary.marketsTraded.traded}`);
		console.log(`  Current Positions: ${portfolioSummary.currentPositions.length}`);

	} catch (error) {
		console.error("❌ Portfolio analytics failed:", error);
	}

	console.log("\n");
}

/**
 * Market Analytics Example
 * Shows market-level analytics like open interest and volume
 */
async function marketAnalyticsExample() {
	console.log("=== Market Analytics Example ===");

	try {
		// Get open interest for markets
		console.log("Fetching open interest...");
		const openInterest = await data.getOpenInterest({
			market: EXAMPLE_MARKETS,
		});

		console.log("✅ Open Interest:");
		openInterest.forEach((oi) => {
			console.log(`  ${oi.market}: ${oi.value}`);
		});

		// Get live volume for an event
		console.log("\nFetching live volume for event...");
		const liveVolume = await data.getLiveVolume({
			id: EXAMPLE_EVENT_ID,
		});

		console.log("✅ Live Volume:");
		console.log(`  Total Volume: ${liveVolume.total}`);
		console.log(`  Markets: ${liveVolume.markets.length}`);

		liveVolume.markets.slice(0, 3).forEach((market) => {
			console.log(`    ${market.market}: ${market.value}`);
		});

	} catch (error) {
		console.error("❌ Market analytics failed:", error);
	}

	console.log("\n");
}

/**
 * Advanced Filtering Example
 * Demonstrates advanced query options and filtering
 */
async function advancedFilteringExample() {
	console.log("=== Advanced Filtering Example ===");

	try {
		// Filter positions by size threshold
		console.log("Fetching large positions (> 100 shares)...");
		const largePositions = await data.getCurrentPositions({
			user: EXAMPLE_USER,
			sizeThreshold: 100,
			limit: 10,
		});

		console.log(`✅ Found ${largePositions.length} large positions`);

		// Filter positions by redeemable status
		console.log("\nFetching redeemable positions...");
		const redeemablePositions = await data.getCurrentPositions({
			user: EXAMPLE_USER,
			redeemable: true,
			limit: 10,
		});

		console.log(`✅ Found ${redeemablePositions.length} redeemable positions`);

		// Get activity with multiple filters
		console.log("\nFetching filtered activity (SELL, last 7 days)...");
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const filteredActivity = await data.getUserActivity({
			user: EXAMPLE_USER,
			type: "SELL",
			start: sevenDaysAgo.toISOString(),
			sortBy: "SIZE",
			sortDirection: "DESC",
			limit: 10,
		});

		console.log(`✅ Found ${filteredActivity.length} SELL activities from last 7 days`);

	} catch (error) {
		console.error("❌ Advanced filtering failed:", error);
	}

	console.log("\n");
}

/**
 * Error Handling Example
 * Demonstrates proper error handling for API calls
 */
async function errorHandlingExample() {
	console.log("=== Error Handling Example ===");

	try {
		// Try to get data for an invalid user
		console.log("Testing with invalid user address...");
		await data.getCurrentPositions({
			user: "0xinvalid",
			limit: 5,
		});
	} catch (error) {
		console.log("✅ Expected error caught for invalid user:", error.message);
	}

	try {
		// Try to get data with invalid market
		console.log("\nTesting with invalid market...");
		await data.getOpenInterest({
			market: ["0xinvalid"],
		});
	} catch (error) {
		console.log("✅ Expected error caught for invalid market:", error.message);
	}

	try {
		// Try to get data with invalid event ID
		console.log("\nTesting with invalid event ID...");
		await data.getLiveVolume({
			id: -1,
		});
	} catch (error) {
		console.log("✅ Expected error caught for invalid event ID:", error.message);
	}

	console.log("\n");
}

/**
 * Run all examples
 */
async function runAllExamples() {
	console.log("🚀 Starting Polymarket Data API Examples\n");

	await healthCheckExample();
	await userPositionsExample();
	await userActivityExample();
	await userTradesExample();
	await marketHoldersExample();
	await portfolioAnalyticsExample();
	await marketAnalyticsExample();
	await advancedFilteringExample();
	await errorHandlingExample();

	console.log("✅ All examples completed!");
}

// Run examples if this file is executed directly
if (require.main === module) {
	runAllExamples().catch(console.error);
}

export {
	healthCheckExample,
	userPositionsExample,
	userActivityExample,
	userTradesExample,
	marketHoldersExample,
	portfolioAnalyticsExample,
	marketAnalyticsExample,
	advancedFilteringExample,
	errorHandlingExample,
	runAllExamples,
};