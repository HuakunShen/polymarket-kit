/**
 * Polymarket Gamma API SDK Client
 *
 * A fully typed wrapper SDK for the new Polymarket Gamma API endpoints.
 * Provides type-safe methods for all available API operations including
 * health checks, sports, tags, events, markets, series, comments, and search.
 */

import type {
	TeamType,
	TeamQueryType,
	UpdatedTagType,
	TagQueryType,
	TagByIdQueryType,
	RelatedTagRelationshipType,
	RelatedTagsQueryType,
	EventType,
	UpdatedEventQueryType,
	PaginatedEventQueryType,
	EventByIdQueryType,
	MarketType,
	UpdatedMarketQueryType,
	MarketByIdQueryType,
	SeriesType,
	SeriesQueryType,
	SeriesByIdQueryType,
	CommentType,
	CommentQueryType,
	CommentByIdQueryType,
	CommentsByUserQueryType,
	SearchQueryType,
	SearchResponseType,
	ProxyConfigType,
} from "../types/elysia-schemas";

/**
 * Configuration options for the GammaSDK
 */
export interface GammaSDKConfig {
	/** HTTP/HTTPS proxy configuration */
	proxy?: ProxyConfigType;
}

/**
 * Polymarket Gamma API SDK for all public data operations
 *
 * This SDK provides a comprehensive interface to the Polymarket Gamma API
 * covering all available endpoints. No authentication required.
 */
export class GammaSDK {
	private readonly gammaApiBase = "https://gamma-api.polymarket.com";
	private readonly proxyConfig?: ProxyConfigType;

	constructor(config?: GammaSDKConfig) {
		this.proxyConfig = config?.proxy;
	}

	/**
	 * Helper method to create fetch options with proxy support
	 */
	private createFetchOptions(): RequestInit {
		const options: RequestInit = {
			headers: {
				"Content-Type": "application/json",
			},
		};

		// Add proxy configuration if available
		if (this.proxyConfig) {
			const proxyUrl = this.buildProxyUrl(this.proxyConfig);

			// For Bun, we can use the dispatcher option with undici's ProxyAgent
			// This is the most compatible approach for Bun
			try {
				// Import undici dynamically for proxy support
				const { ProxyAgent } = require("undici");
				// Add dispatcher option for proxy
				(options as any).dispatcher = new ProxyAgent(proxyUrl);
			} catch (error) {
				console.warn("Proxy configuration failed:", error);
				// Fall back to environment proxy variables
				process.env.HTTP_PROXY = proxyUrl;
				process.env.HTTPS_PROXY = proxyUrl;
			}
		}

		return options;
	}

	/**
	 * Helper method to build proxy URL from configuration
	 */
	private buildProxyUrl(proxy: ProxyConfigType): string {
		const protocol = proxy.protocol || "http";
		const auth =
			proxy.username && proxy.password
				? `${proxy.username}:${proxy.password}@`
				: "";
		return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
	}

