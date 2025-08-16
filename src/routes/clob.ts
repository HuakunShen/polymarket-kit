/**
 * CLOB API Routes
 *
 * This file handles all routes for the Polymarket CLOB API operations.
 * Provides typed endpoints for price history and other CLOB client operations.
 * Uses the fully typed Polymarket SDK for improved type safety.
 *
 * In production mode, credentials are read from headers (x-polymarket-key, x-polymarket-funder).
 * In development mode, falls back to environment variables.
 */

import { Elysia, t } from "elysia";
import { PolymarketSDK } from "../sdk/";
import { LRUCache } from "lru-cache";
import {
  PriceHistoryQuerySchema,
  PriceHistoryResponseSchema,
} from "../types/elysia-schemas";

// Cache for SDK instances to avoid creating them on every request
// Key: "privateKey_funderAddress", Value: PolymarketSDK instance
const sdkCache = new LRUCache<string, PolymarketSDK>({
  max: parseInt(process.env.SDK_CACHE_MAX_SIZE || "50", 10),
  ttl: parseInt(process.env.SDK_CACHE_TTL_HOURS || "1", 10) * 60 * 60 * 1000,
  updateAgeOnGet: true, // Reset TTL when SDK is accessed
});

const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

/**
 * Get or create Polymarket SDK instance with caching
 */
function getPolymarketSDK(
  privateKey: string,
  funderAddress: string
): PolymarketSDK {
  const cacheKey = `${privateKey}_${funderAddress}`;

  // Check cache first
  const cachedSDK = sdkCache.get(cacheKey);
  if (cachedSDK) {
    return cachedSDK;
  }

  // Create new SDK and cache it
  const sdk = new PolymarketSDK({
    privateKey,
    funderAddress,
  });

  sdkCache.set(cacheKey, sdk);
  return sdk;
}

/**
 * Create CLOB API routes with proper typing and validation
 */
export const clobRoutes = new Elysia({ prefix: "/clob" })
  .resolve(async ({ headers }) => {
    let privateKey: string;
    let funderAddress: string;

    if (isDevelopment) {
      // In development, use environment variables as fallback
      privateKey =
        (headers["x-polymarket-key"] as string) ||
        process.env.POLYMARKET_KEY ||
        Bun.env.POLYMARKET_KEY ||
        "";
      funderAddress =
        (headers["x-polymarket-funder"] as string) ||
        process.env.POLYMARKET_FUNDER ||
        Bun.env.POLYMARKET_FUNDER ||
        "";
    } else {
      // In production, require headers
      privateKey = headers["x-polymarket-key"] as string;
      funderAddress = (headers["x-polymarket-funder"] as string) || "";
    }

    if (!privateKey) {
      throw new Error(
        isDevelopment
          ? "POLYMARKET_KEY environment variable or x-polymarket-key header is required"
          : "x-polymarket-key header is required"
      );
    }

    if (!funderAddress) {
      throw new Error(
        isDevelopment
          ? "POLYMARKET_FUNDER environment variable or x-polymarket-funder header is required"
          : "x-polymarket-funder header is required"
      );
    }

    const polymarketSDK = getPolymarketSDK(privateKey, funderAddress);

    return {
      polymarketSDK,
    };
  })
  .get(
    "/prices-history",
    async ({ query, set, polymarketSDK }) => {
      try {
        return await polymarketSDK.getPriceHistory({
          market: query.market,
          startTs: query.startTs,
          endTs: query.endTs,
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval,
          fidelity: query.fidelity,
        });
      } catch (err) {
        set.status = 500;
        throw new Error(
          err instanceof Error ? err.message : "Unknown error occurred"
        );
      }
    },
    {
      query: PriceHistoryQuerySchema,
      headers: t.Object({
        "x-polymarket-key": t.Optional(
          t.String({
            description:
              "Polymarket private key for CLOB authentication (required in production, optional in development)",
          })
        ),
        "x-polymarket-funder": t.Optional(
          t.String({
            description:
              "Polymarket funder address for CLOB operations (required in production, optional in development)",
          })
        ),
      }),
      response: {
        200: PriceHistoryResponseSchema,
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
        tags: ["CLOB API"],
        summary: "Get price history",
        description:
          "Retrieve price history for a specific token via market query parameter. Supports interval-based queries (1m, 1h, 6h, 1d, 1w, max) or time range queries. Time ranges can be specified using Unix timestamps (startTs, endTs in seconds) or human-readable dates (startDate, endDate like '2025-08-13' or '2025-08-13T00:00:00.000Z'). Optional fidelity parameter controls data resolution in minutes. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables).",
      },
    }
  )

  .get(
    "/health",
    async ({ set, polymarketSDK }) => {
      try {
        const health = await polymarketSDK.healthCheck();
        if (health.status === "unhealthy") {
          set.status = 503;
        }
        return health;
      } catch (err) {
        set.status = 503;
        throw new Error(err instanceof Error ? err.message : "Unknown error");
      }
    },
    {
      headers: t.Object({
        "x-polymarket-key": t.Optional(
          t.String({
            description:
              "Polymarket private key for CLOB authentication (required in production, optional in development)",
          })
        ),
        "x-polymarket-funder": t.Optional(
          t.String({
            description:
              "Polymarket funder address for CLOB operations (required in production, optional in development)",
          })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Union([t.Literal("healthy"), t.Literal("unhealthy")]),
          timestamp: t.String(),
          clob: t.String(),
          cached: t.Optional(t.Boolean()),
          error: t.Optional(t.String()),
        }),
        503: t.Object({
          status: t.Literal("unhealthy"),
          timestamp: t.String(),
          clob: t.String(),
          error: t.String(),
        }),
      },
      detail: {
        tags: ["CLOB API"],
        summary: "Health check",
        description:
          "Check the health status of CLOB client connection. Headers x-polymarket-key and x-polymarket-funder are required in production, optional in development (falls back to environment variables). Response includes cache status.",
      },
    }
  )

  .get(
    "/cache/stats",
    async () => {
      return {
        sdkCache: {
          size: sdkCache.size,
          maxSize: sdkCache.max || 0,
        },
        clobClientCache: PolymarketSDK.getCacheStats(),
        timestamp: new Date().toISOString(),
      };
    },
    {
      response: {
        200: t.Object({
          sdkCache: t.Object({
            size: t.Number(),
            maxSize: t.Number(),
          }),
          clobClientCache: t.Object({
            size: t.Number(),
            maxSize: t.Number(),
          }),
          timestamp: t.String(),
        }),
      },
      detail: {
        tags: ["CLOB API"],
        summary: "Cache statistics",
        description:
          "Get cache statistics for SDK instances and CLOB clients. Shows current cache size and limits.",
      },
    }
  )

  .delete(
    "/cache",
    async () => {
      sdkCache.clear();
      PolymarketSDK.clearAllCache();
      return {
        message: "All caches cleared",
        timestamp: new Date().toISOString(),
      };
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
          timestamp: t.String(),
        }),
      },
      detail: {
        tags: ["CLOB API"],
        summary: "Clear all caches",
        description:
          "Clear all cached SDK instances and CLOB clients. Useful for debugging or forced refresh.",
      },
    }
  );
