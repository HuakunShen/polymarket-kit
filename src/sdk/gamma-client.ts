/**
 * Polymarket Gamma API SDK Client
 *
 * A fully typed wrapper SDK for Polymarket Gamma API endpoints.
 * Provides type-safe methods for fetching markets and events without requiring credentials.
 * This is a standalone client that doesn't require CLOB authentication.
 */

// TypeBox validation is handled by Elysia internally
// For SDK validation, we'll use a simple type-safe approach without runtime validation
import type {
	EventType as Event,
	EventQueryType as EventQuery,
	MarketType as Market,
	MarketQueryType as MarketQuery,
} from "../types/elysia-schemas";

/**
 * Polymarket Gamma API SDK for public data operations
 *
 * This SDK provides a high-level interface to the Polymarket Gamma API for fetching
 * public market and event data. No authentication required.
 */
export class GammaSDK {
	private readonly gammaApiBase = "https://gamma-api.polymarket.com";

	/**
	 * Transform market data from Gamma API to match expected schema
	 * Parses JSON string fields that should be arrays
	 */
	private transformMarketData(item: any): Market {
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
	private transformEventData(item: any): Event {
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

	/**
	 * Fetch markets from Gamma API with full typing and validation
	 *
	 * @param query - Optional query parameters to filter markets
	 * @returns Promise resolving to array of market objects
	 * @throws {Error} When API request fails or returns invalid data
	 *
	 * @example
	 * ```ts
	 * const gamma = new GammaSDK();
	 * const markets = await gamma.getMarkets({ active: "true" });
	 * ```
	 */
	async getMarkets(query: MarketQuery = {}): Promise<Market[]> {
		const searchParams = new URLSearchParams();

		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined) {
				searchParams.append(key, value);
			}
		});

		const url = `${this.gammaApiBase}/markets?${searchParams.toString()}`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Gamma API responded with status: ${response.status}`);
			}

			const data = await response.json();

			if (!Array.isArray(data)) {
				throw new Error(
					"Expected array response from Gamma API markets endpoint",
				);
			}

			// Transform response data to match expected schema
			return data.map((item) => this.transformMarketData(item));
		} catch (error) {
			throw new Error(
				`Failed to fetch markets: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Fetch events from Gamma API with full typing and validation
	 *
	 * @param query - Optional query parameters to filter events
	 * @returns Promise resolving to array of event objects
	 * @throws {Error} When API request fails or returns invalid data
	 *
	 * @example
	 * ```ts
	 * const events = await gamma.getEvents({ active: "true", limit: "10" });
	 * ```
	 */
	async getEvents(query: EventQuery = {}): Promise<Event[]> {
		const searchParams = new URLSearchParams();

		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined) {
				searchParams.append(key, value);
			}
		});

		const url = `${this.gammaApiBase}/events?${searchParams.toString()}`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Gamma API responded with status: ${response.status}`);
			}

			const data = await response.json();

			if (!Array.isArray(data)) {
				throw new Error(
					"Expected array response from Gamma API events endpoint",
				);
			}

			// Transform response data to match expected schema
			return data.map((item) => this.transformEventData(item));
		} catch (error) {
			throw new Error(
				`Failed to fetch events: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Get a specific market by ID
	 *
	 * @param id - The market ID to fetch
	 * @returns Promise resolving to market object or null if not found
	 *
	 * @example
	 * ```ts
	 * const market = await gamma.getMarketById("market-123");
	 * ```
	 */
	async getMarketById(id: string): Promise<Market | null> {
		const markets = await this.getMarkets({ id });
		return markets.length > 0 ? (markets[0] ?? null) : null;
	}

	/**
	 * Get a specific event by ID
	 *
	 * @param id - The event ID to fetch
	 * @returns Promise resolving to event object or null if not found
	 *
	 * @example
	 * ```ts
	 * const event = await gamma.getEventById("event-123");
	 * ```
	 */
	async getEventById(id: string): Promise<Event | null> {
		const events = await this.getEvents({ id });
		return events.length > 0 ? (events[0] ?? null) : null;
	}

	/**
	 * Get markets by slug
	 *
	 * @param slug - The market slug to fetch
	 * @returns Promise resolving to market object or null if not found
	 *
	 * @example
	 * ```ts
	 * const market = await gamma.getMarketBySlug("trump-2024");
	 * ```
	 */
	async getMarketBySlug(slug: string): Promise<Market | null> {
		const markets = await this.getMarkets({ slug });
		return markets.length > 0 ? (markets[0] ?? null) : null;
	}

	/**
	 * Get events by slug
	 *
	 * @param slug - The event slug to fetch
	 * @returns Promise resolving to event object or null if not found
	 *
	 * @example
	 * ```ts
	 * const event = await gamma.getEventBySlug("election-2024");
	 * ```
	 */
	async getEventBySlug(slug: string): Promise<Event | null> {
		const events = await this.getEvents({ slug });
		return events.length > 0 ? (events[0] ?? null) : null;
	}

	/**
	 * Get active markets
	 *
	 * @param query - Optional query parameters (excluding active which is set to true)
	 * @returns Promise resolving to array of active market objects
	 *
	 * @example
	 * ```ts
	 * const activeMarkets = await gamma.getActiveMarkets({ limit: "20" });
	 * ```
	 */
	async getActiveMarkets(
		query: Omit<MarketQuery, "active"> = {},
	): Promise<Market[]> {
		return this.getMarkets({ ...query, active: "true" });
	}

	/**
	 * Get active events
	 *
	 * @param query - Optional query parameters (excluding active which is set to true)
	 * @returns Promise resolving to array of active event objects
	 *
	 * @example
	 * ```ts
	 * const activeEvents = await gamma.getActiveEvents({ limit: "10" });
	 * ```
	 */
	async getActiveEvents(
		query: Omit<EventQuery, "active"> = {},
	): Promise<Event[]> {
		return this.getEvents({ ...query, active: "true" });
	}

	/**
	 * Get closed markets
	 *
	 * @param query - Optional query parameters (excluding closed which is set to true)
	 * @returns Promise resolving to array of closed market objects
	 *
	 * @example
	 * ```ts
	 * const closedMarkets = await gamma.getClosedMarkets({ limit: "50" });
	 * ```
	 */
	async getClosedMarkets(
		query: Omit<MarketQuery, "closed"> = {},
	): Promise<Market[]> {
		return this.getMarkets({ ...query, closed: "true" });
	}

	/**
	 * Get closed events
	 *
	 * @param query - Optional query parameters (excluding closed which is set to true)
	 * @returns Promise resolving to array of closed event objects
	 *
	 * @example
	 * ```ts
	 * const closedEvents = await gamma.getClosedEvents({ limit: "25" });
	 * ```
	 */
	async getClosedEvents(
		query: Omit<EventQuery, "closed"> = {},
	): Promise<Event[]> {
		return this.getEvents({ ...query, closed: "true" });
	}
}
