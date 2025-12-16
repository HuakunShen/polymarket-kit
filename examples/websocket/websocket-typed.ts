import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { GammaSDK, PolymarketWebSocketClient } from "../../src/sdk";
import {
	isBookMessage,
	isPriceChangeMessage,
	isTickSizeChangeMessage,
	isLastTradePriceMessage,
	type BookMessage,
	type PriceChangeMessage,
	type TickSizeChangeMessage,
	type LastTradePriceMessage,
} from "../../src/types/websocket-schemas";

const host = "https://clob.polymarket.com";
const signer = new Wallet(process.env.POLYMARKET_KEY!);
const clobClient = new ClobClient(host, 137, signer);

async function main() {
	// Initialize Gamma SDK to fetch recent events
	const gammaSdk = new GammaSDK();
	const events = await gammaSdk.getActiveEvents({ limit: 10, closed: false });
	// Flatten clobTokenIds arrays properly - each market has an array of token IDs
	const clobTokens = events.flatMap((evt) =>
		evt.markets.flatMap((market) => market.clobTokenIds)
	);
	
	if (!clobTokens?.length || clobTokens.length === 0) {
		throw new Error("No clob tokens found");
	}
	
	// Limit to first 5 tokens to avoid overwhelming connection
	const assetIds = clobTokens.slice(0, 5);

	// Create WebSocket client using PolymarketWebSocketClient
	const ws = new PolymarketWebSocketClient(clobClient, {
		assetIds,
		autoReconnect: true,
		debug: true,
	});

	// Register event handlers
	ws.on({
		onConnect: () => {
			console.log("WebSocket connected for market channel");
			console.log(`Subscribed to ${assetIds.length} tokens from recent events`);
		},

		onBook: (msg: BookMessage) => {
			handleBookMessage(msg);
		},

		onPriceChange: (msg: PriceChangeMessage) => {
			handlePriceChangeMessage(msg);
		},

		onTickSizeChange: (msg: TickSizeChangeMessage) => {
			handleTickSizeChangeMessage(msg);
		},

		onLastTradePrice: (msg: LastTradePriceMessage) => {
			handleLastTradePriceMessage(msg);
		},

		onError: (error) => {
			console.error("WebSocket Error:", error);
			process.exit(1);
		},

		onDisconnect: (code, reason) => {
			console.log("WebSocket closed:", code, reason);
			process.exit(0);
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

function handleBookMessage(msg: BookMessage, index?: number) {
	const prefix = index !== undefined ? `[${index}] ` : "";

	console.log(
		`${prefix}📚 Book Update - Market: ${msg.market.substring(0, 10)}..., ` +
			`Asset: ${msg.asset_id.substring(0, 10)}..., ` +
			`Bids: ${msg.bids.length}, Asks: ${msg.asks.length}, ` +
			`Hash: ${msg.hash.substring(0, 10)}...`,
	);

	// Access top of book
	if (msg.bids.length > 0) {
		const bestBid = msg.bids[msg.bids.length - 1];
		console.log(`  Best Bid: ${bestBid?.price} (${bestBid?.size})`);
	}
	if (msg.asks.length > 0) {
		const bestAsk = msg.asks[0];
		console.log(`  Best Ask: ${bestAsk?.price} (${bestAsk?.size})`);
	}
}

function handlePriceChangeMessage(msg: PriceChangeMessage, index?: number) {
	const prefix = index !== undefined ? `[${index}] ` : "";

	console.log(
		`${prefix}💹 Price Change - Market: ${msg.market.substring(0, 10)}..., ` +
			`Changes: ${msg.price_changes.length}`,
	);

	for (const change of msg.price_changes) {
		console.log(
			`    ${change.side} @ ${change.price} (size: ${change.size}) - ` +
				`Best Bid: ${change.best_bid}, Best Ask: ${change.best_ask}`,
		);
	}
}

function handleTickSizeChangeMessage(msg: TickSizeChangeMessage, index?: number) {
	const prefix = index !== undefined ? `[${index}] ` : "";

	console.log(
		`${prefix}📏 Tick Size Change - Market: ${msg.market.substring(0, 10)}..., ` +
			`${msg.old_tick_size} -> ${msg.new_tick_size}`,
	);
}

function handleLastTradePriceMessage(msg: LastTradePriceMessage, index?: number) {
	const prefix = index !== undefined ? `[${index}] ` : "";

	console.log(
		`${prefix}💰 Trade - Market: ${msg.market.substring(0, 10)}..., ` +
			`${msg.side} @ ${msg.price} (size: ${msg.size})`,
	);
}

// Run the main function
main().catch(console.error);

