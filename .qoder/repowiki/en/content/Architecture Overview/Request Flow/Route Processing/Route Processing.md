# Route Processing

<cite>
**Referenced Files in This Document**   
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [clob.ts](file://src/routes/clob.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [client.ts](file://src/sdk/client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Parameter Validation with Zod Schemas](#parameter-validation-with-zod-schemas)
3. [Dependency Injection via Elysia's derive and resolve](#dependency-injection-via-elysias-derive-and-resolve)
4. [/clob/prices-history Route Analysis](#clobprices-history-route-analysis)
5. [Error Handling and HTTP Status Codes](#error-handling-and-http-status-codes)
6. [Conclusion](#conclusion)

## Introduction
The route processing phase in polymarket-kit implements a robust, type-safe API layer using Elysia, a TypeScript-first framework. This system handles incoming HTTP requests through well-defined routes that validate parameters, inject dependencies, and delegate to SDKs for data retrieval. The architecture separates concerns between authenticated CLOB operations and public Gamma API access, with distinct middleware for credential management and proxy configuration. This document details how route handlers validate parameters using Zod-based schemas, derive SDK instances through middleware, and handle errors appropriately across development and production environments.

## Parameter Validation with Zod Schemas
Route handlers in polymarket-kit validate incoming parameters using Elysia's built-in validation system with schemas defined in `elysia-schemas.ts`. These schemas, built using Elysia's `t` utility, define the expected structure for query parameters, path parameters, request bodies, and headers. For example, the `PriceHistoryQuerySchema` validates parameters for the `/clob/prices-history` endpoint, requiring a `market` parameter while making `startTs`, `endTs`, `startDate`, `endDate`, `interval`, and `fidelity` optional. The schema enforces type correctness, ensuring that `market` is a string, timestamps are numbers, and intervals conform to a specific enum of allowed values ("1m", "1h", "6h", "1d", "1w", "max"). This declarative approach to validation occurs automatically before the route handler executes, guaranteeing that the handler receives only correctly typed and structured data.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L300-L350)

## Dependency Injection via Elysia's derive and resolve
The polymarket-kit leverages Elysia's `derive` and `resolve` methods for dependency injection, creating SDK instances within route middleware. The `gammaRoutes` module uses `derive` to create a `GammaSDK` instance for each request. This middleware checks for an `x-http-proxy` header; if present, it parses the proxy configuration (supporting formats like `http://user:pass@proxy.com:8080`) and initializes the `GammaSDK` with this proxy. If the header is absent, the SDK is created without proxy configuration. This allows clients to route Gamma API traffic through custom proxies for enhanced privacy or access control. Conversely, the `clobRoutes` module uses `resolve` to create a `PolymarketSDK` instance. This process extracts credentials from the `x-polymarket-key` and `x-polymarket-funder` headers. In development mode, it falls back to environment variables (`POLYMARKET_KEY`, `POLYMARKET_FUNDER`) if headers are missing, providing developer convenience. In production, these headers are strictly required, enforcing secure credential transmission. Both SDKs are cached using LRU caches to avoid redundant initialization, improving performance for repeated requests with the same credentials or proxy settings.

```mermaid
sequenceDiagram
participant Client
participant Elysia
participant gammaRoutes
participant clobRoutes
participant GammaSDK
participant PolymarketSDK
Client->>Elysia : GET /gamma/events
Elysia->>gammaRoutes : Request with headers
gammaRoutes->>gammaRoutes : Check x-http-proxy header
alt Proxy Header Present
gammaRoutes->>GammaSDK : Create with proxy config
else No Proxy Header
gammaRoutes->>GammaSDK : Create without proxy
end
gammaRoutes->>Elysia : Return {gammaSDK}
Elysia->>GammaSDK : Call getEvents(query)
GammaSDK->>Client : Return event data
Client->>Elysia : GET /clob/prices-history
Elysia->>clobRoutes : Request with headers
clobRoutes->>clobRoutes : Extract x-polymarket-key/funder
alt Production Mode
clobRoutes->>clobRoutes : Require headers
else Development Mode
clobRoutes->>clobRoutes : Fallback to env vars
end
clobRoutes->>PolymarketSDK : Create with credentials
clobRoutes->>Elysia : Return {polymarketSDK}
Elysia->>PolymarketSDK : Call getPriceHistory(query)
PolymarketSDK->>Client : Return price history
```

**Diagram sources **
- [gamma.ts](file://src/routes/gamma.ts#L45-L55)
- [clob.ts](file://src/routes/clob.ts#L25-L75)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L45-L55)
- [clob.ts](file://src/routes/clob.ts#L25-L75)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L25-L50)
- [client.ts](file://src/sdk/client.ts#L50-L80)

## /clob/prices-history Route Analysis
The `/clob/prices-history` route exemplifies the integration of parameter validation and dependency injection. Its handler, defined in `clob.ts`, is configured with the `PriceHistoryQuerySchema` for query validation and expects a `polymarketSDK` instance injected via the `resolve` middleware. When a request arrives, Elysia first validates the query parameters against the schema. Upon successful validation, the handler calls `polymarketSDK.getPriceHistory()` with the validated query object. The `PolymarketSDK` internally handles the conversion of human-readable dates (`startDate`, `endDate`) to Unix timestamps (`startTs`, `endTs`) and manages the CLOB client authentication. The route's response schema (`PriceHistoryResponseSchema`) defines the expected output structure, including an array of price points and an optional time range object. This ensures a consistent and predictable API contract for clients.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L80-L120)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L300-L350)

## Error Handling and HTTP Status Codes
Error handling within route handlers is explicit and maps to appropriate HTTP status codes. Handlers use Elysia's `set` object to modify the response status. For instance, if the `getBook` endpoint receives a `tokenId` for which no order book exists, the underlying API returns an error. The route handler catches this, sets the status to 404 (Not Found), and throws a descriptive error. Similarly, the `health` endpoint sets the status to 503 (Service Unavailable) if the health check returns "unhealthy". For missing credentials, the behavior differs between environments: in production, a missing `x-polymarket-key` header results in a 400 (Bad Request) error with a message stating the header is required. In development, the system attempts to use environment variables, and only if both the header and environment variables are missing does it throw an error, also resulting in a 400 response. This ensures security in production while maintaining developer flexibility. All errors are structured according to the `ErrorResponseSchema`, providing a consistent format with `error`, `message`, and optional `details` fields.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L200-L220)
- [clob.ts](file://src/routes/clob.ts#L150-L170)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L250-L260)

## Conclusion
The route processing phase in polymarket-kit demonstrates a well-architected approach to building a secure and type-safe API. By leveraging Elysia's validation and dependency injection features, it ensures data integrity and separates concerns effectively. The use of Zod-based schemas provides compile-time and runtime type safety, while the `derive` and `resolve` methods enable flexible middleware for SDK creation with proxy and credential management. The distinction between development and production modes for credential handling improves developer experience without compromising security. Comprehensive error handling with appropriate HTTP status codes ensures clients receive clear and actionable feedback. This design results in a robust, maintainable, and developer-friendly API layer for interacting with Polymarket's CLOB and Gamma services.