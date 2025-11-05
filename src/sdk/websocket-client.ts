import type { ClobClient } from "@polymarket/clob-client";
import WebSocket from "ws";
import type {
	MarketChannelMessage,
	BookMessage,
	PriceChangeMessage,
	TickSizeChangeMessage,
	LastTradePriceMessage,
} from "../types/websocket-schemas";
import {
	parseMarketChannelMessage,
	safeParseMarketChannelMessage,
	isBookMessage,
	isPriceChangeMessage,
	isTickSizeChangeMessage,
	isLastTradePriceMessage,
} from "../types/websocket-schemas";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com";
const PING_INTERVAL = 10000; // 10 seconds

export interface WebSocketClientOptions {
	/**
	 * Asset IDs to subscribe to
	 */
	assetIds?: string[];

	/**
	 * Market condition IDs to subscribe to (for user channel)
	 */
	markets?: string[];

	/**
	 * Whether to auto-reconnect on disconnect
	 * @default true
	 */
	autoReconnect?: boolean;

	/**
	 * Reconnection delay in milliseconds
	 * @default 5000
	 */
	reconnectDelay?: number;

	/**
	 * Maximum number of reconnection attempts
	 * @default Infinity
	 */
	maxReconnectAttempts?: number;

	/**
	 * Enable debug logging
	 * @default false
	 */
	debug?: boolean;
}

export type MessageHandler<T = MarketChannelMessage> = (message: T) => void;

export interface WebSocketClientCallbacks {
	onBook?: MessageHandler<BookMessage>;
	onPriceChange?: MessageHandler<PriceChangeMessage>;
	onTickSizeChange?: MessageHandler<TickSizeChangeMessage>;
	onLastTradePrice?: MessageHandler<LastTradePriceMessage>;
	onMessage?: MessageHandler<MarketChannelMessage>;
	onError?: (error: Error) => void;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onReconnect?: (attempt: number) => void;
}

/**
 * WebSocket client for Polymarket market data
 *
 * @example
 * ```typescript
 * import { PolymarketWebSocketClient } from "@hk/polymarket";
 *
 * const ws = new PolymarketWebSocketClient(clobClient, {
 *   assetIds: ["60487116984468020978247225474488676749601001829886755968952521846780452448915"],
 *   debug: true,
 * });
 *
 * ws.on({
 *   onBook: (msg) => console.log("Book update:", msg.bids.length, msg.asks.length),
 *   onPriceChange: (msg) => console.log("Price change:", msg.price_changes.length),
 * });
 *
 * await ws.connect();
 * ```
 */
export class PolymarketWebSocketClient {
	private clobClient: ClobClient;
	private options: Required<WebSocketClientOptions>;
	private callbacks: WebSocketClientCallbacks = {};
	private ws: WebSocket | null = null;
	private pingInterval: NodeJS.Timeout | null = null;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private reconnectAttempts = 0;
	private isConnecting = false;
	private shouldReconnect = true;

	constructor(clobClient: ClobClient, options: WebSocketClientOptions = {}) {
		this.clobClient = clobClient;
		this.options = {
			assetIds: options.assetIds || [],
			markets: options.markets || [],
			autoReconnect: options.autoReconnect ?? true,
			reconnectDelay: options.reconnectDelay ?? 5000,
			maxReconnectAttempts:
				options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY,
			debug: options.debug ?? false,
		};
	}

	/**
	 * Register event handlers
	 */
	public on(callbacks: WebSocketClientCallbacks): this {
		this.callbacks = { ...this.callbacks, ...callbacks };
		return this;
	}

	/**
	 * Connect to the WebSocket server
	 */
	public async connect(): Promise<void> {
		if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
			this.log("Already connected or connecting");
			return;
		}

		this.isConnecting = true;
		this.shouldReconnect = true;