	/**
	 * Helper method to build URL search params from query object
	 */
	private buildSearchParams(query: Record<string, any>): URLSearchParams {
		const searchParams = new URLSearchParams();

		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					value.forEach((item) => {
						searchParams.append(key, String(item));
					});
				} else {
					searchParams.append(key, String(value));
				}
			}
		});

		return searchParams;
	}

	/**
	 * Helper method to make API requests with error handling
	 */
	private async makeRequest<T>(
		endpoint: string,
		query?: Record<string, any>,
	): Promise<{
		data: T | null;
		status: number;
		ok: boolean;
		errorData?: any;
	}> {
		let url = `${this.gammaApiBase}${endpoint}`;

		if (query && Object.keys(query).length > 0) {
			const searchParams = this.buildSearchParams(query);
			url += `?${searchParams.toString()}`;
		}

		try {
			const fetchOptions = this.createFetchOptions();
			const response = await fetch(url, fetchOptions);
			const data = await response.json();

			if (!response.ok) {
				return {
					data: null,
					status: response.status,
					ok: false,
					errorData: data,
				};
			}

			return {
				data: data as T,
				status: response.status,
				ok: true,
			};
		} catch (error) {
			throw new Error(
				`Failed to fetch from ${endpoint}: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Helper method to safely extract data from API response
	 * Throws an error if data is null when response is ok
	 */
	private extractResponseData<T>(
		response: {
			data: T | null;
			status: number;
			ok: boolean;
			errorData?: any;
		},
		operation: string,
	): T {
		if (!response.ok) {
			throw new Error(`${operation} failed: ${response.status}`);
		}
		if (response.data === null) {
			throw new Error(
				`${operation} returned null data despite successful response`,
			);
		}
		return response.data;
	}

	/**
	 * Transform market data from Gamma API to match expected schema
	 * Parses JSON string fields that should be arrays
	 */
	private transformMarketData(item: any): MarketType {
		return {
			...item,
			outcomes: this.parseJsonArray(item.outcomes),
			outcomePrices: this.parseJsonArray(item.outcomePrices),
			clobTokenIds: this.parseJsonArray(item.clobTokenIds),
		};
	}

	/**
	 * Transform event data from Gamma API to match expected schema
	 * Transforms nested market data as well
	 */
	private transformEventData(item: any): EventType {
		return {
			...item,
			markets:
				item.markets?.map((market: any) => ({
					...market,
					outcomes: this.parseJsonArray(market.outcomes),
					outcomePrices: this.parseJsonArray(market.outcomePrices),
					clobTokenIds: this.parseJsonArray(market.clobTokenIds),
				})) || [],
		};
	}

	/**
	 * Parse JSON array string or return as-is if already an array
	 */
	private parseJsonArray(value: string | string[]): string[] {
		if (Array.isArray(value)) return value;
		if (typeof value === "string") {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [];
	}

	// Sports API
	/**
	 * Get list of teams with optional filtering
	 *
	 * @param query - Optional query parameters to filter teams
	 * @returns Promise resolving to array of team objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const teams = await gamma.getTeams({ limit: 10, league: ["NFL"] });
	 * ```
	 */
	async getTeams(query: TeamQueryType = {}): Promise<TeamType[]> {
		const response = await this.makeRequest<TeamType[]>("/teams", query);
		return this.extractResponseData(response, "Get teams");
	}

	// Tags API
	/**
	 * Get list of tags with optional filtering
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to array of tag objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const tags = await gamma.getTags({ limit: 20, is_carousel: true });
	 * ```
	 */
	async getTags(query: TagQueryType): Promise<UpdatedTagType[]> {
		const response = await this.makeRequest<UpdatedTagType[]>("/tags", query);
		return this.extractResponseData(response, "Get tags");
	}

	/**
	 * Get a specific tag by ID
	 *
	 * @param id - The tag ID to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to tag object or null if not found
	 *
	 * @example
	 * ```ts
	 * const tag = await gamma.getTagById(123, { include_template: true });
	 * ```
	 */
	async getTagById(
		id: number,
		query: TagByIdQueryType = {},
	): Promise<UpdatedTagType | null> {
		const response = await this.makeRequest<UpdatedTagType>(
			`/tags/${id}`,
			query,
		);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get tag by ID: ${response.status}`);
		}
		return this.extractResponseData(response, "Get tag by ID");
	}

	/**
	 * Get a specific tag by slug
	 *
	 * @param slug - The tag slug to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to tag object or null if not found
	 *
	 * @example
	 * ```ts
	 * const tag = await gamma.getTagBySlug("politics");
	 * ```
	 */
	async getTagBySlug(
		slug: string,
		query: TagByIdQueryType = {},
	): Promise<UpdatedTagType | null> {
		const response = await this.makeRequest<UpdatedTagType>(
			`/tags/slug/${slug}`,
			query,
		);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get tag by slug: ${response.status}`);
		}
		return this.extractResponseData(response, "Get tag by slug");
	}

	/**
	 * Get related tags relationships by tag ID
	 *
	 * @param id - The tag ID to find relationships for
	 * @param query - Optional query parameters
	 * @returns Promise resolving to array of relationship objects
	 *
	 * @example
	 * ```ts
	 * const relationships = await gamma.getRelatedTagsRelationshipsByTagId(123);
	 * ```
	 */
	async getRelatedTagsRelationshipsByTagId(
		id: number,
		query: RelatedTagsQueryType = {},
	): Promise<RelatedTagRelationshipType[]> {
		const response = await this.makeRequest<RelatedTagRelationshipType[]>(
			`/tags/${id}/related-tags`,
			query,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to get related tags relationships: ${response.status}`,
			);
		}
		return this.extractResponseData(response, "Get related tags relationships");
	}

	/**
	 * Get related tags relationships by tag slug
	 *
	 * @param slug - The tag slug to find relationships for
	 * @param query - Optional query parameters
	 * @returns Promise resolving to array of relationship objects
	 *
	 * @example
	 * ```ts
	 * const relationships = await gamma.getRelatedTagsRelationshipsByTagSlug("politics");
	 * ```
	 */
	async getRelatedTagsRelationshipsByTagSlug(
		slug: string,
		query: RelatedTagsQueryType = {},
	): Promise<RelatedTagRelationshipType[]> {
		const response = await this.makeRequest<RelatedTagRelationshipType[]>(
			`/tags/slug/${slug}/related-tags`,
			query,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to get related tags relationships: ${response.status}`,
			);
		}
		return this.extractResponseData(response, "Get related tags relationships");
	}

	/**
	 * Get tags related to a tag ID
	 *
	 * @param id - The tag ID to find related tags for
	 * @param query - Optional query parameters
	 * @returns Promise resolving to array of related tag objects
	 *
	 * @example
	 * ```ts
	 * const relatedTags = await gamma.getTagsRelatedToTagId(123);
	 * ```
	 */
	async getTagsRelatedToTagId(
		id: number,
		query: RelatedTagsQueryType = {},
	): Promise<UpdatedTagType[]> {
		const response = await this.makeRequest<UpdatedTagType[]>(
			`/tags/${id}/related-tags/tags`,
			query,
		);
		if (!response.ok) {
			throw new Error(`Failed to get related tags: ${response.status}`);
		}
		return this.extractResponseData(response, "Get related tags");
	}

	/**
	 * Get tags related to a tag slug
	 *
	 * @param slug - The tag slug to find related tags for
	 * @param query - Optional query parameters
	 * @returns Promise resolving to array of related tag objects
	 *
	 * @example
	 * ```ts
	 * const relatedTags = await gamma.getTagsRelatedToTagSlug("politics");
	 * ```
	 */
	async getTagsRelatedToTagSlug(
		slug: string,
		query: RelatedTagsQueryType = {},
	): Promise<UpdatedTagType[]> {
		const response = await this.makeRequest<UpdatedTagType[]>(
			`/tags/slug/${slug}/related-tags/tags`,
			query,
		);
		if (!response.ok) {
			throw new Error(`Failed to get related tags: ${response.status}`);
		}
		return this.extractResponseData(response, "Get related tags");
	}

	// Events API
	/**
	 * Get list of events with optional filtering
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to array of event objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const events = await gamma.getEvents({ limit: 10, featured: true });
	 * ```
	 */
	async getEvents(query: UpdatedEventQueryType = {}): Promise<EventType[]> {
		const response = await this.makeRequest<any[]>("/events", query);
		const data = this.extractResponseData(response, "Get events");
		// Transform the data to parse JSON string fields in nested markets
		return data.map((item) => this.transformEventData(item));
	}

	/**
	 * Get paginated list of events
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to paginated event response
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const response = await gamma.getEventsPaginated({ limit: 10, offset: 0 });
	 * ```
	 */
	async getEventsPaginated(query: PaginatedEventQueryType): Promise<{
		data: EventType[];
		pagination: { hasMore: boolean; totalResults: number };
	}> {
		const response = await this.makeRequest<{
			data: any[];
			pagination: { hasMore: boolean; totalResults: number };
		}>("/events/pagination", query);
		const data = this.extractResponseData(response, "Get paginated events");
		// Transform the data to parse JSON string fields in nested markets
		return {
			data: data.data.map((item) => this.transformEventData(item)),
			pagination: data.pagination,
		};
	}

	/**
	 * Get a specific event by ID
	 *
	 * @param id - The event ID to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to event object or null if not found
	 *
	 * @example
	 * ```ts
	 * const event = await gamma.getEventById(123, { include_chat: true });
	 * ```
	 */
	async getEventById(
		id: number,
		query: EventByIdQueryType = {},
	): Promise<EventType | null> {
		const response = await this.makeRequest<any>(`/events/${id}`, query);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get event by ID: ${response.status}`);
		}
		// Transform the data to parse JSON string fields in nested markets
		const data = this.extractResponseData(response, "Get event by ID");
		return this.transformEventData(data);
	}

	/**
	 * Get tags for a specific event
	 *
	 * @param id - The event ID to get tags for
	 * @returns Promise resolving to array of tag objects
	 *
	 * @example
	 * ```ts
	 * const tags = await gamma.getEventTags(123);
	 * ```
	 */
	async getEventTags(id: number): Promise<UpdatedTagType[]> {
		const response = await this.makeRequest<UpdatedTagType[]>(
			`/events/${id}/tags`,
		);
		if (!response.ok) {
			throw new Error(`Failed to get event tags: ${response.status}`);
		}
		return this.extractResponseData(response, "Get event tags");
	}

	/**
	 * Get a specific event by slug
	 *
	 * @param slug - The event slug to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to event object or null if not found
	 *
	 * @example
	 * ```ts
	 * const event = await gamma.getEventBySlug("election-2024");
	 * ```
	 */
	async getEventBySlug(
		slug: string,
		query: EventByIdQueryType = {},
	): Promise<EventType | null> {
		const response = await this.makeRequest<any>(`/events/slug/${slug}`, query);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get event by slug: ${response.status}`);
		}
		// Transform the data to parse JSON string fields in nested markets
		const data = this.extractResponseData(response, "Get event by slug");
		return this.transformEventData(data);
	}

	// Markets API
	/**
	 * Get list of markets with optional filtering
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to array of market objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const markets = await gamma.getMarkets({ limit: 20, active: true });
	 * ```
	 */
	async getMarkets(query: UpdatedMarketQueryType = {}): Promise<MarketType[]> {
		const response = await this.makeRequest<any[]>("/markets", query);
		const data = this.extractResponseData(response, "Get markets");
		// Transform the data to parse JSON string fields
		return data.map((item) => this.transformMarketData(item));
	}

	/**
	 * Get a specific market by ID
	 *
	 * @param id - The market ID to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to market object or null if not found
	 *
	 * @example
	 * ```ts
	 * const market = await gamma.getMarketById(123, { include_tag: true });
	 * ```
	 */
	async getMarketById(
		id: number,
		query: MarketByIdQueryType = {},
	): Promise<MarketType | null> {
		const response = await this.makeRequest<any>(`/markets/${id}`, query);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get market by ID: ${response.status}`);
		}
		// Transform the data to parse JSON string fields
		const data = this.extractResponseData(response, "Get market by ID");
		return this.transformMarketData(data);
	}

	/**
	 * Get tags for a specific market
	 *
	 * @param id - The market ID to get tags for
	 * @returns Promise resolving to array of tag objects
	 *
	 * @example
	 * ```ts
	 * const tags = await gamma.getMarketTags(123);
	 * ```
	 */
	async getMarketTags(id: number): Promise<UpdatedTagType[]> {
		const response = await this.makeRequest<UpdatedTagType[]>(
			`/markets/${id}/tags`,
		);
		if (!response.ok) {
			throw new Error(`Failed to get market tags: ${response.status}`);
		}
		return this.extractResponseData(response, "Get market tags");
	}

	/**
	 * Get a specific market by slug
	 *
	 * @param slug - The market slug to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to market object or null if not found
	 *
	 * @example
	 * ```ts
	 * const market = await gamma.getMarketBySlug("trump-2024");
	 * ```
	 */
	async getMarketBySlug(
		slug: string,
		query: MarketByIdQueryType = {},
	): Promise<MarketType | null> {
		const response = await this.makeRequest<any>(
			`/markets/slug/${slug}`,
			query,
		);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get market by slug: ${response.status}`);
		}
		// Transform the data to parse JSON string fields
		const data = this.extractResponseData(response, "Get market by slug");
		return this.transformMarketData(data);
	}

	// Series API
	/**
	 * Get list of series with filtering and pagination
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to array of series objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const series = await gamma.getSeries({ limit: 10, offset: 0, closed: false });
	 * ```
	 */
	async getSeries(query: SeriesQueryType): Promise<SeriesType[]> {
		const response = await this.makeRequest<SeriesType[]>("/series", query);
		return this.extractResponseData(response, "Get series");
	}

	/**
	 * Get a specific series by ID
	 *
	 * @param id - The series ID to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to series object or null if not found
	 *
	 * @example
	 * ```ts
	 * const series = await gamma.getSeriesById(123, { include_chat: true });
	 * ```
	 */
	async getSeriesById(
		id: number,
		query: SeriesByIdQueryType = {},
	): Promise<SeriesType | null> {
		const response = await this.makeRequest<SeriesType>(`/series/${id}`, query);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`Failed to get series by ID: ${response.status}`);
		}
		return this.extractResponseData(response, "Get series by ID");
	}

	// Comments API
	/**
	 * Get list of comments with optional filtering
	 *
	 * @param query - Query parameters for pagination and filtering
	 * @returns Promise resolving to array of comment objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const comments = await gamma.getComments({
	 *   limit: 20,
	 *   parent_entity_type: "Event",
	 *   parent_entity_id: 123
	 * });
	 * ```
	 */
	async getComments(query: CommentQueryType = {}): Promise<CommentType[]> {
		const response = await this.makeRequest<CommentType[]>("/comments", query);
		return this.extractResponseData(response, "Get comments");
	}

	/**
	 * Get comments by comment ID (returns array of related comments)
	 *
	 * @param id - The comment ID to fetch
	 * @param query - Optional query parameters
	 * @returns Promise resolving to array of comment objects
	 *
	 * @example
	 * ```ts
	 * const comments = await gamma.getCommentsByCommentId(123);
	 * ```
	 */
	async getCommentsByCommentId(
		id: number,
		query: CommentByIdQueryType = {},
	): Promise<CommentType[]> {
		const response = await this.makeRequest<CommentType[]>(
			`/comments/${id}`,
			query,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to get comments by comment ID: ${response.status}`,
			);
		}
		return this.extractResponseData(response, "Get comments by comment ID");
	}

	/**
	 * Get comments by user address
	 *
	 * @param userAddress - The user address to get comments for
	 * @param query - Query parameters for pagination
	 * @returns Promise resolving to array of comment objects
	 *
	 * @example
	 * ```ts
	 * const comments = await gamma.getCommentsByUserAddress("0x123...", { limit: 10 });
	 * ```
	 */
	async getCommentsByUserAddress(
		userAddress: string,
		query: CommentsByUserQueryType = {},
	): Promise<CommentType[]> {
		const response = await this.makeRequest<CommentType[]>(
			`/comments/user_address/${userAddress}`,
			query,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to get comments by user address: ${response.status}`,
			);
		}
		return this.extractResponseData(response, "Get comments by user address");
	}

	// Search API
	/**
	 * Search across markets, events, and profiles
	 *
	 * @param query - Search query parameters
	 * @returns Promise resolving to search results
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const results = await gamma.search({
	 *   q: "election",
	 *   limit_per_type: 5,
	 *   events_status: "active"
	 * });
	 * ```
	 */
	async search(query: SearchQueryType): Promise<SearchResponseType> {
		const response = await this.makeRequest<SearchResponseType>(
			"/public-search",
			query,
		);
		if (!response.ok) {
			throw new Error(`Failed to search: ${response.status}`);
		}
		return this.extractResponseData(response, "Search");
	}

	// Convenience methods for common use cases

	/**
	 * Get active events
	 *
	 * @param query - Optional query parameters (excluding active which is set to true)
	 * @returns Promise resolving to array of active event objects
	 *
	 * @example
	 * ```ts
	 * const activeEvents = await gamma.getActiveEvents({ limit: 10 });
	 * ```
	 */
	async getActiveEvents(
		query: Omit<UpdatedEventQueryType, "active"> = {},
	): Promise<EventType[]> {
		return this.getEvents({ ...query, active: true });
	}

	/**
	 * Get closed events
	 *
	 * @param query - Optional query parameters (excluding closed which is set to true)
	 * @returns Promise resolving to array of closed event objects
	 *
	 * @example
	 * ```ts
	 * const closedEvents = await gamma.getClosedEvents({ limit: 25 });
	 * ```
	 */
	async getClosedEvents(
		query: Omit<UpdatedEventQueryType, "closed"> = {},
	): Promise<EventType[]> {
		return this.getEvents({ ...query, closed: true });
	}

	/**
	 * Get featured events
	 *
	 * @param query - Optional query parameters (excluding featured which is set to true)
	 * @returns Promise resolving to array of featured event objects
	 *
	 * @example
	 * ```ts
	 * const featuredEvents = await gamma.getFeaturedEvents({ limit: 5 });
	 * ```
	 */
	async getFeaturedEvents(
		query: Omit<UpdatedEventQueryType, "featured"> = {},
	): Promise<EventType[]> {
		return this.getEvents({ ...query, featured: true });
	}

	/**
	 * Get active markets
	 *
	 * @param query - Optional query parameters (excluding active which is set to true)
	 * @returns Promise resolving to array of active market objects
	 *
	 * @example
	 * ```ts
	 * const activeMarkets = await gamma.getActiveMarkets({ limit: 20 });
	 * ```
	 */
	async getActiveMarkets(
		query: Omit<UpdatedMarketQueryType, "active"> = {},
	): Promise<MarketType[]> {
		return this.getMarkets({ ...query, active: true });
	}

	/**
	 * Get closed markets
	 *
	 * @param query - Optional query parameters (excluding closed which is set to true)
	 * @returns Promise resolving to array of closed market objects
	 *
	 * @example
	 * ```ts
	 * const closedMarkets = await gamma.getClosedMarkets({ limit: 50 });
	 * ```
	 */
	async getClosedMarkets(
		query: Omit<UpdatedMarketQueryType, "closed"> = {},
	): Promise<MarketType[]> {
		return this.getMarkets({ ...query, closed: true });
	}
}
