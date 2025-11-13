/**
 * Polymarket Proxy Server
 *
 * A fully typed translation proxy server built with Elysia for Polymarket APIs.
 * Provides type-safe endpoints for both CLOB and Gamma APIs with comprehensive
 * validation and OpenAPI schema generation.
 *
 * Features:
 * - Fully typed request/response validation using Elysia's built-in type system
 * - CORS support for web applications
 * - Comprehensive error handling
 * - OpenAPI/Swagger documentation generation
 * - Health checks and monitoring endpoints
 */

import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { app as baseApp } from "./server";
import { getBaseUrl, getPort } from "./utils/env";

export const PORT = getPort();
const baseUrl = getBaseUrl();
const _isLocalhost = baseUrl.includes("localhost");

// Standalone app with all middleware for backward compatibility
export const app = baseApp
  // Add CORS support
  .use(
    cors({
      origin: true, // Allow all origins in development
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  .use(openapi({}))
  // Add Swagger/OpenAPI documentation
  .use(
    swagger({
      documentation: {
        // openapi: "3.0.0",
        info: {
          title: "Polymarket Proxy API",
          version: "1.0.0",
          description:
            "A fully typed proxy server for Polymarket CLOB, Gamma, and Data APIs. Provides type-safe endpoints with comprehensive validation and automatic OpenAPI schema generation.",
          contact: {
            name: "API Support",
            url: "https://github.com/your-repo/polymarket-strategy",
          },
        },
        tags: [
          {
            name: "Data API",
            description:
              "User data, positions, and analytics from data-api.polymarket.com",
          },
          {
            name: "Gamma API",
            description: "Market and event data from gamma-api.polymarket.com",
          },
          {
            name: "CLOB API",
            description: "Trading and price history from CLOB client",
          },
          {
            name: "System",
            description: "Health checks and system information",
          },
        ],
        // servers: [
        //   {
        //     url: baseUrl,
        //     description: isLocalhost
        //       ? "Development server"
        //       : "Production server",
        //   },
        // ],
      },
      path: "/docs",
    })
  ) // Root endpoint with API information
  .get(
    "/",
    () => ({
      name: "Polymarket Proxy API",
      version: "1.0.0",
      description: "A fully typed proxy server for Polymarket APIs",
      endpoints: {
        documentation: "/docs",
        data_api: "/data",
        gamma_api: "/gamma",
        clob_api: "/clob",
        health: "/health",
      },
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["System"],
        summary: "API Information",
        description:
          "Get basic information about the API and available endpoints",
      },
    }
  )

  // Global health endpoint
  .get(
    "/health",
    () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
    }),
    {
      detail: {
        tags: ["System"],
        summary: "Health Check",
        description: "Get the health status of the proxy server",
      },
    }
  );

export type App = typeof app;
export { app as polymarketProxyServer };
