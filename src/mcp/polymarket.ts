/**
 * Polymarket MCP Server
 *
 * A Model Context Protocol server for Polymarket's Gamma API that exposes
 * prediction market data and functionality as standardized tools and resources
 * for AI models. Enables natural language interactions with market data.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { GammaSDK } from "../sdk/index.js";
import { formatEventToMarkdown } from "../utils/markdown-formatters.js";
import type {
	MarketType,
	EventType,
	UpdatedTagType,
	SearchResponseType,
	UpdatedMarketQueryType,
	UpdatedEventQueryType,
	TagQueryType,
	SearchQueryType,
	EventByIdQueryType,
	MarketByIdQueryType,
} from "../types/elysia-schemas.js";

// Initialize GammaSDK instance
const gammaSDK = new GammaSDK();

// Create MCP server instance
export const server = new McpServer({
	name: "polymarket",
	version: "1.0.0",
	capabilities: {
		resources: {
			subscribe: true,
			listChanged: true,
		},
		tools: {
			subscribe: true,
			listChanged: true,
		},
	},
});

// Helper function to handle API errors gracefully
function handleApiError(error: unknown, context: string) {
	console.error(`Error in ${context}:`, error);

	if (error instanceof Error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Failed to ${context.toLowerCase()}: ${error.message}`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: "text" as const,
				text: `Failed to ${context.toLowerCase()}: Unknown error occurred`,
			},
		],
	};
}

// Helper function to format market data for display
function formatMarketDisplay(markets: MarketType[]): string {
	if (markets.length === 0) {
		return "No markets found.";
	}

	const marketList = markets
		.map((market, index) => {
			const statusInfo = [];
			if (market.active) statusInfo.push("Active");
			if (market.closed) statusInfo.push("Closed");

			const volumeInfo = market.volumeNum
				? `$${market.volumeNum.toLocaleString()}`
				: market.volume;
			const outcomeInfo =
				market.outcomes && market.outcomePrices
					? market.outcomes
							.map(
								(outcome, i) =>
									`${outcome}: $${market.outcomePrices[i] || "N/A"}`,
							)
							.join(", ")
					: "";

			return [
				`${index + 1}. **${market.question}**`,
				`   - ID: ${market.id}`,
				`   - Status: ${statusInfo.join(", ") || "Unknown"}`,
				`   - Volume: ${volumeInfo}`,
				outcomeInfo ? `   - Outcomes: ${outcomeInfo}` : "",
				`   - Slug: ${market.slug}`,
				"",
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n");

	return `Found ${markets.length} market(s):\n\n${marketList}`;
}

// Helper function to format event data for display
function formatEventDisplay(events: EventType[]): string {
	if (events.length === 0) {
		return "No events found.";
	}

	const eventList = events
		.map((event, index) => {
			const statusInfo = [];
			if (event.active) statusInfo.push("Active");
			if (event.closed) statusInfo.push("Closed");
			if (event.featured) statusInfo.push("Featured");
			if (event.archived) statusInfo.push("Archived");

			const volumeInfo = `$${event.volume.toLocaleString()}`;
			const marketCount = event.markets ? event.markets.length : 0;

			return [
				`${index + 1}. **${event.title}**`,
				`   - ID: ${event.id}`,
				`   - Status: ${statusInfo.join(", ") || "Unknown"}`,
				`   - Volume: ${volumeInfo}`,
				`   - Markets: ${marketCount}`,
				`   - Period: ${event.startDate || "TBD"} → ${event.endDate}`,
				`   - Slug: ${event.slug}`,
				"",
			].join("\n");
		})
		.join("\n");

	return `Found ${events.length} event(s):\n\n${eventList}`;
}

// Helper function to format search results for display
function formatSearchDisplay(results: SearchResponseType): string {
	const sections = [];

	if (results.events && results.events.length > 0) {
		sections.push(`**Events (${results.events.length}):**`);
		results.events.forEach((event: any, index) => {
			sections.push(
				`${index + 1}. ${event.title || event.name || "Unnamed Event"} (ID: ${event.id})`,
			);
		});
		sections.push("");
	}

	if (results.profiles && results.profiles.length > 0) {
		sections.push(`**Profiles (${results.profiles.length}):**`);
		results.profiles.forEach((profile: any, index) => {
			sections.push(
				`${index + 1}. ${profile.name || profile.username || "Unnamed Profile"}`,
			);
		});
		sections.push("");
	}

	if (results.tags && results.tags.length > 0) {
		sections.push(`**Tags (${results.tags.length}):**`);
		results.tags.forEach((tag: any, index) => {
			sections.push(
				`${index + 1}. ${tag.label || tag.name || "Unnamed Tag"} (${tag.slug || "no-slug"})`,
			);
		});
	}

	return sections.length > 0 ? sections.join("\n") : "No search results found.";
}

// Helper function to format tags for display
function formatTagsDisplay(tags: UpdatedTagType[]): string {
	if (tags.length === 0) {
		return "No tags found.";
	}

	const tagList = tags
		.map((tag, index) => {
			const features = [];
			if (tag.isCarousel) features.push("Carousel");
			if (tag.forceShow) features.push("Force Show");
			if (tag.forceHide) features.push("Force Hide");

			return [
				`${index + 1}. **${tag.label}**`,
				`   - ID: ${tag.id}`,
				`   - Slug: ${tag.slug}`,
				features.length > 0 ? `   - Features: ${features.join(", ")}` : "",
				`   - Created: ${new Date(tag.createdAt).toLocaleDateString()}`,
				"",
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n");

	return `Found ${tags.length} tag(s):\n\n${tagList}`;
}

// Register MCP tools

// Market Analysis Tools
server.tool(
	"get_markets",
	"Retrieve market data with comprehensive filtering options for prediction markets",
	{
		limit: z
			.number()
			.min(1)
			.max(100)
			.optional()
			.describe("Maximum number of markets to return (1-100)"),
		active: z.boolean().optional().describe("Filter for active markets only"),
		closed: z.boolean().optional().describe("Filter for closed markets only"),
		archived: z.boolean().optional().describe("Include archived markets"),
		tag_id: z.number().optional().describe("Filter by specific tag ID"),
	},
	async (params) => {
		try {
			const query: UpdatedMarketQueryType = {};

			if (params.limit !== undefined) query.limit = params.limit;
			if (params.active !== undefined) query.active = params.active;
			if (params.closed !== undefined) query.closed = params.closed;
			if (params.archived !== undefined) query.archived = params.archived;
			if (params.tag_id !== undefined) query.tag_id = params.tag_id;

			const markets = await gammaSDK.getMarkets(query);

			return {
				content: [
					{
						type: "text",
						text: formatMarketDisplay(markets),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, "Get markets");
		}
	},
);

server.tool(
	"get_market_by_id",
	"Fetch detailed information for a specific market by ID",
	{
		id: z.number().describe("Market ID to retrieve"),
		include_tag: z.boolean().optional().describe("Include tag information"),
	},
	async (params) => {
		try {
			const query: MarketByIdQueryType = {};
			if (params.include_tag !== undefined)
				query.include_tag = params.include_tag;

			const market = await gammaSDK.getMarketById(params.id, query);

			if (!market) {
				return {
					content: [
						{
							type: "text",
							text: `Market with ID ${params.id} not found.`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: formatMarketDisplay([market]),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, `Get market by ID ${params.id}`);
		}
	},
);

server.tool(
	"get_market_by_slug",
	"Retrieve market by human-readable slug identifier",
	{
		slug: z.string().describe("Market slug identifier"),
		include_tag: z.boolean().optional().describe("Include tag information"),
	},
	async (params) => {
		try {
			const query: MarketByIdQueryType = {};
			if (params.include_tag !== undefined)
				query.include_tag = params.include_tag;

			const market = await gammaSDK.getMarketBySlug(params.slug, query);

			if (!market) {
				return {
					content: [
						{
							type: "text",
							text: `Market with slug "${params.slug}" not found.`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: formatMarketDisplay([market]),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, `Get market by slug ${params.slug}`);
		}
	},
);

// Event Management Tools
server.tool(
	"get_events",
	"Retrieve events with advanced filtering capabilities",
	{
		limit: z
			.number()
			.min(1)
			.max(100)
			.optional()
			.describe("Maximum number of events to return"),
		active: z.boolean().optional().describe("Filter for active events"),
		closed: z.boolean().optional().describe("Filter for closed events"),
		featured: z.boolean().optional().describe("Filter for featured events"),
		tag_id: z.number().optional().describe("Filter by tag ID"),
		archived: z.boolean().optional().describe("Include archived events"),
	},
	async (params) => {
		try {
			const query: UpdatedEventQueryType = {};

			if (params.limit !== undefined) query.limit = params.limit;
			if (params.active !== undefined) query.active = params.active;
			if (params.closed !== undefined) query.closed = params.closed;
			if (params.featured !== undefined) query.featured = params.featured;
			if (params.tag_id !== undefined) query.tag_id = params.tag_id;
			if (params.archived !== undefined) query.archived = params.archived;

			const events = await gammaSDK.getEvents(query);

			return {
				content: [
					{
						type: "text",
						text: formatEventDisplay(events),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, "Get events");
		}
	},
);

server.tool(
	"get_event_by_id",
	"Fetch comprehensive event details including markets by ID",
	{
		id: z.number().describe("Event ID to retrieve"),
		include_chat: z.boolean().optional().describe("Include chat/comment data"),
	},
	async (params) => {
		try {
			const query: EventByIdQueryType = {};
			if (params.include_chat !== undefined)
				query.include_chat = params.include_chat;

			const event = await gammaSDK.getEventById(params.id, query);

			if (!event) {
				return {
					content: [
						{
							type: "text",
							text: `Event with ID ${params.id} not found.`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: formatEventDisplay([event]),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, `Get event by ID ${params.id}`);
		}
	},
);

server.tool(
	"get_event_markdown",
	"Convert event data to markdown format optimized for AI analysis",
	{
		id: z.number().describe("Event ID to format"),
		verbose: z
			.union([z.literal(0), z.literal(1), z.literal(2)])
			.optional()
			.describe("Detail level: 0=basic, 1=medium, 2=full"),
		include_markets: z.boolean().optional().describe("Include market details"),
	},
	async (params) => {
		try {
			const query: EventByIdQueryType = {};

			const event = await gammaSDK.getEventById(params.id, query);

			if (!event) {
				return {
					content: [
						{
							type: "text",
							text: `Event with ID ${params.id} not found.`,
						},
					],
				};
			}

			const markdownOptions = {
				verbose: params.verbose,
				include_markets: params.include_markets,
			};

			const markdown = formatEventToMarkdown(event, markdownOptions);

			return {
				content: [
					{
						type: "text",
						text: markdown,
					},
				],
			};
		} catch (error) {
			return handleApiError(error, `Get event markdown for ID ${params.id}`);
		}
	},
);

// Search and Discovery Tools
server.tool(
	"search_polymarket",
	"Perform comprehensive search across markets, events, and profiles",
	{
		q: z.string().describe("Search query"),
		limit_per_type: z
			.number()
			.min(1)
			.max(50)
			.optional()
			.describe("Results per category"),
		events_status: z.string().optional().describe("Event status filter"),
	},
	async (params) => {
		try {
			const query: SearchQueryType = {
				q: params.q,
			};

			if (params.limit_per_type !== undefined)
				query.limit_per_type = params.limit_per_type;
			if (params.events_status !== undefined)
				query.events_status = params.events_status;

			const results = await gammaSDK.search(query);

			return {
				content: [
					{
						type: "text",
						text: formatSearchDisplay(results),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, `Search for "${params.q}"`);
		}
	},
);

server.tool(
	"get_tags",
	"Retrieve available tags for categorization and filtering",
	{
		limit: z
			.number()
			.min(1)
			.max(100)
			.optional()
			.describe("Maximum tags to return"),
		offset: z.number().min(0).optional().describe("Pagination offset"),
		is_carousel: z.boolean().optional().describe("Filter for carousel tags"),
	},
	async (params) => {
		try {
			const query: TagQueryType = {};

			if (params.limit !== undefined) query.limit = params.limit;
			if (params.offset !== undefined) query.offset = params.offset;
			if (params.is_carousel !== undefined)
				query.is_carousel = params.is_carousel;

			const tags = await gammaSDK.getTags(query);

			return {
				content: [
					{
						type: "text",
						text: formatTagsDisplay(tags),
					},
				],
			};
		} catch (error) {
			return handleApiError(error, "Get tags");
		}
	},
);

// Analytics and Aggregation Tools
server.tool(
	"get_market_trends",
	"Analyze market trends and patterns over specified timeframes",
	{
		timeframe: z
			.enum(["24h", "7d", "30d"])
			.optional()
			.describe("Analysis timeframe"),
		min_volume: z.number().optional().describe("Minimum volume threshold"),
	},
	async (params) => {
		try {
			const timeframe = params.timeframe || "24h";
			const minVolume = params.min_volume || 1000;

			// Get active markets with minimum volume
			const markets = await gammaSDK.getActiveMarkets({ limit: 50 });

			// Filter by volume and analyze trends
			const trendingMarkets = markets
				.filter((market) => market.volumeNum && market.volumeNum >= minVolume)
				.sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
				.slice(0, 10);

			const trendAnalysis = [
				`# Market Trends Analysis (${timeframe})`,
				`Analyzed ${markets.length} active markets with volume ≥ $${minVolume.toLocaleString()}`,
				``,
				`## Top Trending Markets:`,
				...trendingMarkets.map((market, index) => {
					const volume = market.volumeNum
						? `$${market.volumeNum.toLocaleString()}`
						: "N/A";

					return [
						`### ${index + 1}. ${market.question}`,
						`- Volume: ${volume}`,
						`- Status: ${market.active ? "Active" : "Inactive"}${market.closed ? ", Closed" : ""}`,
						`- Market ID: ${market.id}`,
						``,
					].join("\n");
				}),
			].join("\n");

			return {
				content: [
					{
						type: "text",
						text: trendAnalysis,
					},
				],
			};
		} catch (error) {
			return handleApiError(error, "Analyze market trends");
		}
	},
);

server.tool(
	"get_popular_markets",
	"Identify trending and popular markets based on volume and activity",
	{
		period: z
			.enum(["24h", "7d", "30d"])
			.optional()
			.describe("Time period for popularity calculation"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.optional()
			.describe("Number of markets to return"),
	},
	async (params) => {
		try {
			const limit = params.limit || 20;
			const period = params.period || "24h";

			// Get active markets sorted by volume
			const markets = await gammaSDK.getActiveMarkets({ limit: 100 });

			// Sort by volume and activity indicators
			const popularMarkets = markets
				.filter((market) => market.volumeNum && market.volumeNum > 0)
				.sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
				.slice(0, limit);

			const popularityAnalysis = [
				`# Popular Markets (${period})`,
				`Top ${popularMarkets.length} markets by volume and activity:`,
				``,
				...popularMarkets.map((market, index) => {
					const volume = market.volumeNum
						? `$${market.volumeNum.toLocaleString()}`
						: "N/A";

					return [
						`## ${index + 1}. ${market.question}`,
						`- **Total Volume**: ${volume}`,
						`- **Market ID**: ${market.id}`,
						`- **Status**: ${market.active ? "Active" : "Inactive"}${market.closed ? ", Closed" : ""}`,
						``,
					].join("\n");
				}),
			].join("\n");

			return {
				content: [
					{
						type: "text",
						text: popularityAnalysis,
					},
				],
			};
		} catch (error) {
			return handleApiError(error, "Get popular markets");
		}
	},
);

// MCP Resources Implementation
server.resource(
	"markets://active",
	"Live feed of active prediction markets",
	async () => {
		try {
			const markets = await gammaSDK.getActiveMarkets({ limit: 50 });

			return {
				contents: [
					{
						uri: "markets://active",
						mimeType: "application/json",
						text: JSON.stringify(
							{
								timestamp: new Date().toISOString(),
								count: markets.length,
								markets: markets.map((market) => ({
									id: market.id,
									question: market.question,
									volume: market.volumeNum,
									outcomes: market.outcomes,
									prices: market.outcomePrices,
									active: market.active,
									closed: market.closed,
								})),
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			return {
				contents: [
					{
						uri: "markets://active",
						mimeType: "text/plain",
						text: `Error fetching active markets: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	},
);

server.resource(
	"events://featured",
	"Curated list of featured events and tournaments",
	async () => {
		try {
			const events = await gammaSDK.getFeaturedEvents({ limit: 20 });

			return {
				contents: [
					{
						uri: "events://featured",
						mimeType: "application/json",
						text: JSON.stringify(
							{
								timestamp: new Date().toISOString(),
								count: events.length,
								events: events.map((event) => ({
									id: event.id,
									title: event.title,
									volume: event.volume,
									markets: event.markets.length,
									startDate: event.startDate,
									endDate: event.endDate,
									active: event.active,
									closed: event.closed,
								})),
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			return {
				contents: [
					{
						uri: "events://featured",
						mimeType: "text/plain",
						text: `Error fetching featured events: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	},
);

// Start the MCP server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Polymarket MCP Server running on stdio");
	console.error(
		"Available tools: get_markets, get_market_by_id, get_market_by_slug, get_events, get_event_by_id, get_event_markdown, search_polymarket, get_tags, get_market_trends, get_popular_markets",
	);
	console.error("Available resources: markets://active, events://featured");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
