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
import { Elysia } from "elysia";
import { clobRoutes } from "./routes/clob";
import { gammaRoutes } from "./routes/gamma";

export const PORT = process.env.PORT || Bun.env.PORT || 3000;

export const app = new Elysia()
	// Add CORS support
	.use(
		cors({
			origin: true, // Allow all origins in development
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		}),
	)

	// Add Swagger/OpenAPI documentation
	.use(
		swagger({
			documentation: {
				info: {
					title: "Polymarket Proxy API",
					version: "1.0.0",
					description:
						"A fully typed proxy server for Polymarket CLOB and Gamma APIs. Provides type-safe endpoints with comprehensive validation and automatic OpenAPI schema generation.",
					contact: {
						name: "API Support",
						url: "https://github.com/your-repo/polymarket-strategy",
					},
				},
				tags: [
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
				servers: [
					{
						url: process.env.BASE_URL || `http://localhost:${PORT}`,
						description: "Development server",
					},
				],
			},
			path: "/docs",
		}),
	)

	// Global error handler
	.onError(({ code, error, set }) => {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(`[${code}] ${errorMessage}`);

		switch (code) {
			case "VALIDATION":
				set.status = 400;
				return {
					error: "Bad Request",
					message: "Invalid request parameters or body",
					details: errorMessage,
				};

			case "NOT_FOUND":
				set.status = 404;
				return {
					error: "Not Found",
					message: "The requested resource was not found",
				};

			case "PARSE":
				set.status = 400;
				return {
					error: "Bad Request",
					message: "Invalid JSON in request body",
				};

			default:
				set.status = 500;
				return {
					error: "Internal Server Error",
					message: "An unexpected error occurred",
				};
		}
	})

	// Root endpoint with API information
	.get(
		"/",
		() => ({
			name: "Polymarket Proxy API",
			version: "1.0.0",
			description: "A fully typed proxy server for Polymarket APIs",
			endpoints: {
				documentation: "/docs",
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
		},
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
		},
	)

	// Mount route modules
	.use(gammaRoutes)
	.use(clobRoutes);

export type App = typeof app;
