/**
 * Polymarket Data API SDK Client
 *
 * A fully typed wrapper SDK for the Polymarket Data API endpoints.
 * Provides type-safe methods for all available API operations including
 * health checks, positions, trades, user activity, holders, and more.
 */
import { ProxyAgent } from "undici";
import type {
	PositionType,
	PositionsQueryType,
	ClosedPositionType,
	ClosedPositionsQueryType,
	DataTradeType,
	TradesQueryType,
	ActivityType,
	UserActivityQueryType,
	MetaHolderType,
	TopHoldersQueryType,
	TotalValueType,
	TotalValueQueryType,
	TotalMarketsTradedType,
	TotalMarketsTradedQueryType,
	OpenInterestType,
	OpenInterestQueryType,
	LiveVolumeResponseType,
	LiveVolumeQueryType,
	DataHealthResponseType,
	ProxyConfigType,
} from "../types/elysia-schemas";
import { Effect } from "effect";

const describeCause = (cause: unknown): string => {
	if (cause instanceof Error) return cause.message;
	if (typeof cause === "string") return cause;
	try {
		return JSON.stringify(cause);
	} catch {
		return String(cause);
	}
};

const dataError =
	(context: string) =>
	(cause: unknown): Error =>
		new Error(`[DataSDK] ${context}: ${describeCause(cause)}`);

/**
 * Configuration options for the DataSDK
 */
export interface DataSDKConfig {
	/** HTTP/HTTPS proxy configuration */
	proxy?: ProxyConfigType;
}

type ApiResponse<T> = {
	data: T | null;
	status: number;
	ok: boolean;
	errorData?: unknown;
};

/**
 * Polymarket Data API SDK for user data and on-chain activities
 *
 * This SDK provides a comprehensive interface to the Polymarket Data API
 * covering all available endpoints for user data, holdings, positions,
 * trades, activity, and market analytics.
 */
export class DataSDK {
	private readonly dataApiBase = "https://data-api.polymarket.com";
	private readonly proxyConfig?: ProxyConfigType;

