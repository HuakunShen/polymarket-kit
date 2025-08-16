/**
 * Polymarket CLOB SDK Client
 *
 * A fully typed wrapper SDK for Polymarket CLOB API.
 * Provides type-safe methods for fetching price history and CLOB operations.
 * For Gamma API operations (markets/events), use the separate GammaSDK.
 */

import {
  ClobClient,
  PriceHistoryInterval,
  type PriceHistoryFilterParams,
} from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { LRUCache } from "lru-cache";
import {
  type ClobClientConfigType as ClobClientConfig,
  type PriceHistoryResponseType as PriceHistoryResponse,
  type PriceHistoryQueryType as PriceHistoryQuery,
} from "../types/elysia-schemas";

// Global cache for initialized CLOB clients
// Key: privateKey, Value: ClobClient instance
const clobClientCache = new LRUCache<string, ClobClient>({
  max: parseInt(process.env.CLOB_CLIENT_CACHE_MAX_SIZE || "100", 10),
  ttl:
    parseInt(process.env.CLOB_CLIENT_CACHE_TTL_MINUTES || "30", 10) * 60 * 1000,
  updateAgeOnGet: true, // Reset TTL when client is accessed
});

export class PolymarketSDK {
  private readonly config: ClobClientConfig;
  private readonly cacheKey: string;

  constructor(config: ClobClientConfig) {
    this.config = {
      host: "https://clob.polymarket.com",
      chainId: 137,
      signatureType: 1,
      ...config,
    };
    if (!config.privateKey || !config.funderAddress) {
      throw new Error("Missing required configuration parameters: privateKey and funderAddress");
    }
    // Create cache key based on private key and config that affects client creation
    this.cacheKey = `${config.privateKey}_${this.config.host}_${this.config.chainId}_${config.funderAddress}`;
  }

  /**
   * Initialize the CLOB client with credentials using cache
   */
  private async initializeClobClient(): Promise<ClobClient> {
    // Check cache first
    // console.log("this.cacheKey", this.cacheKey)
    const cachedClient = clobClientCache.get(this.cacheKey);
    if (cachedClient) {
      return cachedClient;
    }

    try {
      const signer = new Wallet(this.config.privateKey);

      const creds = await new ClobClient(
        this.config.host!,
        this.config.chainId!,
        signer
      ).createOrDeriveApiKey();

      const client = new ClobClient(
        this.config.host!,
        this.config.chainId!,
        signer,
        creds,
        this.config.signatureType!,
        this.config.funderAddress!
      );

      // Store in cache
      clobClientCache.set(this.cacheKey, client);

      return client;
    } catch (error) {
      throw new Error(
        `Failed to initialize CLOB client: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Convert interval string to PriceHistoryInterval enum
   */
  private getIntervalEnum(interval?: string): PriceHistoryInterval {
    switch (interval) {
      case "1h":
        return PriceHistoryInterval.ONE_HOUR;
      case "6h":
        return PriceHistoryInterval.SIX_HOURS;
      case "1d":
        return PriceHistoryInterval.ONE_DAY;
      case "1w":
        return PriceHistoryInterval.ONE_WEEK;
      case "max":
        return PriceHistoryInterval.MAX;
      default:
        return PriceHistoryInterval.ONE_HOUR;
    }
  }

  /**
   * Fetch price history for a market token with full typing
   */
  async getPriceHistory(
    query: PriceHistoryQuery
  ): Promise<PriceHistoryResponse> {
    const client = await this.initializeClobClient();

    try {
      const requestParams: PriceHistoryFilterParams = {
        market: query.market,
        interval: query.interval as PriceHistoryInterval,
      };

      // Handle date conversion and time range vs interval
      let startTs = query.startTs;
      let endTs = query.endTs;

      if (!startTs && query.startDate) {
        startTs = Math.floor(new Date(query.startDate).getTime() / 1000);
      }

      if (!endTs && query.endDate) {
        endTs = Math.floor(new Date(query.endDate).getTime() / 1000);
      }

      if (startTs && endTs) {
        requestParams.startTs = startTs;
        requestParams.endTs = endTs;
      }

      if (query.fidelity) {
        requestParams.fidelity = query.fidelity;
      }
      console.log({ requestParams });
      const priceHistory = await client.getPricesHistory(requestParams);
      const historyData = (priceHistory as any)?.history || [];

      if (historyData.length === 0) {
        return {
          history: [],
          timeRange: null,
        };
      }

      // Calculate time range
      const firstPoint = historyData[0];
      const lastPoint = historyData[historyData.length - 1];
      const timeRange =
        firstPoint && lastPoint
          ? {
              start: new Date(firstPoint.t * 1000).toISOString(),
              end: new Date(lastPoint.t * 1000).toISOString(),
            }
          : null;

      return {
        history: historyData.map((point: any) => ({
          t: point.t,
          p: point.p,
        })),
        timeRange,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch price history: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Test CLOB client connection
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: string;
    clob: string;
    error?: string;
    cached?: boolean;
  }> {
    try {
      const wasCached = clobClientCache.has(this.cacheKey);
      await this.initializeClobClient();
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        clob: "connected",
        cached: wasCached,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        clob: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        cached: false,
      };
    }
  }

  /**
   * Clear this client from cache (useful for debugging or forced refresh)
   */
  clearCache(): void {
    clobClientCache.delete(this.cacheKey);
  }

  /**
   * Get cache statistics (static method for global cache info)
   */
  static getCacheStats(): {
    size: number;
    maxSize: number;
    remainingTTL?: number;
  } {
    return {
      size: clobClientCache.size,
      maxSize: clobClientCache.max || 0,
    };
  }

  /**
   * Clear all cached clients (static method for global cache management)
   */
  static clearAllCache(): void {
    clobClientCache.clear();
  }
}
