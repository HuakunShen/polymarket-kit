import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import WebSocket from "ws";
import {
	parseMarketChannelMessage,
	safeParseMarketChannelMessage,
	isBookMessage,
	isPriceChangeMessage,
	isTickSizeChangeMessage,
	isLastTradePriceMessage,
	type MarketChannelMessage,
} from "../../src/types/websocket-schemas";

const host = "https://clob.polymarket.com";
const signer = new Wallet(process.env.POLYMARKET_KEY!);
const clobClient = new ClobClient(host, 137, signer);

const MARKET_CHANNEL = "market";
const WS_URL = "wss://ws-subscriptions-clob.polymarket.com";

async function main() {
	// Derive API credentials
	const apiKey = await clobClient.deriveApiKey();
	console.log("Derived API Key:", apiKey.key);

	// WebSocket configuration
	const assetIds = [
		"60487116984468020978247225474488676749601001829886755968952521846780452448915",
	];

	const auth = {
		apiKey: apiKey.key,
		secret: apiKey.secret,
		passphrase: apiKey.passphrase,
	};

	// Create WebSocket connection
	const fullUrl = `${WS_URL}/ws/${MARKET_CHANNEL}`;
	const ws = new WebSocket(fullUrl);

	ws.on("open", () => {
		console.log("WebSocket connected for market channel");

		// Send subscription message
		const message = JSON.stringify({
			assets_ids: assetIds,
			type: MARKET_CHANNEL,
		});
		ws.send(message);

		// Start ping interval
		setInterval(() => {
			ws.send("PING");
		}, 10000);
	});

	ws.on("message", (data: WebSocket.Data) => {
		const messageStr = data.toString();

		// Handle PONG
		if (messageStr === "PONG") {
			console.log("Received PONG");
			return;
		}

		try {
			// Parse raw JSON
			const rawData = JSON.parse(messageStr);

			// Handle array of messages
			if (Array.isArray(rawData)) {
				for (const [index, msgData] of rawData.entries()) {
					handleMessage(msgData, index);
				}
			} else {
				// Single message
				handleMessage(rawData);
			}
		} catch (error) {
			console.error("Failed to parse JSON:", error);
			console.log("Raw message:", messageStr);
		}
	});

	ws.on("error", (error: Error) => {
		console.error("WebSocket Error:", error);
		process.exit(1);
	});

	ws.on("close", (code: number, reason: string) => {
		console.log("WebSocket closed:", code, reason);
		process.exit(0);
	});
}

function handleMessage(msgData: unknown, index?: number) {
	const prefix = index !== undefined ? `[${index}] ` : "";

	// Safe parse with validation
	const result = safeParseMarketChannelMessage(msgData);

	if (!result.success) {
		console.error(`${prefix}Failed to validate message:`, result.error.issues);
		console.log("Raw message:", JSON.stringify(msgData, null, 2));
		return;
	}

	const msg: MarketChannelMessage = result.data;

	// Type-safe message handling using discriminated union
	if (isBookMessage(msg)) {
		console.log(
			`${prefix}📚 Book Update - Market: ${msg.market.substring(0, 10)}..., ` +
				`Asset: ${msg.asset_id.substring(0, 10)}..., ` +
				`Bids: ${msg.bids.length}, Asks: ${msg.asks.length}, ` +
				`Hash: ${msg.hash.substring(0, 10)}...`,
		);

		// Access top of book
		if (msg.bids.length > 0) {
			const bestBid = msg.bids[msg.bids.length - 1];
			console.log(`  Best Bid: ${bestBid.price} (${bestBid.size})`);
		}
		if (msg.asks.length > 0) {
			const bestAsk = msg.asks[0];
			console.log(`  Best Ask: ${bestAsk.price} (${bestAsk.size})`);
		}
	} else if (isPriceChangeMessage(msg)) {
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
	} else if (isTickSizeChangeMessage(msg)) {
		console.log(
			`${prefix}📏 Tick Size Change - Market: ${msg.market.substring(0, 10)}..., ` +
				`${msg.old_tick_size} -> ${msg.new_tick_size}`,
		);
	} else if (isLastTradePriceMessage(msg)) {
		console.log(
			`${prefix}💰 Trade - Market: ${msg.market.substring(0, 10)}..., ` +
				`${msg.side} @ ${msg.price} (size: ${msg.size})`,
		);
	}
}

// Run the main function
main().catch(console.error);

