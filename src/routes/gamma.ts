/**
 * Gamma API Routes
 *
 * This file handles all routes for the Polymarket Gamma API (https://gamma-api.polymarket.com).
 * Provides typed endpoints for all available Gamma API operations including health checks,
 * sports, tags, events, markets, series, comments, and search functionality.
 * Uses the dedicated GammaSDK for credential-free API access.
 */

import { Elysia, t } from "elysia";
import { GammaSDK, type ProxyConfigType } from "../sdk/";
import { formatEventToMarkdown } from "../utils/markdown-formatters";
import {
	// Sports
	TeamSchema,
	TeamQuerySchema,
	// Tags
	UpdatedTagSchema,
	TagQuerySchema,
	TagByIdQuerySchema,
	RelatedTagRelationshipSchema,
	RelatedTagsQuerySchema,
	// Events
	EventSchema,
	UpdatedEventQuerySchema,
	PaginatedEventQuerySchema,
	EventByIdQuerySchema,
	MarkdownOptionsSchema,
	// Markets
	MarketSchema,
	UpdatedMarketQuerySchema,
	MarketByIdQuerySchema,
	// Series
	SeriesSchema,
	SeriesQuerySchema,
	SeriesByIdQuerySchema,
	// Comments
	CommentSchema,
	CommentQuerySchema,
	CommentByIdQuerySchema,
	CommentsByUserQuerySchema,
	// Search
	SearchQuerySchema,
	SearchResponseSchema,
	// Error responses
	ErrorResponseSchema,
	GammaErrorResponseSchema,
} from "../types/elysia-schemas";

/**
 * Parse proxy string into ProxyConfigType
 * Supports formats like:
 * - http://proxy.com:8080
 * - http://user:pass@proxy.com:8080
 * - https://proxy.com:3128
 */
function parseProxyString(proxyString: string): ProxyConfigType {
	try {
		const url = new URL(proxyString);
		const config: ProxyConfigType = {
			protocol: url.protocol.slice(0, -1) as "http" | "https",
			host: url.hostname,
			port: parseInt(url.port, 10),
		};

		if (url.username) {
			config.username = decodeURIComponent(url.username);
		}
		if (url.password) {
			config.password = decodeURIComponent(url.password);
		}

		return config;
	} catch (_error) {
		throw new Error(`Invalid proxy URL format: ${proxyString}`);
	}
}

/**
 * Create Gamma API routes with proper typing and validation for all available endpoints
 */
