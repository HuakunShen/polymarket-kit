# Gamma Route Processing

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [markdown-formatters.ts](file://src/utils/markdown-formatters.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Request Validation with Zod-Based Schemas](#request-validation-with-zod-based-schemas)
3. [Middleware Implementation and GammaSDK Initialization](#middleware-implementation-and-gammasdk-initialization)
4. [Route Handlers and Query Parameter Validation](#route-handlers-and-query-parameter-validation)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Special Handling of Markdown Routes](#special-handling-of-markdown-routes)
7. [OpenAPI/Swagger Documentation via Elysia Detail Field](#openapiswagger-documentation-via-elysia-detail-field)

## Introduction
The Gamma route processing system in polymarket-kit provides a robust, type-safe interface to the Polymarket Gamma API. Built on Elysia, it exposes endpoints for retrieving sports data, tags, events, markets, series, comments, and search results. The system emphasizes validation, extensibility, and developer experience through comprehensive schema definitions, middleware-driven SDK instantiation, and rich documentation support.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L50)

## Request Validation with Zod-Based Schemas

All incoming requests to the gammaRoutes Elysia instance are validated using Zod-based schemas imported from `elysia-schemas.ts`. These schemas define the expected structure for query parameters, path parameters, and request bodies across all endpoints.

For example, the `/gamma/events` endpoint uses the `UpdatedEventQuerySchema` to validate query parameters such as `limit`, `offset`, `order`, `ascending`, `id`, `slug`, `tag_id`, `featured`, `archived`, `active`, `closed`, and various date filters. Similarly, the `/gamma/markets` route employs `UpdatedMarketQuerySchema` for market-specific filtering.

Path parameters are validated using Elysia's built-in object schema constructs, such as `t.Object({ id: t.String() })` for numeric IDs passed as strings. Composite schemas like `t.Composite([EventByIdQuerySchema, MarkdownOptionsSchema])` allow merging multiple schema definitions for complex query requirements.

These validations ensure that only properly structured data reaches the business logic layer, reducing runtime errors and improving API reliability.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L100-L150)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L300-L500)

## Middleware Implementation and GammaSDK Initialization

The gammaRoutes instance uses Elysia's `.derive()` middleware to create a `GammaSDK` instance for each incoming request. This ensures isolation between requests and enables per-request configuration.

The middleware inspects the `x-http-proxy` header to determine proxy configuration. If present, the value is parsed using the `parseProxyString()` function, which supports formats like:
- `http://proxy.com:8080`
- `http://user:pass@proxy.com:8080`
- `https://proxy.com:3128`

The `parseProxyString()` function constructs a `ProxyConfigType` object by parsing the URL components (protocol, host, port, username, password). If parsing fails, a warning is logged and the SDK is instantiated without proxy settings.

When no proxy header is provided, the `GammaSDK` is created with default configuration. The resulting SDK instance is attached to the request context and made available to all route handlers via the `gammaSDK` property.

This design allows clients to dynamically route API traffic through proxies without server-side reconfiguration.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L60-L100)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L50-L100)

## Route Handlers and Query Parameter Validation

Key route handlers such as `/gamma/events` and `/gamma/markets` demonstrate the integration of schema validation and SDK invocation.

The `/gamma/events` handler validates query parameters against `UpdatedEventQuerySchema` and invokes `gammaSDK.getEvents(query)`. Similarly, `/gamma/markets` uses `UpdatedMarketQuerySchema` and calls `gammaSDK.getMarkets(query)`.

Each route specifies its validation rules and response types directly in the Elysia route definition. For example:

```ts
.get(
  "/events",
  async ({ query, gammaSDK }) => {
    return await gammaSDK.getEvents(query);
  },
  {
    query: UpdatedEventQuerySchema,
    response: {
      200: t.Array(EventSchema),
      500: ErrorResponseSchema,
    },
    ...
  }
)
```

This pattern ensures type safety from request input to response output, leveraging TypeScript and Elysia’s built-in validation system.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L150-L300)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L400-L450)

## Error Handling Patterns

The system implements consistent error handling across all endpoints. When a resource is not found (e.g., event or market by ID), the route handler sets `set.status = 404` and returns a structured error object. For example:

```ts
if (result === null) {
  set.status = 404;
  return { type: "not found error", error: "id not found" };
}
```

The response schema includes explicit definitions for 404 (`GammaErrorResponseSchema`) and 500 (`ErrorResponseSchema`) status codes. Unhandled exceptions are caught by Elysia and result in 500 responses, while SDK-level errors (e.g., network failures) are propagated as `Error` instances.

This approach ensures predictable client behavior and facilitates automated error recovery.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L350-L400)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L200-L250)

## Special Handling of Markdown Routes

The `/gamma/events/:id/markdown` and `/gamma/events/slug/:slug/markdown` routes support content negotiation based on the `Accept` header. Both routes accept `verbose` (0, 1, 2) and `include_markets` query parameters to control output detail.

Internally, they extract markdown-specific options from the query and invoke `formatEventToMarkdown(result, markdownOptions)` from `markdown-formatters.ts`.

The response format depends on the `Accept` header:
- If `application/json` is requested, returns `{ markdown: "..." }`
- Otherwise, returns plain text with `content-type: text/plain; charset=utf-8`

This dual-format capability enables both machine-readable and human-readable consumption of event data, particularly useful for LLM-based arbitrage analysis.

```mermaid
flowchart TD
A[Request /gamma/events/:id/markdown] --> B{Accept Header Includes application/json?}
B --> |Yes| C[Return JSON: {markdown: \"...\"}]
B --> |No| D[Set Content-Type: text/plain]
D --> E[Return Raw Markdown String]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L500-L550)
- [markdown-formatters.ts](file://src/utils/markdown-formatters.ts#L100-L200)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L500-L550)
- [markdown-formatters.ts](file://src/utils/markdown-formatters.ts#L1-L300)

## OpenAPI/Swagger Documentation via Elysia Detail Field

Each route leverages Elysia's `detail` field to provide metadata for OpenAPI/Swagger documentation generation. The `detail` object includes:
- `tags`: For grouping endpoints in documentation (e.g., "Gamma API - Events")
- `summary`: Brief description of the endpoint
- `description`: Detailed explanation of functionality and use cases

For example, the `/gamma/events/markdown` route includes a description explaining that the endpoint converts event data to markdown format optimized for LLM arbitrage analysis, with support for verbosity levels and conditional market inclusion.

These annotations enable automatic generation of comprehensive API documentation, improving developer onboarding and integration.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L520-L530)