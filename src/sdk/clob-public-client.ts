/**
 * Polymarket CLOB Public API Client
 *
 * A credential-free client for all public (no-auth) CLOB API endpoints.
 * Wraps vendors/clob-client-v2 ClobClient for tick size, fee rate, neg risk,
 * last trade price, server time, and CLOB market info queries.
 */
import { ClobClient, Chain } from "@polymarket/clob-client-v2";
import type {
	ClobTickSizeResponseType,
	ClobFeeRateResponseType,
	ClobNegRiskResponseType,
	ClobLastTradePriceResponseType,
	MarketByTokenResponseType,
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

const clobPublicError =
	(context: string) =>
	(cause: unknown): Error =>
		new Error(`[ClobPublicClient] ${context}: ${describeCause(cause)}`);

/**
 * Configuration options for the ClobPublicClient
 */
export interface ClobPublicClientConfig {
	/** HTTP/HTTPS proxy configuration */
	proxy?: ProxyConfigType;
	/** CLOB API host URL (default: https://clob.polymarket.com) */
	host?: string;
}

/**
 * Polymarket CLOB Public API Client — no credentials required
 *
 * Provides access to all public read-only CLOB endpoints:
 * tick size, fee rate, neg risk, last trade price, server time, and CLOB market info.
 */
export class ClobPublicClient {
	private readonly client: ClobClient;
	private readonly proxyConfig?: ProxyConfigType;

	constructor(config?: ClobPublicClientConfig) {
		const host = config?.host ?? "https://clob.polymarket.com";
		this.proxyConfig = config?.proxy;
		this.client = new ClobClient({ host, chain: Chain.POLYGON });

		// Apply proxy at construction time via env vars (same pattern as GammaSDK/DataSDK)
		if (this.proxyConfig) {
			this.applyProxyEnv(this.proxyConfig);
		}
	}

	private applyProxyEnv(proxy: ProxyConfigType): void {
		const isBrowser =
			typeof (globalThis as any).window !== "undefined" ||
			typeof process === "undefined" ||
			!process.env;
		if (isBrowser) return;

		const auth =
			proxy.username && proxy.password
				? `${proxy.username}:${proxy.password}@`
				: "";
		const proxyUrl = `${proxy.protocol ?? "http"}://${auth}${proxy.host}:${proxy.port}`;
		process.env.HTTP_PROXY = proxyUrl;
		process.env.HTTPS_PROXY = proxyUrl;
	}

	private run<T>(
		operation: () => Promise<T>,
		context: string,
	): Promise<T> {
		return Effect.runPromise(
			Effect.tryPromise({
				try: operation,
				catch: clobPublicError(context),
			}),
		);
	}

	/**
	 * Get the minimum tick size for a token
	 *
	 * @param tokenId - CLOB token ID
	 * @returns Promise resolving to tick size response
	 */
	async getTickSize(tokenId: string): Promise<ClobTickSizeResponseType> {
		return this.run(async () => {
			const result = await this.client.getTickSize(tokenId);
			return { minimum_tick_size: result };
		}, `getTickSize(${tokenId})`);
	}

	/**
	 * Get the fee rate in basis points for a token
	 *
	 * @param tokenId - CLOB token ID
	 * @returns Promise resolving to fee rate response
	 */
	async getFeeRate(tokenId: string): Promise<ClobFeeRateResponseType> {
		return this.run(async () => {
			const result = await this.client.getFeeRateBps(tokenId);
			return { base_fee: result };
		}, `getFeeRate(${tokenId})`);
	}

	/**
	 * Get the negative risk flag for a token
	 *
	 * @param tokenId - CLOB token ID
	 * @returns Promise resolving to neg risk response
	 */
	async getNegRisk(tokenId: string): Promise<ClobNegRiskResponseType> {
		return this.run(async () => {
			const result = await this.client.getNegRisk(tokenId);
			return { neg_risk: result };
		}, `getNegRisk(${tokenId})`);
	}

	/**
	 * Get the last trade price for a token
	 *
	 * @param tokenId - CLOB token ID
	 * @returns Promise resolving to last trade price response
	 */
	async getLastTradePrice(
		tokenId: string,
	): Promise<ClobLastTradePriceResponseType> {
		return this.run(async () => {
			const result = await this.client.getLastTradePrice(tokenId);
			return result as ClobLastTradePriceResponseType;
		}, `getLastTradePrice(${tokenId})`);
	}

	/**
	 * Get last trade prices for multiple tokens
	 *
	 * @param params - Array of token ID objects
	 * @returns Promise resolving to array of last trade price objects
	 */
	async getLastTradesPrices(
		params: { token_id: string }[],
	): Promise<{ token_id?: string; price?: string }[]> {
		return this.run(async () => {
			const bookParams = params.map((p) => ({
				token_id: p.token_id,
				side: "BUY" as any,
			}));
			const result = await this.client.getLastTradesPrices(bookParams);
			return result as { token_id?: string; price?: string }[];
		}, "getLastTradesPrices");
	}

	/**
	 * Get the current server time (Unix timestamp in seconds)
	 *
	 * @returns Promise resolving to server time
	 */
	async getServerTime(): Promise<{ time: number }> {
		return this.run(async () => {
			const result = await this.client.getServerTime();
			return { time: result };
		}, "getServerTime");
	}

	/**
	 * Get CLOB market info by condition ID (token IDs, neg risk, etc.)
	 *
	 * @param conditionId - The condition ID of the market
	 * @returns Promise resolving to CLOB market details
	 */
	async getClobMarketInfo(conditionId: string): Promise<any> {
		return this.run(
			() => this.client.getClobMarketInfo(conditionId),
			`getClobMarketInfo(${conditionId})`,
		);
	}

	/**
	 * Get market info by token ID (resolves to condition ID and token pair)
	 *
	 * @param tokenId - CLOB token ID
	 * @returns Promise resolving to market by token response
	 */
	async getMarketByToken(tokenId: string): Promise<MarketByTokenResponseType> {
		return this.run(async () => {
			// Use the internal helper to resolve token → condition mapping
			const result = await (this.client as any).get(
				`${(this.client as any).host}/markets-by-token/${tokenId}`,
			);
			return result as MarketByTokenResponseType;
		}, `getMarketByToken(${tokenId})`);
	}
}