export const gammaRoutes = new Elysia({ prefix: "/gamma" })
	// Middleware to create GammaSDK instance based on proxy header
	.derive(({ headers }) => {
		const proxyHeader = headers["x-http-proxy"];

		let gammaSDK: GammaSDK;
		if (proxyHeader) {
			try {
				const proxyConfig = parseProxyString(proxyHeader);
				gammaSDK = new GammaSDK({ proxy: proxyConfig });
			} catch (error) {
				// If proxy parsing fails, create SDK without proxy and log warning
				console.warn(`Invalid proxy header format: ${proxyHeader}`, error);
				gammaSDK = new GammaSDK();
			}
		} else {
			gammaSDK = new GammaSDK();
		}

		return {
			gammaSDK,
		};
	})

	// Sports API
	.get(
		"/teams",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getTeams(query);
		},
		{
			query: TeamQuerySchema,
			response: {
				200: t.Array(TeamSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Sports"],
				summary: "Get teams",
				description:
					"Retrieve sports teams with optional filtering by league, name, or abbreviation",
			},
		},
	)

	// Tags API
	.get(
		"/tags",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getTags(query);
		},
		{
			query: TagQuerySchema,
			response: {
				200: t.Array(UpdatedTagSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get tags",
				description: "Retrieve tags with pagination and filtering options",
			},
		},
	)

	.get(
		"/tags/:id",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getTagById(Number(params.id), query);
			if (result === null) {
				set.status = 404;
				return { type: "not found error", error: "id not found" };
			}
			return result;
		},
		{
			params: t.Object({ id: t.String() }),
			query: TagByIdQuerySchema,
			response: {
				200: UpdatedTagSchema,
				404: GammaErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get tag by ID",
				description: "Retrieve a specific tag by its ID",
			},
		},
	)

	.get(
		"/tags/slug/:slug",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getTagBySlug(params.slug, query);
			if (result === null) {
				set.status = 404;
				return { type: "not found error", error: "slug not found" };
			}
			return result;
		},
		{
			params: t.Object({ slug: t.String() }),
			query: TagByIdQuerySchema,
			response: {
				200: UpdatedTagSchema,
				404: GammaErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get tag by slug",
				description: "Retrieve a specific tag by its slug",
			},
		},
	)

	.get(
		"/tags/:id/related-tags",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getRelatedTagsRelationshipsByTagId(
				Number(params.id),
				query,
			);
		},
		{
			params: t.Object({ id: t.String() }),
			query: RelatedTagsQuerySchema,
			response: {
				200: t.Array(RelatedTagRelationshipSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get related tags relationships by tag ID",
				description: "Retrieve related tag relationships for a specific tag ID",
			},
		},
	)

	.get(
		"/tags/slug/:slug/related-tags",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getRelatedTagsRelationshipsByTagSlug(
				params.slug,
				query,
			);
		},
		{
			params: t.Object({ slug: t.String() }),
			query: RelatedTagsQuerySchema,
			response: {
				200: t.Array(RelatedTagRelationshipSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get related tags relationships by tag slug",
				description:
					"Retrieve related tag relationships for a specific tag slug",
			},
		},
	)

	.get(
		"/tags/:id/related-tags/tags",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getTagsRelatedToTagId(Number(params.id), query);
		},
		{
			params: t.Object({ id: t.String() }),
			query: RelatedTagsQuerySchema,
			response: {
				200: t.Array(UpdatedTagSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get tags related to a tag ID",
				description: "Retrieve actual tag objects related to a specific tag ID",
			},
		},
	)

	.get(
		"/tags/slug/:slug/related-tags/tags",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getTagsRelatedToTagSlug(params.slug, query);
		},
		{
			params: t.Object({ slug: t.String() }),
			query: RelatedTagsQuerySchema,
			response: {
				200: t.Array(UpdatedTagSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Tags"],
				summary: "Get tags related to a tag slug",
				description:
					"Retrieve actual tag objects related to a specific tag slug",
			},
		},
	)

	// Events API
	.get(
		"/events",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getEvents(query);
		},
		{
			query: UpdatedEventQuerySchema,
			response: {
				200: t.Array(EventSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get events",
				description: "Retrieve events with comprehensive filtering options",
			},
		},
	)

	.get(
		"/events/pagination",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getEventsPaginated(query);
		},
		{
			query: PaginatedEventQuerySchema,
			response: {
				200: t.Object({
					data: t.Array(EventSchema),
					pagination: t.Object({
						hasMore: t.Boolean(),
						totalResults: t.Number(),
					}),
				}),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get paginated events",
				description: "Retrieve events with pagination metadata",
			},
		},
	)

	.get(
		"/events/:id",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getEventById(Number(params.id), query);
			if (result === null) {
				set.status = 404;
				return { type: "not found error", error: "id not found" };
			}
			return result;
		},
		{
			params: t.Object({ id: t.String() }),
			query: EventByIdQuerySchema,
			response: {
				200: EventSchema,
				404: GammaErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get event by ID",
				description: "Retrieve a specific event by its ID",
			},
		},
	)

	.get(
		"/events/:id/tags",
		async ({ params, gammaSDK }) => {
			return await gammaSDK.getEventTags(Number(params.id));
		},
		{
			params: t.Object({ id: t.String() }),
			response: {
				200: t.Array(UpdatedTagSchema),
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get event tags",
				description: "Retrieve tags associated with a specific event",
			},
		},
	)

	.get(
		"/events/slug/:slug",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getEventBySlug(params.slug, query);
			if (result === null) {
				set.status = 404;
				return { error: "Not Found", message: "Event not found" };
			}
			return result;
		},
		{
			params: t.Object({ slug: t.String() }),
			query: EventByIdQuerySchema,
			response: {
				200: EventSchema,
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get event by slug",
				description: "Retrieve a specific event by its slug",
			},
		},
	)

	.get(
		"/events/:id/markdown",
		async ({ params, query, set, headers, gammaSDK }) => {
			const { verbose, include_markets, ...eventQuery } = query;
			const result = await gammaSDK.getEventById(Number(params.id), eventQuery);
			if (result === null) {
				set.status = 404;
				return { error: "Not Found", message: "Event not found" };
			}

			const markdownOptions = {
				verbose: verbose as 0 | 1 | 2 | undefined,
				includeMarkets: include_markets,
			};
			const markdown = formatEventToMarkdown(result, markdownOptions);

			// Check Accept header to determine response format
			const acceptHeader = headers.accept || "";
			const wantsJson = acceptHeader.includes("application/json");

			if (wantsJson) {
				return { markdown };
			} else {
				set.headers["content-type"] = "text/plain; charset=utf-8";
				return markdown;
			}
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Composite([EventByIdQuerySchema, MarkdownOptionsSchema]),
			response: {
				200: t.Union([
					t.Object({
						markdown: t.String({
							description: "Event data formatted as markdown for LLM analysis",
						}),
					}),
					t.String({ description: "Raw markdown content" }),
				]),
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get event as markdown by ID",
				description:
					"Convert event data to markdown format optimized for LLM arbitrage analysis. Supports verbose levels (0-2) and include_markets flag. Returns JSON if Accept: application/json, otherwise plain markdown text.",
			},
		},
	)

	.get(
		"/events/slug/:slug/markdown",
		async ({ params, query, set, headers, gammaSDK }) => {
			const { verbose, include_markets, ...eventQuery } = query;
			const result = await gammaSDK.getEventBySlug(params.slug, eventQuery);
			if (result === null) {
				set.status = 404;
				return { error: "Not Found", message: "Event not found" };
			}

			const markdownOptions = {
				verbose: verbose as 0 | 1 | 2 | undefined,
				includeMarkets: include_markets,
			};
			const markdown = formatEventToMarkdown(result, markdownOptions);

			// Check Accept header to determine response format
			const acceptHeader = headers.accept || "";
			const wantsJson = acceptHeader.includes("application/json");

			if (wantsJson) {
				return { markdown };
			} else {
				set.headers["content-type"] = "text/plain; charset=utf-8";
				return markdown;
			}
		},
		{
			params: t.Object({ slug: t.String() }),
			query: t.Composite([EventByIdQuerySchema, MarkdownOptionsSchema]),
			response: {
				200: t.Union([
					t.Object({
						markdown: t.String({
							description: "Event data formatted as markdown for LLM analysis",
						}),
					}),
					t.String({ description: "Raw markdown content" }),
				]),
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Events"],
				summary: "Get event as markdown by slug",
				description:
					"Convert event data to markdown format optimized for LLM arbitrage analysis. Supports verbose levels (0-2) and include_markets flag. Returns JSON if Accept: application/json, otherwise plain markdown text.",
			},
		},
	)

	// Markets API
	.get(
		"/markets",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getMarkets(query);
		},
		{
			query: UpdatedMarketQuerySchema,
			response: {
				200: t.Array(MarketSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Markets"],
				summary: "Get markets",
				description: "Retrieve markets with comprehensive filtering options",
			},
		},
	)

	.get(
		"/markets/:id",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getMarketById(Number(params.id), query);
			if (result === null) {
				set.status = 404;
				return { type: "not found error", error: "id not found" };
			}
			return result;
		},
		{
			params: t.Object({ id: t.String() }),
			query: MarketByIdQuerySchema,
			response: {
				200: MarketSchema,
				404: GammaErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Markets"],
				summary: "Get market by ID",
				description: "Retrieve a specific market by its ID",
			},
		},
	)

	.get(
		"/markets/:id/tags",
		async ({ params, gammaSDK }) => {
			return await gammaSDK.getMarketTags(Number(params.id));
		},
		{
			params: t.Object({ id: t.String() }),
			response: {
				200: t.Array(UpdatedTagSchema),
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Markets"],
				summary: "Get market tags",
				description: "Retrieve tags associated with a specific market",
			},
		},
	)

	.get(
		"/markets/slug/:slug",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getMarketBySlug(params.slug, query);
			if (result === null) {
				set.status = 404;
				return { error: "Not Found", message: "Market not found" };
			}
			return result;
		},
		{
			params: t.Object({ slug: t.String() }),
			query: MarketByIdQuerySchema,
			response: {
				200: MarketSchema,
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Markets"],
				summary: "Get market by slug",
				description: "Retrieve a specific market by its slug",
			},
		},
	)

	// Series API
	.get(
		"/series",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getSeries(query);
		},
		{
			query: SeriesQuerySchema,
			response: {
				200: t.Array(SeriesSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Series"],
				summary: "Get series",
				description: "Retrieve series with filtering and pagination",
			},
		},
	)

	.get(
		"/series/:id",
		async ({ params, query, set, gammaSDK }) => {
			const result = await gammaSDK.getSeriesById(Number(params.id), query);
			if (result === null) {
				set.status = 404;
				return { error: "Not Found", message: "Series not found" };
			}
			return result;
		},
		{
			params: t.Object({ id: t.String() }),
			query: SeriesByIdQuerySchema,
			response: {
				200: SeriesSchema,
				404: ErrorResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Series"],
				summary: "Get series by ID",
				description: "Retrieve a specific series by its ID",
			},
		},
	)

	// Comments API
	.get(
		"/comments",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.getComments(query);
		},
		{
			query: CommentQuerySchema,
			response: {
				200: t.Array(CommentSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Comments"],
				summary: "Get comments",
				description:
					"Retrieve comments with optional filtering by entity type and ID",
			},
		},
	)

	.get(
		"/comments/:id",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getCommentsByCommentId(Number(params.id), query);
		},
		{
			params: t.Object({ id: t.String() }),
			query: CommentByIdQuerySchema,
			response: {
				200: t.Array(CommentSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Comments"],
				summary: "Get comments by comment ID",
				description: "Retrieve comments related to a specific comment ID",
			},
		},
	)

	.get(
		"/comments/user_address/:userAddress",
		async ({ params, query, gammaSDK }) => {
			return await gammaSDK.getCommentsByUserAddress(params.userAddress, query);
		},
		{
			params: t.Object({ userAddress: t.String() }),
			query: CommentsByUserQuerySchema,
			response: {
				200: t.Array(CommentSchema),
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Comments"],
				summary: "Get comments by user address",
				description: "Retrieve comments made by a specific user address",
			},
		},
	)

	// Search API
	.get(
		"/search",
		async ({ query, gammaSDK }) => {
			return await gammaSDK.search(query);
		},
		{
			query: SearchQuerySchema,
			response: {
				200: SearchResponseSchema,
				500: ErrorResponseSchema,
			},
			detail: {
				tags: ["Gamma API - Search"],
				summary: "Search markets, events, and profiles",
				description:
					"Perform a comprehensive search across markets, events, and user profiles",
			},
		},
	);
