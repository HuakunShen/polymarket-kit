# Runtime Settings

<cite>
**Referenced Files in This Document**   
- [env.ts](file://src/utils/env.ts)
- [client.ts](file://src/sdk/client.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [index.ts](file://src/index.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Server Initialization Parameters](#server-initialization-parameters)
3. [SDK Instance Configuration](#sdk-instance-configuration)
4. [LRU Cache Settings](#lru-cache-settings)
5. [Configuration Flow from Environment to Components](#configuration-flow-from-environment-to-components)
6. [Caching Strategy and Performance Impact](#caching-strategy-and-performance-impact)
7. [Runtime Configuration Examples](#runtime-configuration-examples)
8. [Performance Tuning Guidelines](#performance-tuning-guidelines)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Introduction
This document details the runtime configuration system of the Polymarket Proxy Server, focusing on how settings are applied at runtime across server initialization, SDK clients, and caching layers. The configuration system leverages environment variables processed through the `env.ts` module, which are then propagated to core components including the Elysia server and SDK clients for both CLOB and Gamma APIs. Special attention is given to the LRU caching mechanism used for SDK instances, its configuration parameters, and performance implications.

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [index.ts](file://src/index.ts#L0-L25)

## Server Initialization Parameters
The server initialization parameters such as port number and base URL are derived from environment variables through the `env.ts` utility module. The `getPort()` function reads from `PORT` environment variable (with fallback to `Bun.env.PORT`) and defaults to 3000 if not specified. Similarly, `getBaseUrl()` constructs the base URL using the `BASE_URL` environment variable or creates one using the resolved port number. These values are used during Elysia server instantiation to set up the listening port and construct server metadata.

```mermaid
flowchart TD
A["Environment Variables<br/>PORT, BASE_URL"] --> B["env.ts Module"]
B --> C["getPort()"]
B --> D["getBaseUrl()"]
C --> E["Elysia Server Initialization"]
D --> E
E --> F["Running Server"]
```

**Diagram sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [index.ts](file://src/index.ts#L23-L76)

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [index.ts](file://src/index.ts#L23-L76)

## SDK Instance Configuration
SDK instances for both CLOB and Gamma APIs are configured with runtime parameters that affect their behavior. The `PolymarketSDK` class accepts configuration including `privateKey`, `funderAddress`, `host`, and `chainId`, with sensible defaults applied when optional parameters are omitted. The `GammaSDK` class supports proxy configuration through the `proxy` parameter, allowing HTTP/HTTPS proxy settings to be specified at runtime. Request timeouts are managed by the underlying `fetch` implementation and can be influenced by environment variables like `HTTP_PROXY` and `HTTPS_PROXY` when proxy configuration is active.

**Section sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L799)

## LRU Cache Settings
The CLOB client implements an LRU (Least Recently Used) cache to optimize performance by reusing initialized client instances. The cache configuration is controlled through environment variables: `CLOB_CLIENT_CACHE_MAX_SIZE` sets the maximum number of cached clients (default: 100), and `CLOB_CLIENT_CACHE_TTL_MINUTES` determines the time-to-live for cached entries (default: 30 minutes). The `updateAgeOnGet: true` option ensures that accessing a cached client resets its TTL, prioritizing frequently used clients. Cache statistics including current size and maximum capacity can be retrieved via the static `getCacheStats()` method.

```mermaid
classDiagram
class LRUCacheConfig {
+max : number
+ttl : number
+updateAgeOnGet : boolean
}
class PolymarketSDK {
-config : ResolvedClobClientConfig
-cacheKey : string
+healthCheck() : Promise~HealthResponse~
+clearCache() : void
+getPriceHistory(query) : Promise~PriceHistoryResponse~
+getBook(tokenId) : Promise~OrderBookSummary~
+getMidpoint(tokenId) : Promise~number~
+getTrades(params) : Promise~Trade[]~
+getMarkets() : Promise~PaginationPayload~
+getSamplingMarkets() : Promise~PaginationPayload~
+getSimplifiedMarkets() : Promise~PaginationPayload~
+getSamplingSimplifiedMarkets() : Promise~PaginationPayload~
+getMarket(conditionId) : Promise~any~
+getSpreads(params) : Promise~number[]~
+getPrices(params) : Promise~number[]~
+getOrderBooks(params) : Promise~OrderBookSummary[]~
+getPrice(tokenId, side) : Promise~number~
+getMidpoints(params) : Promise~number[]~
+clearCache() : void
+getCacheStats() : CacheStats
+clearAllCache() : void
}
class CacheManager {
+size : number
+maxSize : number
+getCacheStats() : CacheStats
+clearAllCache() : void
}
LRUCacheConfig --> PolymarketSDK : "configures"
PolymarketSDK --> CacheManager : "implements"
```

**Diagram sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)

**Section sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)

## Configuration Flow from Environment to Components
Runtime settings flow from environment variables through the `env.ts` module to core components in a structured manner. Environment variables are first accessed by utility functions in `env.ts`, which provide default values when variables are not set. These values are then passed to the Elysia server during initialization in `index.ts`. For SDK clients, configuration objects are constructed with environment-derived defaults and passed to their constructors. The Gamma SDK additionally supports dynamic proxy configuration through HTTP headers (`x-http-proxy`), which overrides static configuration when present.

```mermaid
sequenceDiagram
participant Env as Environment Variables
participant EnvModule as env.ts
participant Server as Elysia Server
participant ClobSDK as PolymarketSDK
participant GammaSDK as GammaSDK
participant Client as API Client
Env->>EnvModule : PORT, BASE_URL
EnvModule->>Server : getPort(), getBaseUrl()
Server->>Server : Initialize with port/base URL
Client->>GammaSDK : Request with x-http-proxy header
GammaSDK->>Env : HTTP_PROXY, HTTPS_PROXY
Env->>GammaSDK : Proxy configuration
GammaSDK->>GammaSDK : Create fetch with proxy
Env->>ClobSDK : CLOB_CLIENT_CACHE_MAX_SIZE, TTL
ClobSDK->>ClobSDK : Initialize LRU Cache
```

**Diagram sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [index.ts](file://src/index.ts#L0-L165)
- [client.ts](file://src/sdk/client.ts#L0-L387)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L799)

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [index.ts](file://src/index.ts#L0-L165)
- [client.ts](file://src/sdk/client.ts#L0-L387)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L799)

## Caching Strategy and Performance Impact
The caching strategy centers around the LRU cache implementation in the `PolymarketSDK` class, which stores initialized CLOB client instances keyed by a combination of `privateKey`, `host`, `chainId`, and `funderAddress`. This strategy significantly reduces initialization overhead for repeated requests with the same credentials, as client authentication and API key derivation are expensive operations. The cache improves performance by avoiding redundant network calls and cryptographic operations. With `updateAgeOnGet: true`, frequently accessed clients are kept in the cache longer, optimizing for hot paths. The Gamma SDK does not implement client-level caching but relies on HTTP-level caching and connection pooling through the underlying `fetch` implementation.

**Section sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)

## Runtime Configuration Examples
The configuration system demonstrates how environment variables translate to runtime behavior. For server settings, setting `PORT=8080` and `BASE_URL=https://api.example.com` results in the server listening on port 8080 with the specified base URL. For caching, setting `CLOB_CLIENT_CACHE_MAX_SIZE=200` and `CLOB_CLIENT_CACHE_TTL_MINUTES=60` doubles the cache capacity and extends the TTL to one hour. Proxy configuration for the Gamma SDK can be achieved by setting the `x-http-proxy` header to values like `http://proxy.example.com:8080` or `http://user:pass@proxy.example.com:3128`, which are parsed and applied to outbound requests.

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L799)
- [client.ts](file://src/sdk/client.ts#L0-L387)

## Performance Tuning Guidelines
To optimize performance and reliability, consider the following tuning guidelines:
- Increase `CLOB_CLIENT_CACHE_MAX_SIZE` in high-concurrency environments with many unique users to reduce client initialization overhead
- Adjust `CLOB_CLIENT_CACHE_TTL_MINUTES` based on expected session duration; longer TTLs benefit sustained usage patterns
- Monitor cache hit rates using `getCacheStats()` to validate cache effectiveness
- For proxy configurations, ensure proxy servers are reliable and have adequate bandwidth to avoid becoming a bottleneck
- Set appropriate timeouts at the network level (not directly configurable in current implementation) to prevent hanging requests
- Consider the trade-off between memory usage (larger cache) and freshness of client state when tuning cache parameters

**Section sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)

## Troubleshooting Common Issues
Common runtime configuration issues include cache misses and connection timeouts. Cache misses can occur when the cache size is too small for the workload or when client configurations frequently change; monitor `getCacheStats()` to identify this issue and adjust `CLOB_CLIENT_CACHE_MAX_SIZE` accordingly. Connection timeouts may result from network issues, overloaded proxy servers, or unreachable API endpoints; check proxy configuration validity and network connectivity. Invalid proxy URLs in the `x-http-proxy` header will trigger warnings but fall back to direct connections. Authentication failures in CLOB operations typically indicate incorrect `privateKey` or `funderAddress` values. Server startup failures often relate to invalid port numbers or permission issues on the specified port.

**Section sources**
- [client.ts](file://src/sdk/client.ts#L0-L387)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L0-L799)
- [index.ts](file://src/index.ts#L0-L165)