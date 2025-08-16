/**
 * Gamma API Routes
 *
 * This file handles all routes for the Polymarket Gamma API (https://gamma-api.polymarket.com).
 * Provides typed endpoints for markets and events with proper validation and error handling.
 * Uses the dedicated GammaSDK for credential-free API access.
 */

import { Elysia, t } from "elysia";
import { GammaSDK } from "../sdk/";
import {
	EventQuerySchema,
	EventSchema,
	MarketQuerySchema,
	MarketSchema,
} from "../types/elysia-schemas";

// Helper function to create SDK instance for Gamma API calls
function createGammaSDK(): GammaSDK {
	return new GammaSDK();
}

/**
 * Create Gamma API routes with proper typing and validation
 */
export const gammaRoutes = new Elysia({ prefix: "/gamma" })
	.get(
		"/markets",
		({ query }) => {
			const gammaSDK = createGammaSDK();
			return gammaSDK.getMarkets(query);
		},
		{
			query: MarketQuerySchema,
			response: {
				200: t.Array(MarketSchema),
				400: t.Object({
					error: t.String(),
					message: t.String(),
					details: t.Optional(t.String()),
				}),
				500: t.Object({
					error: t.String(),
					message: t.String(),
				}),
			},
			detail: {
				tags: ["Gamma API"],
				summary: "Get markets",
				description:
					"Retrieve markets from Gamma API with comprehensive filtering options including pagination (limit, offset), sorting (order, ascending), status filters (active, closed, archived), date ranges, liquidity/volume filters, and tag filtering.",
			},
		},
	)

	.get(
		"/events",
		async ({ query }) => {
			const gammaSDK = createGammaSDK();
			return await gammaSDK.getEvents(query);
		},
		{
			query: EventQuerySchema,
			response: {
				200: t.Array(EventSchema),
				400: t.Object({
					error: t.String(),
					message: t.String(),
					details: t.Optional(t.String()),
				}),
				500: t.Object({
					error: t.String(),
					message: t.String(),
				}),
			},
			detail: {
				tags: ["Gamma API"],
				summary: "Get events",
				description:
					"Retrieve events from Gamma API with comprehensive filtering options including pagination (limit, offset), sorting (order, ascending), status filters (active, closed, archived), date ranges, liquidity/volume filters, and tag filtering (tag, tag_id, tag_slug, related_tags).",
			},
		},
	);