	constructor(config?: DataSDKConfig) {
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

	private buildRequestUrl(
		endpoint: string,
		query?: Record<string, any>,
	): string {
		let url = `${this.dataApiBase}${endpoint}`;

		if (query && Object.keys(query).length > 0) {
			const searchParams = this.buildSearchParams(query);
			url += `?${searchParams.toString()}`;
		}

		return url;
	}

	/**
	 * Helper method to make API requests with error handling
	 */
	private makeRequestEffect<T>(
		endpoint: string,
		query?: Record<string, any>,
	): Effect.Effect<ApiResponse<T>, Error> {
		const url = this.buildRequestUrl(endpoint, query);
		const self = this;

		return Effect.gen(function* (_) {
			const fetchOptions = yield* _(
				Effect.try({
					try: () => self.createFetchOptions(),
					catch: dataError("create fetch options"),
				}),
			);

			const response = yield* _(
				Effect.tryPromise({
					try: () => fetch(url, fetchOptions),
					catch: dataError(`request ${endpoint}`),
				}),
			);

			const data = yield* _(
				Effect.tryPromise({
					try: async () => {
						if (response.status === 204) return null;
						return (await response.json()) as unknown;
					},
					catch: dataError(`parse response from ${endpoint}`),
				}),
			);

			if (!response.ok) {
				return {
					data: null,
					status: response.status,
					ok: false,
					errorData: data ?? undefined,
				};
			}

			return {
				data: data as T,
				status: response.status,
				ok: true,
			};
		});
	}

	private makeRequest<T>(
		endpoint: string,
		query?: Record<string, any>,
	): Promise<ApiResponse<T>> {
		return Effect.runPromise(this.makeRequestEffect<T>(endpoint, query));
	}

	/**
	 * Helper method to safely extract data from API response
	 * Throws an error if data is null when response is ok
	 */
	private extractResponseData<T>(
		response: ApiResponse<T>,
		operation: string,
	): T {
		if (!response.ok) {
			throw new Error(
				`[DataSDK] ${operation} failed: status ${response.status}`,
			);
		}
		if (response.data === null) {
			throw new Error(
				`[DataSDK] ${operation} returned null data despite successful response`,
			);
		}
		return response.data;
	}

	// Health Check API
	/**
	 * Health check for the Data API
	 *
	 * @returns Promise resolving to health check response
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const health = await data.healthCheck();
	 * console.log(health.data); // "OK"
	 * ```
	 */
	async healthCheck(): Promise<DataHealthResponseType> {
		const response = await this.makeRequest<DataHealthResponseType>("/");
		return this.extractResponseData(response, "Health check");
	}

	// Positions API
	/**
	 * Get current positions for a user
	 *
	 * @param query - Query parameters including required user address
	 * @returns Promise resolving to array of position objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const positions = await data.getCurrentPositions({
	 *   user: "0x123...",
	 *   limit: 50
	 * });
	 * ```
	 */
	async getCurrentPositions(
		query: PositionsQueryType,
	): Promise<PositionType[]> {
		const response = await this.makeRequest<PositionType[]>(
			"/positions",
			query,
		);
		return this.extractResponseData(response, "Get current positions");
	}

	/**
	 * Get closed positions for a user
	 *
	 * @param query - Query parameters including required user address
	 * @returns Promise resolving to array of closed position objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const closedPositions = await data.getClosedPositions({
	 *   user: "0x123...",
	 *   limit: 50
	 * });
	 * ```
	 */
	async getClosedPositions(
		query: ClosedPositionsQueryType,
	): Promise<ClosedPositionType[]> {
		const response = await this.makeRequest<ClosedPositionType[]>(
			"/closed-positions",
			query,
		);
		return this.extractResponseData(response, "Get closed positions");
	}

	// Trades API
	/**
	 * Get trades for a user or markets
	 *
	 * @param query - Optional query parameters for filtering and pagination
	 * @returns Promise resolving to array of trade objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const trades = await data.getTrades({
	 *   user: "0x123...",
	 *   limit: 100,
	 *   side: "BUY"
	 * });
	 * ```
	 */
	async getTrades(query: TradesQueryType = {}): Promise<DataTradeType[]> {
		const response = await this.makeRequest<DataTradeType[]>("/trades", query);
		return this.extractResponseData(response, "Get trades");
	}

	// User Activity API
	/**
	 * Get user activity
	 *
	 * @param query - Query parameters including required user address
	 * @returns Promise resolving to array of activity objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const activity = await data.getUserActivity({
	 *   user: "0x123...",
	 *   limit: 100,
	 *   type: "BUY"
	 * });
	 * ```
	 */
	async getUserActivity(query: UserActivityQueryType): Promise<ActivityType[]> {
		const response = await this.makeRequest<ActivityType[]>("/activity", query);
		return this.extractResponseData(response, "Get user activity");
	}

	// Holders API
	/**
	 * Get top holders for markets
	 *
	 * @param query - Query parameters including required market array
	 * @returns Promise resolving to array of meta holder objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const holders = await data.getTopHolders({
	 *   market: ["0xabc...", "0xdef..."],
	 *   limit: 50,
	 *   minBalance: 10
	 * });
	 * ```
	 */
	async getTopHolders(query: TopHoldersQueryType): Promise<MetaHolderType[]> {
		const response = await this.makeRequest<MetaHolderType[]>(
			"/holders",
			query,
		);
		return this.extractResponseData(response, "Get top holders");
	}

	// Value API
	/**
	 * Get total value of a user's positions
	 *
	 * @param query - Query parameters including required user address
	 * @returns Promise resolving to total value response
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const totalValue = await data.getTotalValue({
	 *   user: "0x123...",
	 *   market: ["0xabc..."] // optional
	 * });
	 * ```
	 */
	async getTotalValue(query: TotalValueQueryType): Promise<TotalValueType[]> {
		const response = await this.makeRequest<TotalValueType[]>("/value", query);
		return this.extractResponseData(response, "Get total value");
	}

	// Markets Traded API
	/**
	 * Get total markets a user has traded
	 *
	 * @param query - Query parameters including required user address
	 * @returns Promise resolving to total markets traded response
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const totalMarkets = await data.getTotalMarketsTraded({
	 *   user: "0x123..."
	 * });
	 * console.log(totalMarkets.traded); // number of markets traded
	 * ```
	 */
	async getTotalMarketsTraded(
		query: TotalMarketsTradedQueryType,
	): Promise<TotalMarketsTradedType> {
		const response = await this.makeRequest<TotalMarketsTradedType>(
			"/traded",
			query,
		);
		return this.extractResponseData(response, "Get total markets traded");
	}

	// Open Interest API
	/**
	 * Get open interest for markets
	 *
	 * @param query - Query parameters including required market array
	 * @returns Promise resolving to array of open interest objects
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const openInterest = await data.getOpenInterest({
	 *   market: ["0xabc...", "0xdef..."]
	 * });
	 * ```
	 */
	async getOpenInterest(
		query: OpenInterestQueryType,
	): Promise<OpenInterestType[]> {
		const response = await this.makeRequest<OpenInterestType[]>("/oi", query);
		return this.extractResponseData(response, "Get open interest");
	}

	// Live Volume API
	/**
	 * Get live volume for an event
	 *
	 * @param query - Query parameters including required event ID
	 * @returns Promise resolving to live volume response
	 * @throws {Error} When API request fails
	 *
	 * @example
	 * ```ts
	 * const liveVolume = await data.getLiveVolume({
	 *   id: 12345
	 * });
	 * console.log(liveVolume.total); // total volume
	 * console.log(liveVolume.markets); // array of market volumes
	 * ```
	 */
	async getLiveVolume(
		query: LiveVolumeQueryType,
	): Promise<LiveVolumeResponseType> {
		const response = await this.makeRequest<LiveVolumeResponseType>(
			"/live-volume",
			query,
		);
		return this.extractResponseData(response, "Get live volume");
	}

	// Convenience methods for common use cases

	/**
	 * Get all positions (current and closed) for a user
	 *
	 * @param user - User address
	 * @param options - Optional query parameters
	 * @returns Promise resolving to combined current and closed positions
	 *
	 * @example
	 * ```ts
	 * const allPositions = await data.getAllPositions("0x123...", {
	 *   limit: 100
	 * });
	 * ```
	 */
	async getAllPositions(
		user: string,
		options: Omit<PositionsQueryType, "user"> = {},
	): Promise<{
		current: PositionType[];
		closed: ClosedPositionType[];
	}> {
		const [current, closed] = await Promise.all([
			this.getCurrentPositions({ user, ...options }),
			this.getClosedPositions({ user, ...options }),
		]);

		return { current, closed };
	}

	/**
	 * Get comprehensive user portfolio summary
	 *
	 * @param user - User address
	 * @returns Promise resolving to portfolio summary
	 *
	 * @example
	 * ```ts
	 * const portfolio = await data.getPortfolioSummary("0x123...");
	 * console.log(portfolio.totalValue);
	 * console.log(portfolio.marketsTraded);
	 * ```
	 */
	async getPortfolioSummary(user: string): Promise<{
		totalValue: TotalValueType[];
		marketsTraded: TotalMarketsTradedType;
		currentPositions: PositionType[];
	}> {
		const [totalValue, marketsTraded, currentPositions] = await Promise.all([
			this.getTotalValue({ user }),
			this.getTotalMarketsTraded({ user }),
			this.getCurrentPositions({ user }),
		]);

		return {
			totalValue,
			marketsTraded,
			currentPositions,
		};
	}
}
