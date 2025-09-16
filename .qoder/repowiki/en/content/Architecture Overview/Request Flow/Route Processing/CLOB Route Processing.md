# CLOB Route Processing

<cite>
**Referenced Files in This Document**   
- [clob.ts](file://src/routes/clob.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [client.ts](file://src/sdk/client.ts)
- [env.ts](file://src/utils/env.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [CLOB Route Authentication and SDK Initialization](#clob-route-authentication-and-sdk-initialization)
3. [SDK Instance Caching Mechanism](#sdk-instance-caching-mechanism)
4. [Parameter Validation with Zod Schemas](#parameter-validation-with-zod-schemas)
5. [Route Handlers and Request Processing](#route-handlers-and-request-processing)
6. [Error Handling Strategies](#error-handling-strategies)
7. [Cache Statistics Endpoint](#cache-statistics-endpoint)
8. [Authentication Requirements Across Environments](#authentication-requirements-across-environments)

## Introduction
This document provides a comprehensive analysis of the CLOB route processing system in the polymarket-kit repository. It details how the clobRoutes Elysia instance handles authentication, manages SDK instances through caching, validates parameters, processes requests, and handles errors. The system is designed to provide a robust, type-safe interface to the Polymarket CLOB API with efficient credential management and performance optimization through caching.

## CLOB Route Authentication and SDK Initialization

The clobRoutes Elysia instance uses the `.resolve()` middleware to authenticate requests and instantiate PolymarketSDK instances. This middleware extracts credentials from request headers or environment variables, depending on the environment mode.

In development mode (when `NODE_ENV` is "development" or not set), the system first attempts to extract credentials from the `x-polymarket-key` and `x-polymarket-funder` headers. If these headers are not present, it falls back to environment variables `POLYMARKET_KEY` and `POLYMARKET_FUNDER`. This fallback mechanism allows for easier local development and testing without requiring headers on every request.

In production mode, the system strictly requires the `x-polymarket-key` and `x-polymarket-funder` headers to be present in the request. This ensures that each request is properly authenticated and associated with the appropriate user credentials, enhancing security in a production environment.

The `.resolve()` middleware throws descriptive errors when required credentials are missing, with different error messages for development and production modes to guide developers appropriately. Once credentials are obtained, the middleware calls the `getPolymarketSDK()` function to retrieve or create a PolymarketSDK instance, which is then made available to all route handlers through the request context.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L9-L115)

## SDK Instance Caching Mechanism

The system implements an LRU (Least Recently Used) cache for PolymarketSDK instances to optimize performance and reduce redundant initialization. The cache is implemented using the `lru-cache` library and is configured through environment variables.

The cache, named `sdkCache`, is initialized with a maximum size determined by the `SDK_CACHE_MAX_SIZE` environment variable (defaulting to 50 if not set) and a TTL (Time To Live) determined by the `SDK_CACHE_TTL_HOURS` environment variable (defaulting to 1 hour if not set). The `updateAgeOnGet: true` option ensures that the TTL is reset whenever a cached SDK instance is accessed, effectively keeping frequently used instances in the cache longer.

Cache keys are derived from a combination of the private key, funder address, host, and chain ID, ensuring that each unique set of credentials and configuration parameters has its own cached SDK instance. This prevents credential mixing and ensures that each user's operations are isolated.

The `getPolymarketSDK()` function implements the cache lookup and creation logic. It first checks if a cached SDK instance exists for the given credentials. If found, it returns the cached instance. If not, it creates a new PolymarketSDK instance with the provided credentials, stores it in the cache, and returns it. This reuse logic significantly reduces the overhead of SDK initialization, particularly the costly process of establishing authenticated connections to the CLOB API.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L17-L57)
- [client.ts](file://src/sdk/client.ts#L58-L101)

## Parameter Validation with Zod Schemas

The system employs comprehensive parameter validation using TypeBox schemas defined in the `elysia-schemas.ts` file. These schemas ensure that all incoming requests conform to the expected structure and data types before being processed by the route handlers.

Key validation schemas include:
- `PriceHistoryQuerySchema`: Validates parameters for price history requests, including the required `market` parameter and optional time range parameters (`startTs`, `endTs`, `startDate`, `endDate`), interval, and fidelity.
- `BookParamsSchema`: Validates parameters for order book requests, requiring a `token_id` and a `side` parameter that must be either "BUY" or "SELL".
- `TokenParamsSchema`: Validates simple token ID parameters for endpoints that don't require a side parameter.
- `TradeParamsSchema`: Validates parameters for trade queries, including optional filters like `id`, `maker_address`, `market`, and `asset_id`.

These schemas are integrated directly into the Elysia route definitions, providing automatic validation of query parameters, request body, and headers. When validation fails, Elysia automatically returns a 400 Bad Request response with details about the validation error. This declarative approach to validation ensures consistency across endpoints and reduces the risk of invalid data reaching the business logic layer.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L300-L450)
- [clob.ts](file://src/routes/clob.ts#L117-L120)

## Route Handlers and Request Processing

The CLOB route handlers process incoming requests by transforming parameters as needed and invoking the appropriate PolymarketSDK methods. Each route is designed to handle specific CLOB operations with proper error handling and response formatting.

Key route handlers include:
- `/clob/prices-history`: Handles price history requests by passing the validated query parameters directly to the `getPriceHistory()` method of the PolymarketSDK instance. The route supports various time range specifications and interval options.
- `/clob/book/:tokenId`: Retrieves the order book for a specific token ID. The route extracts the `tokenId` from the URL parameters and passes it to the `getBook()` method. It includes special error handling for cases where no orderbook exists, returning a 404 status code.
- `/clob/orderbooks`: Handles batch requests for multiple order books. The route transforms the request body by mapping string "BUY"/"SELL" values to the appropriate `Side` enum values from the `@polymarket/clob-client` package before calling `getOrderBooks()`.
- `/clob/prices`: Similar to `/clob/orderbooks`, this route transforms the request body to map side strings to enum values before calling `getPrices()`.

The parameter transformation is particularly important for routes that accept side parameters, as the external API uses string values ("BUY", "SELL") while the underlying SDK expects enum values. This transformation ensures compatibility between the API interface and the SDK implementation.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L122-L500)

## Error Handling Strategies

The system implements a comprehensive error handling strategy that maps different types of errors to appropriate HTTP status codes and structured error responses. This ensures consistent and informative error reporting to API consumers.

The error handling occurs at multiple levels:
1. **Validation errors**: Handled automatically by Elysia, resulting in 400 Bad Request responses with details about the validation failure.
2. **Authentication errors**: Result in 400 Bad Request responses when required credentials are missing, with environment-specific error messages to guide developers.
3. **Resource not found errors**: Specifically handled in the `/clob/book/:tokenId` route, where "No orderbook exists" errors are mapped to 404 Not Found status codes.
4. **Internal server errors**: All other errors are mapped to 500 Internal Server Error status codes, with the error message included in the response.

The error responses follow a consistent structure defined by the `ErrorResponseSchema`, which includes an `error` field with the error type, a `message` field with a human-readable description, and an optional `details` field with additional information. This standardized format makes it easier for clients to parse and handle errors programmatically.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L250-L260)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L250-L260)

## Cache Statistics Endpoint

The `/clob/cache/stats` endpoint provides visibility into the caching system by exposing metrics for both SDK instances and CLOB clients. This endpoint is valuable for monitoring system performance and diagnosing caching issues.

The endpoint returns a JSON response containing:
- `sdkCache`: Statistics for the SDK instance cache, including current size and maximum size
- `clobClientCache`: Statistics for the CLOB client cache, including current size and maximum size
- `timestamp`: The time when the statistics were collected

The SDK cache statistics are obtained directly from the `sdkCache` LRU cache instance, while the CLOB client cache statistics are retrieved through the static `PolymarketSDK.getCacheStats()` method. This method accesses the global `clobClientCache` to provide information about cached CLOB client instances.

The endpoint is particularly useful for debugging and performance tuning, allowing developers and operators to understand cache utilization and make informed decisions about cache configuration (size, TTL) based on actual usage patterns.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L230-L240)
- [client.ts](file://src/sdk/client.ts#L350-L365)

## Authentication Requirements Across Environments

The authentication system differentiates between development and production environments to balance security and developer convenience. This distinction is controlled by the `NODE_ENV` environment variable.

In development mode, the system allows credentials to be provided either through headers or environment variables. This flexibility enables easier testing and debugging, as developers can configure credentials once in environment variables rather than including them in every request header. The fallback mechanism ensures that the system remains functional even if headers are omitted.

In production mode, the system enforces strict header-based authentication, requiring both `x-polymarket-key` and `x-polymarket-funder` headers on every request. This ensures that each request is explicitly authenticated and associated with the appropriate user, preventing accidental credential sharing and enhancing security.

When credentials are missing, the system provides descriptive error messages that differ between environments. In development, the error message includes information about the fallback to environment variables, guiding developers on how to properly configure their environment. In production, the error message is more concise, simply stating that the headers are required, which is appropriate for external API consumers.

This dual-mode authentication approach strikes a balance between developer experience and production security, making the system both easy to work with during development and secure when deployed.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L9-L115)
- [env.ts](file://src/utils/env.ts#L0-L3)