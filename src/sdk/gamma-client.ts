/**
 * Polymarket Gamma API SDK Client
 *
 * A fully typed wrapper SDK for Polymarket Gamma API endpoints.
 * Provides type-safe methods for fetching markets and events without requiring credentials.
 * This is a standalone client that doesn't require CLOB authentication.
 */

// TypeBox validation is handled by Elysia internally
// For SDK validation, we'll use a simple type-safe approach without runtime validation
import {
  type MarketType as Market,
  type EventType as Event,
  type MarketQueryType as MarketQuery,
  type EventQueryType as EventQuery,
} from "../types/elysia-schemas";

export class GammaSDK {
  private readonly gammaApiBase = "https://gamma-api.polymarket.com";

  /**
   * Fetch markets from Gamma API with full typing and validation
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
          "Expected array response from Gamma API markets endpoint"
        );
      }

      // Type-safe transformation - runtime validation is handled by Elysia routes
      return data.map((item) => item as Market);
    } catch (error) {
      throw new Error(
        `Failed to fetch markets: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Fetch events from Gamma API with full typing and validation
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
          "Expected array response from Gamma API events endpoint"
        );
      }

      // Type-safe transformation - runtime validation is handled by Elysia routes
      return data.map((item) => item as Event);
    } catch (error) {
      throw new Error(
        `Failed to fetch events: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get a specific market by ID
   */
  async getMarketById(id: string): Promise<Market | null> {
    const markets = await this.getMarkets({ id });
    return markets.length > 0 ? (markets[0] ?? null) : null;
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    const events = await this.getEvents({ id });
    return events.length > 0 ? (events[0] ?? null) : null;
  }

  /**
   * Get markets by slug
   */
  async getMarketBySlug(slug: string): Promise<Market | null> {
    const markets = await this.getMarkets({ slug });
    return markets.length > 0 ? (markets[0] ?? null) : null;
  }

  /**
   * Get events by slug
   */
  async getEventBySlug(slug: string): Promise<Event | null> {
    const events = await this.getEvents({ slug });
    return events.length > 0 ? (events[0] ?? null) : null;
  }

  /**
   * Get active markets
   */
  async getActiveMarkets(
    query: Omit<MarketQuery, "active"> = {}
  ): Promise<Market[]> {
    return this.getMarkets({ ...query, active: "true" });
  }

  /**
   * Get active events
   */
  async getActiveEvents(
    query: Omit<EventQuery, "active"> = {}
  ): Promise<Event[]> {
    return this.getEvents({ ...query, active: "true" });
  }

  /**
   * Get closed markets
   */
  async getClosedMarkets(
    query: Omit<MarketQuery, "closed"> = {}
  ): Promise<Market[]> {
    return this.getMarkets({ ...query, closed: "true" });
  }

  /**
   * Get closed events
   */
  async getClosedEvents(
    query: Omit<EventQuery, "closed"> = {}
  ): Promise<Event[]> {
    return this.getEvents({ ...query, closed: "true" });
  }
}