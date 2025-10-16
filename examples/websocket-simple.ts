/**
 * Simple example of using the PolymarketWebSocketClient
 * 
 * This demonstrates the easiest way to subscribe to market data
 * using just your private key.
 */

import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { PolymarketWebSocketClient } from "../src/sdk";

async function main() {
	// Initialize CLOB client with your private key
	const host = "https://clob.polymarket.com";
	const signer = new Wallet(process.env.POLYMARKET_KEY!);
	const clobClient = new ClobClient(host, 137, signer);

	// Create WebSocket client with asset IDs to subscribe to
	const ws = new PolymarketWebSocketClient(clobClient, {
		assetIds: [
			"60487116984468020978247225474488676749601001829886755968952521846780452448915",
		],
		autoReconnect: true,
		debug: true,
	});

	// Register event handlers
	ws.on({
		onConnect: () => {
			console.log("✅ Connected to Polymarket WebSocket");
		},

		onBook: (msg) => {
			console.log(
				`📚 Book Update - Market: ${msg.market.substring(0, 10)}...`,
			);
			console.log(`   Bids: ${msg.bids.length}, Asks: ${msg.asks.length}`);
			
			if (msg.bids.length > 0) {
				const bestBid = msg.bids[msg.bids.length - 1];
				if (bestBid) {
					console.log(`   Best Bid: ${bestBid.price} (${bestBid.size})`);
				}
			}
			if (msg.asks.length > 0) {
				const bestAsk = msg.asks[0];
				if (bestAsk) {
					console.log(`   Best Ask: ${bestAsk.price} (${bestAsk.size})`);
				}
			}
		},

		onPriceChange: (msg) => {
			console.log(
				`💹 Price Change - ${msg.price_changes.length} change(s)`,
			);
			for (const change of msg.price_changes) {
				console.log(
					`   ${change.side} @ ${change.price} (size: ${change.size})`,
				);
			}
		},

		onTickSizeChange: (msg) => {
			console.log(
				`📏 Tick Size Changed: ${msg.old_tick_size} → ${msg.new_tick_size}`,
			);
		},

		onLastTradePrice: (msg) => {
			console.log(
				`💰 Trade: ${msg.side} @ ${msg.price} (size: ${msg.size})`,
			);
		},

		onError: (error) => {
			console.error("❌ WebSocket Error:", error.message);
		},

		onDisconnect: (code, reason) => {
			console.log(`👋 Disconnected: ${code} - ${reason}`);
		},

		onReconnect: (attempt) => {
			console.log(`🔄 Reconnecting... (attempt ${attempt})`);
		},
	});

	// Connect to WebSocket
	await ws.connect();

	console.log("📡 Listening for market data... Press Ctrl+C to exit");

	// Handle graceful shutdown
	process.on("SIGINT", () => {
		console.log("\n🛑 Shutting down...");
		ws.disconnect();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

