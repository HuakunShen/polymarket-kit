/**
 * Polymarket CLOB Public SDK Client (pure fetch)
 *
 * A credential-free, dependency-free wrapper for public read-only CLOB endpoints
 * that uses native fetch + TypeBox-derived types (no axios, no @polymarket/clob-client).
 * Safe in any runtime that has fetch (Node, Bun, Vite SSR, Cloudflare Workers, browser).
 *
 * Mirrors the structure of GammaSDK / DataSDK.
 */
import type {
	ClobBatchPricesHistoryRequestType,
	ClobBatchPricesHistoryResponseType,
	ClobFeeRateResponseType,
	ClobLastTradePriceResponseType,
	ClobLastTradePriceWithSideType,
	ClobMidpointResponseType,
	ClobNegRiskResponseType,
	ClobOrderBookSummaryType,
	ClobOrderSideType,
	ClobPriceResponseType,
	ClobSpreadResponseType,
	ClobTickSizeResponseType,
	MarketByTokenResponseType,
	PriceHistoryQueryType,
	PriceHistoryResponseType,
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

const clobError =
	(context: string) =>
	(cause: unknown): Error =>
		new Error(`[ClobSDK] ${context}: ${describeCause(cause)}`);

/**
 * Configuration options for the ClobSDK
 */
export interface ClobSDKConfig {
	/** HTTP/HTTPS proxy configuration (Node/Bun only) */
	proxy?: ProxyConfigType;
	/** Override the CLOB API host (default: https://clob.polymarket.com) */
	host?: string;
}

type ApiResponse<T> = {
	data: T | null;
	status: number;
	ok: boolean;
	errorData?: unknown;
};

/**
 * Polymarket CLOB Public SDK for read-only operations.
 *
 * No credentials required. Pure fetch. Safe in Workers / Vite SSR / browser.
 */
export class ClobSDK {
	private readonly clobApiBase: string;
	private readonly proxyConfig?: ProxyConfigType;

	constructor(config?: ClobSDKConfig) {
		this.clobApiBase = config?.host ?? "https://clob.polymarket.com";
		this.proxyConfig = config?.proxy;
	}

	private async createFetchOptions(): Promise<RequestInit> {
		const options: RequestInit = {
			headers: { "Content-Type": "application/json" },
		};

		if (!this.proxyConfig) return options;

		const isBrowser =
			typeof (globalThis as any).window !== "undefined" ||
			typeof process === "undefined" ||
			!process.env;
		if (isBrowser) {
			console.warn(
				"[ClobSDK] Proxy configuration is not supported in browser environments",
			);
			return options;
		}

		const proxyUrl = this.buildProxyUrl(this.proxyConfig);
		try {
			const { ProxyAgent } = await import("undici");
			(options as any).dispatcher = new ProxyAgent(proxyUrl);
		} catch (error) {
			console.warn("[ClobSDK] Proxy configuration failed:", error);
			if (typeof process !== "undefined" && process.env) {
				process.env.HTTP_PROXY = proxyUrl;
				process.env.HTTPS_PROXY = proxyUrl;
			}
		}
		return options;
	}

	private buildProxyUrl(proxy: ProxyConfigType): string {
		const protocol = proxy.protocol || "http";
		const auth =
			proxy.username && proxy.password
				? `${proxy.username}:${proxy.password}@`
				: "";
		return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
	}

	private buildSearchParams(query: Record<string, any>): URLSearchParams {
		const searchParams = new URLSearchParams();
		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined || value === null) return;
			if (Array.isArray(value)) {
				value.forEach((item) => searchParams.append(key, String(item)));
			} else {
				searchParams.append(key, String(value));
			}
		});
		return searchParams;
	}

	private buildRequestUrl(
		endpoint: string,
		query?: Record<string, any>,
	): string {
		let url = `${this.clobApiBase}${endpoint}`;
		if (query && Object.keys(query).length > 0) {
			url += `?${this.buildSearchParams(query).toString()}`;
		}
		return url;
	}

	private makeRequestEffect<T>(
		endpoint: string,
		query?: Record<string, any>,
	): Effect.Effect<ApiResponse<T>, Error> {
		const url = this.buildRequestUrl(endpoint, query);
		const self = this;

		return Effect.gen(function* (_) {
			const fetchOptions = yield* _(
				Effect.tryPromise({
					try: () => self.createFetchOptions(),
					catch: clobError("create fetch options"),
				}),
			);

			const response = yield* _(
				Effect.tryPromise({
					try: () => fetch(url, fetchOptions),
					catch: clobError(`request ${endpoint}`),
				}),
			);

			const data = yield* _(
				Effect.tryPromise({
					try: async () => {
						if (response.status === 204) return null;
						return (await response.json()) as unknown;
					},
					catch: clobError(`parse response from ${endpoint}`),
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

			return { data: data as T, status: response.status, ok: true };
		});
	}

	private makeRequest<T>(
		endpoint: string,
		query?: Record<string, any>,
	): Promise<ApiResponse<T>> {
		return Effect.runPromise(this.makeRequestEffect<T>(endpoint, query));
	}

	private async makePostRequest<T>(
		endpoint: string,
		body: unknown,
	): Promise<ApiResponse<T>> {
		const baseOptions = await this.createFetchOptions();
		const options: RequestInit = {
			...baseOptions,
			method: "POST",
			body: JSON.stringify(body),
		};
		try {
			const response = await fetch(`${this.clobApiBase}${endpoint}`, options);
			const data =
				response.status === 204
					? null
					: ((await response.json()) as unknown);
			if (!response.ok) {
				return {
					data: null,
					status: response.status,
					ok: false,
					errorData: data ?? undefined,
				};
			}
			return { data: data as T, status: response.status, ok: true };
		} catch (cause) {
			throw clobError(`POST ${endpoint}`)(cause);
		}
	}

	private extractResponseData<T>(
		response: ApiResponse<T>,
		operation: string,
	): T {
		if (!response.ok) {
			const err = new Error(
				`[ClobSDK] ${operation} failed: status ${response.status}`,
			);
			(err as any).status = response.status;
			throw err;
		}
		if (response.data === null) {
			throw new Error(
				`[ClobSDK] ${operation} returned null data despite successful response`,
			);
		}
		return response.data;
	}

	/**
	 * Get the current CLOB server time as a Unix timestamp (seconds).
	 *
	 * `GET /time`
	 */
	async getServerTime(): Promise<number> {
		const response = await this.makeRequest<number>("/time");
		return this.extractResponseData(response, "Get server time");
	}

	/**
	 * Get the midpoint price (average of best bid and best ask) for a token.
	 *
	 * `GET /midpoint?token_id=...`
	 */
	async getMidpoint(tokenId: string): Promise<ClobMidpointResponseType> {
		const response = await this.makeRequest<ClobMidpointResponseType>(
			"/midpoint",
			{ token_id: tokenId },
		);
		return this.extractResponseData(response, "Get midpoint");
	}

	/**
	 * Get midpoint prices for multiple tokens in one call.
	 *
	 * `POST /midpoints` body: `[{ token_id }]` → `{ [tokenId]: midPrice }`
	 */
	async getMidpoints(tokenIds: string[]): Promise<Record<string, string>> {
		const response = await this.makePostRequest<Record<string, string>>(
			"/midpoints",
			tokenIds.map((id) => ({ token_id: id })),
		);
		return this.extractResponseData(response, "Get midpoints");
	}

	/**
	 * Get the spread (best ask − best bid) for a token.
	 *
	 * `GET /spread?token_id=...`
	 */
	async getSpread(tokenId: string): Promise<ClobSpreadResponseType> {
		const response = await this.makeRequest<ClobSpreadResponseType>(
			"/spread",
			{ token_id: tokenId },
		);
		return this.extractResponseData(response, "Get spread");
	}

	/**
	 * Get spreads for multiple tokens in one call.
	 *
	 * `POST /spreads` body: `[{ token_id }]` → `{ [tokenId]: spread }`
	 */
	async getSpreads(tokenIds: string[]): Promise<Record<string, string>> {
		const response = await this.makePostRequest<Record<string, string>>(
			"/spreads",
			tokenIds.map((id) => ({ token_id: id })),
		);
		return this.extractResponseData(response, "Get spreads");
	}

	/**
	 * Get the last trade price for a token.
	 * Returns `{ price: "0.5", side: "" }` when no trade has happened yet.
	 *
	 * `GET /last-trade-price?token_id=...`
	 */
	async getLastTradePrice(
		tokenId: string,
	): Promise<ClobLastTradePriceResponseType & { side: "BUY" | "SELL" | "" }> {
		const response = await this.makeRequest<
			ClobLastTradePriceResponseType & { side: "BUY" | "SELL" | "" }
		>("/last-trade-price", { token_id: tokenId });
		return this.extractResponseData(response, "Get last trade price");
	}

	/**
	 * Get last trade prices for multiple tokens in one call (max 500).
	 *
	 * `GET /last-trades-prices?token_ids=csv`
	 */
	async getLastTradesPrices(
		tokenIds: string[],
	): Promise<ClobLastTradePriceWithSideType[]> {
		const response = await this.makeRequest<ClobLastTradePriceWithSideType[]>(
			"/last-trades-prices",
			{ token_ids: tokenIds.join(",") },
		);
		return this.extractResponseData(response, "Get last trades prices");
	}

	/**
	 * Get the best market price for a token + side.
	 * BUY → best bid; SELL → best ask.
	 *
	 * `GET /price?token_id=...&side=BUY|SELL`
	 */
	async getPrice(
		tokenId: string,
		side: ClobOrderSideType,
	): Promise<ClobPriceResponseType> {
		const response = await this.makeRequest<ClobPriceResponseType>("/price", {
			token_id: tokenId,
			side,
		});
		return this.extractResponseData(response, "Get price");
	}

	/**
	 * Get market prices for multiple (token, side) pairs in one call.
	 *
	 * `POST /prices` body: `[{ token_id, side }]` →
	 * map of token_id → side → price.
	 */
	async getPrices(
		params: Array<{ token_id: string; side: ClobOrderSideType }>,
	): Promise<Record<string, Record<string, string>>> {
		const response = await this.makePostRequest<
			Record<string, Record<string, string>>
		>("/prices", params);
		return this.extractResponseData(response, "Get prices");
	}

	/**
	 * Get the order book summary (bids, asks, market metadata) for a token.
	 *
	 * `GET /book?token_id=...`
	 */
	async getOrderBook(tokenId: string): Promise<ClobOrderBookSummaryType> {
		const response = await this.makeRequest<ClobOrderBookSummaryType>("/book", {
			token_id: tokenId,
		});
		return this.extractResponseData(response, "Get order book");
	}

	/**
	 * Get order book summaries for multiple tokens.
	 *
	 * `POST /books` body: `[{ token_id }]`
	 */
	async getOrderBooks(
		tokenIds: string[],
	): Promise<ClobOrderBookSummaryType[]> {
		const response = await this.makePostRequest<ClobOrderBookSummaryType[]>(
			"/books",
			tokenIds.map((id) => ({ token_id: id })),
		);
		return this.extractResponseData(response, "Get order books");
	}

	/**
	 * Get the minimum tick size (price increment) for a token.
	 *
	 * `GET /tick-size/{token_id}`
	 */
	async getTickSize(tokenId: string): Promise<ClobTickSizeResponseType> {
		const response = await this.makeRequest<ClobTickSizeResponseType>(
			`/tick-size/${encodeURIComponent(tokenId)}`,
		);
		return this.extractResponseData(response, "Get tick size");
	}

	/**
	 * Get the base fee rate (basis points) for a token.
	 *
	 * `GET /fee-rate/{token_id}`
	 */
	async getFeeRate(tokenId: string): Promise<ClobFeeRateResponseType> {
		const response = await this.makeRequest<ClobFeeRateResponseType>(
			`/fee-rate/${encodeURIComponent(tokenId)}`,
		);
		return this.extractResponseData(response, "Get fee rate");
	}

	/**
	 * Get the negative-risk flag for a token.
	 *
	 * `GET /neg-risk/{token_id}`
	 */
	async getNegRisk(tokenId: string): Promise<ClobNegRiskResponseType> {
		const response = await this.makeRequest<ClobNegRiskResponseType>(
			`/neg-risk/${encodeURIComponent(tokenId)}`,
		);
		return this.extractResponseData(response, "Get neg risk");
	}

	/**
	 * Resolve a token ID to its parent market (condition ID + Yes/No pair).
	 *
	 * `GET /markets-by-token/{token_id}`
	 */
	async getMarketByToken(
		tokenId: string,
	): Promise<MarketByTokenResponseType> {
		const response = await this.makeRequest<MarketByTokenResponseType>(
			`/markets-by-token/${encodeURIComponent(tokenId)}`,
		);
		return this.extractResponseData(response, "Get market by token");
	}

	/**
	 * Get CLOB-level market parameters by condition ID (tokens, tick size,
	 * fees, rewards, RFQ status, fee details).
	 *
	 * `GET /clob-markets/{condition_id}`
	 *
	 * The response uses Polymarket's terse field names (`mts`, `mbf`, `tbf`, etc.) —
	 * returned as-is. See the OpenAPI `ClobMarketDetails` schema for field meanings.
	 */
	async getClobMarketInfo(
		conditionId: string,
	): Promise<Record<string, unknown>> {
		const response = await this.makeRequest<Record<string, unknown>>(
			`/clob-markets/${encodeURIComponent(conditionId)}`,
		);
		return this.extractResponseData(response, "Get CLOB market info");
	}

	/**
	 * Get historical price points for up to 20 markets in a single request.
	 *
	 * `POST /batch-prices-history`
	 */
	async getBatchPricesHistory(
		params: ClobBatchPricesHistoryRequestType,
	): Promise<ClobBatchPricesHistoryResponseType> {
		const response =
			await this.makePostRequest<ClobBatchPricesHistoryResponseType>(
				"/batch-prices-history",
				params,
			);
		return this.extractResponseData(response, "Get batch prices history");
	}

	/**
	 * Get historical price points for a CLOB token.
	 *
	 * Wraps `GET /prices-history` (public endpoint, no auth). The upstream API
	 * returns `{ history: [{ t, p }] }`; this method also derives a `timeRange`
	 * field from the first/last data points so callers don't have to.
	 *
	 * @example
	 * ```ts
	 * const { history, timeRange } = await clob.getPriceHistory({
	 *   market: clobTokenId,
	 *   interval: "1d",
	 *   fidelity: 60,
	 * });
	 * ```
	 */
	async getPriceHistory(
		query: PriceHistoryQueryType,
	): Promise<PriceHistoryResponseType> {
		const response = await this.makeRequest<{
			history?: Array<{ t: number; p: number }>;
		}>("/prices-history", query);
		const data = this.extractResponseData(response, "Get price history");
		const history = data.history ?? [];
		if (history.length === 0) {
			return { history: [], timeRange: null };
		}
		const start = history[0]!.t;
		const end = history[history.length - 1]!.t;
		return {
			history,
			timeRange: {
				start: new Date(start * 1000).toISOString(),
				end: new Date(end * 1000).toISOString(),
			},
		};
	}
}