		try {
			// Derive API credentials if needed
			const apiKey = await this.clobClient.deriveApiKey();
			this.log("API key derived:", apiKey.key);

			// Create WebSocket connection
			const fullUrl = `${WS_URL}/ws/market`;
			this.ws = new WebSocket(fullUrl);

			this.setupEventHandlers(apiKey);
		} catch (error) {
			this.isConnecting = false;
			const err = error instanceof Error ? error : new Error(String(error));
			this.handleError(err);
			throw err;
		}
	}

	/**
	 * Disconnect from the WebSocket server
	 */
	public disconnect(): void {
		this.shouldReconnect = false;
		this.cleanup();

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Subscribe to additional asset IDs
	 */
	public subscribe(assetIds: string[]): void {
		this.options.assetIds.push(...assetIds);

		if (this.ws?.readyState === WebSocket.OPEN) {
			this.sendSubscription();
		}
	}

	/**
	 * Unsubscribe from asset IDs
	 */
	public unsubscribe(assetIds: string[]): void {
		this.options.assetIds = this.options.assetIds.filter(
			(id) => !assetIds.includes(id),
		);
	}

	/**
	 * Check if connected
	 */
	public isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	private setupEventHandlers(apiKey: {
		key: string;
		secret: string;
		passphrase: string;
	}): void {
		if (!this.ws) return;

		this.ws.on("open", () => {
			this.log("WebSocket connected");
			this.isConnecting = false;
			this.reconnectAttempts = 0;

			// Send subscription message
			this.sendSubscription();

			// Start ping interval
			this.pingInterval = setInterval(() => {
				if (this.ws?.readyState === WebSocket.OPEN) {
					this.ws.send("PING");
					this.log("Sent PING");
				}
			}, PING_INTERVAL);

			this.callbacks.onConnect?.();
		});

		this.ws.on("message", (data: WebSocket.Data) => {
			this.handleMessage(data);
		});

		this.ws.on("error", (error: Error) => {
			this.log("WebSocket error:", error);
			this.handleError(error);
		});

		this.ws.on("close", (code: number, reason: Buffer) => {
			const reasonStr = reason.toString();
			this.log("WebSocket closed:", code, reasonStr);
			this.isConnecting = false;
			this.cleanup();

			this.callbacks.onDisconnect?.(code, reasonStr);

			if (this.shouldReconnect && this.options.autoReconnect) {
				this.scheduleReconnect();
			}
		});
	}

	private sendSubscription(): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

		const message = JSON.stringify({
			assets_ids: this.options.assetIds,
			type: "market",
		});

		this.ws.send(message);
		this.log("Sent subscription:", message);
	}

	private handleMessage(data: WebSocket.Data): void {
		const messageStr = data.toString();

		// Handle PONG
		if (messageStr === "PONG") {
			this.log("Received PONG");
			return;
		}

		try {
			const rawData = JSON.parse(messageStr);

			// Handle array of messages
			if (Array.isArray(rawData)) {
				for (const msgData of rawData) {
					this.processMessage(msgData);
				}
			} else {
				// Single message
				this.processMessage(rawData);
			}
		} catch (error) {
			this.log("Failed to parse JSON:", error);
			this.handleError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	private processMessage(msgData: unknown): void {
		// Safe parse with validation
		const result = safeParseMarketChannelMessage(msgData);

		if (!result.success) {
			this.log("Validation failed:", result.error.issues);
			this.handleError(
				new Error(`Message validation failed: ${result.error.message}`),
			);
			return;
		}

		const msg = result.data;

		// Call specific handlers based on message type
		if (isBookMessage(msg)) {
			this.callbacks.onBook?.(msg);
		} else if (isPriceChangeMessage(msg)) {
			this.callbacks.onPriceChange?.(msg);
		} else if (isTickSizeChangeMessage(msg)) {
			this.callbacks.onTickSizeChange?.(msg);
		} else if (isLastTradePriceMessage(msg)) {
			this.callbacks.onLastTradePrice?.(msg);
		}

		// Call general message handler
		this.callbacks.onMessage?.(msg);
	}

	private handleError(error: Error): void {
		this.callbacks.onError?.(error);
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
			this.log("Max reconnect attempts reached");
			return;
		}

		this.reconnectAttempts++;
		this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}...`);

		this.callbacks.onReconnect?.(this.reconnectAttempts);

		this.reconnectTimeout = setTimeout(() => {
			this.log(`Attempting reconnect ${this.reconnectAttempts}...`);
			this.connect().catch((error) => {
				this.log("Reconnect failed:", error);
			});
		}, this.options.reconnectDelay);
	}

	private cleanup(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	private log(...args: unknown[]): void {
		if (this.options.debug) {
			console.log("[PolymarketWebSocket]", ...args);
		}
	}
}
