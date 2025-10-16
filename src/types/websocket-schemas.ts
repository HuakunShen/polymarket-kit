import { z } from "zod";

/**
 * WebSocket Market Channel Message Schemas
 * Based on: https://docs.polymarket.com/developers/CLOB/websocket/market-channel
 */

// Order Summary (price level in orderbook)
export const OrderSummarySchema = z.object({
	price: z.string(),
	size: z.string(),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

// Book Message - Full orderbook snapshot or update
export const BookMessageSchema = z.object({
	event_type: z.literal("book"),
	asset_id: z.string(),
	market: z.string(),
	timestamp: z.string(),
	hash: z.string(),
	bids: z.array(OrderSummarySchema),
	asks: z.array(OrderSummarySchema),
});

export type BookMessage = z.infer<typeof BookMessageSchema>;

// Price Change - Individual price level change
export const PriceChangeSchema = z.object({
	asset_id: z.string(),
	price: z.string(),
	size: z.string(),
	side: z.enum(["BUY", "SELL"]),
	hash: z.string(),
	best_bid: z.string(),
	best_ask: z.string(),
});

export type PriceChange = z.infer<typeof PriceChangeSchema>;

// Price Change Message - One or more price level changes
export const PriceChangeMessageSchema = z.object({
	event_type: z.literal("price_change"),
	market: z.string(),
	price_changes: z.array(PriceChangeSchema),
	timestamp: z.string(),
});

export type PriceChangeMessage = z.infer<typeof PriceChangeMessageSchema>;

// Tick Size Change Message - Minimum tick size update
export const TickSizeChangeMessageSchema = z.object({
	event_type: z.literal("tick_size_change"),
	asset_id: z.string(),
	market: z.string(),
	old_tick_size: z.string(),
	new_tick_size: z.string(),
	timestamp: z.string(),
});

export type TickSizeChangeMessage = z.infer<typeof TickSizeChangeMessageSchema>;

// Last Trade Price Message - Trade execution event
export const LastTradePriceMessageSchema = z.object({
	event_type: z.literal("last_trade_price"),
	asset_id: z.string(),
	market: z.string(),
	price: z.string(),
	side: z.enum(["BUY", "SELL"]),
	size: z.string(),
	fee_rate_bps: z.string(),
	timestamp: z.string(),
});

export type LastTradePriceMessage = z.infer<typeof LastTradePriceMessageSchema>;

// Union of all market channel message types
export const MarketChannelMessageSchema = z.discriminatedUnion("event_type", [
	BookMessageSchema,
	PriceChangeMessageSchema,
	TickSizeChangeMessageSchema,
	LastTradePriceMessageSchema,
]);

export type MarketChannelMessage = z.infer<typeof MarketChannelMessageSchema>;

// Helper function to parse and validate WebSocket messages
export function parseMarketChannelMessage(data: unknown): MarketChannelMessage {
	return MarketChannelMessageSchema.parse(data);
}

// Safe parse that returns success/error
export function safeParseMarketChannelMessage(data: unknown) {
	return MarketChannelMessageSchema.safeParse(data);
}

// Type guards for message types
export function isBookMessage(msg: MarketChannelMessage): msg is BookMessage {
	return msg.event_type === "book";
}

export function isPriceChangeMessage(
	msg: MarketChannelMessage,
): msg is PriceChangeMessage {
	return msg.event_type === "price_change";
}

export function isTickSizeChangeMessage(
	msg: MarketChannelMessage,
): msg is TickSizeChangeMessage {
	return msg.event_type === "tick_size_change";
}

export function isLastTradePriceMessage(
	msg: MarketChannelMessage,
): msg is LastTradePriceMessage {
	return msg.event_type === "last_trade_price";
}

