# Proxy Mechanism

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [clob.ts](file://src/routes/clob.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [env.ts](file://src/utils/env.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Proxy Architecture Overview](#proxy-architecture-overview)
3. [Gamma API Proxy Implementation](#gamma-api-proxy-implementation)
4. [CLOB API Authentication Proxying](#clob-api-authentication-proxying)
5. [Request and Response Flow](#request-and-response-flow)
6. [Configuration and Environment Handling](#configuration-and-environment-handling)

## Introduction
The Polymarket Kit implements a sophisticated proxy mechanism that serves as a translation layer between client applications and Polymarket's upstream APIs, specifically the Gamma and CLOB services. This architectural pattern enables clients to interact with Polymarket's data and trading functionality through a unified interface while abstracting away the complexities of direct API integration. The proxy mechanism supports both data retrieval (via Gamma API) and authenticated trading operations (via CLOB API), with specialized handling for each service's requirements. The implementation leverages the Elysia framework to create typed routes that intercept incoming requests, apply proxy configurations, and forward them to the appropriate upstream endpoints with proper transformation and authentication.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)

## Proxy Architecture Overview

```mermaid
graph TB
Client[Client Application] --> Proxy[Polymarket Kit Proxy]
subgraph "Proxy Layer"
Proxy --> GammaRoute[Gamma API Routes]
Proxy --> ClobRoute[CLOB API Routes]
GammaRoute --> GammaClient[Gamma SDK]
ClobRoute --> ClobClient[CLOB SDK]
end
GammaClient --> GammaAPI[Gamma API\nhttps://gamma-api.polymarket.com]
ClobClient --> ClobAPI[CLOB API]
style GammaRoute fill:#f9f,stroke:#333
style ClobRoute fill:#f9f,stroke:#333
style GammaClient fill:#bbf,stroke:#333
style ClobClient fill:#bbf,stroke:#333
classDef route fill:#f9f,stroke:#333;
classDef client fill:#bbf,stroke:#333;
class GammaRoute,ClobRoute route
class GammaClient,ClobClient client
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)

## Gamma API Proxy Implementation

The Gamma API proxy implementation enables clients to route their requests through optional HTTP proxies by leveraging the `x-http-proxy` header. When a request is received with this header, the proxy configuration is parsed and applied to the underlying HTTP client used to communicate with the Gamma API. The `parseProxyString` function in `gamma.ts` handles the parsing of proxy configuration from the header value, supporting various formats including basic authentication credentials. This function processes URLs in formats like `http://proxy.com:8080`, `http://user:pass@proxy.com:8080`, and `https://proxy.com:3128`, extracting the protocol, host, port, username, and password components. The parsed configuration is then used to instantiate a GammaSDK instance with proxy capabilities, allowing the request to be forwarded through the specified proxy server. If the proxy header is invalid or parsing fails, the system gracefully falls back to direct API access without a proxy, ensuring continued functionality while logging a warning.

```mermaid
sequenceDiagram
participant Client
participant GammaRoute
participant ParseProxy
participant GammaSDK
participant GammaAPI
Client->>GammaRoute : GET /gamma/events<br>x-http-proxy : http : //proxy : 8080
GammaRoute->>ParseProxy : parseProxyString(header)
ParseProxy-->>GammaRoute : ProxyConfig object
GammaRoute->>GammaSDK : new GammaSDK({proxy : config})
GammaSDK->>GammaAPI : Request via proxy
GammaAPI-->>GammaSDK : Response
GammaSDK-->>GammaRoute : Processed response
GammaRoute-->>Client : Return response
alt Invalid Proxy Header
Client->>GammaRoute : GET /gamma/markets<br>x-http-proxy : invalid-url
GammaRoute->>ParseProxy : parseProxyString(header)
ParseProxy-->>GammaRoute : Error
GammaRoute->>GammaSDK : new GammaSDK() // No proxy
GammaSDK->>GammaAPI : Direct request
GammaAPI-->>GammaSDK : Response
GammaSDK-->>GammaRoute : Processed response
GammaRoute-->>Client : Return response
end
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

## CLOB API Authentication Proxying

The CLOB API implements an authentication proxying mechanism that allows clients to authenticate their requests using the `x-polymarket-key` and `x-polymarket-funder` headers. These headers carry the private key and funder address required for CLOB operations, which are then used to instantiate a PolymarketSDK instance for the duration of the request. The system implements different behavior based on the environment: in production mode, these headers are strictly required, while in development mode, the system falls back to environment variables (`POLYMARKET_KEY` and `POLYMARKET_FUNDER`) if the headers are not present. This dual-mode authentication approach facilitates easier development and testing while maintaining strict security requirements in production. The SDK instances are cached using an LRU cache keyed by the combination of private key and funder address, improving performance by reusing existing connections for subsequent requests with the same credentials.

```mermaid
flowchart TD
Start([Request Received]) --> CheckEnv{Environment}
CheckEnv --> |Production| ProdAuth[Require x-polymarket-key<br>and x-polymarket-funder]
CheckEnv --> |Development| DevAuth[Headers or Env Vars]
DevAuth --> CheckHeaders{Headers Present?}
CheckHeaders --> |Yes| UseHeaders[Use header values]
CheckHeaders --> |No| UseEnv[Use environment variables]
ProdAuth --> ValidateKeys{Keys Valid?}
UseHeaders --> ValidateKeys
UseEnv --> ValidateKeys
ValidateKeys --> |Invalid| ReturnError[400 Error]
ValidateKeys --> |Valid| GetSDK[Get or Create SDK Instance]
GetSDK --> CheckCache{In Cache?}
CheckCache --> |Yes| UseCached[Use Cached SDK]
CheckCache --> |No| CreateNew[Create New SDK]
CreateNew --> CacheIt[Store in LRU Cache]
CacheIt --> UseCached
UseCached --> MakeRequest[Forward to CLOB API]
MakeRequest --> ReturnResponse[Return Result]
ReturnError --> End([Response Sent])
ReturnResponse --> End
```

**Diagram sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [env.ts](file://src/utils/env.ts#L1-L12)

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [env.ts](file://src/utils/env.ts#L1-L12)

## Request and Response Flow

The request and response flow in the Polymarket Kit proxy mechanism follows a consistent pattern across both Gamma and CLOB APIs. When a request arrives at the proxy, it first passes through route-specific middleware that extracts and processes authentication and proxy configuration from headers. For Gamma API routes, the `x-http-proxy` header is parsed to configure the HTTP client, while for CLOB API routes, the authentication headers are processed to configure the SDK instance. Request parameters are then transformed as needed to match the expected format of the underlying SDK methods. The transformed request is forwarded to the appropriate SDK method, which communicates with the upstream API. Responses from the upstream APIs are relayed back through the proxy with minimal transformation, preserving the original data structure while adding appropriate HTTP status codes and headers. Error handling is implemented consistently, with upstream errors being translated into appropriate HTTP status codes and error responses that maintain the expected schema.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L1-L724)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)

## Configuration and Environment Handling

The proxy mechanism implements robust configuration and environment handling to support both development and production use cases. The environment detection is based on the `NODE_ENV` variable, with a default of "development" if not specified. This detection drives the authentication behavior for the CLOB API, where development mode allows fallback to environment variables for convenience, while production mode requires explicit headers for security. The system also supports caching configuration through environment variables such as `SDK_CACHE_MAX_SIZE` and `SDK_CACHE_TTL_HOURS`, which control the LRU cache for SDK instances. For the Gamma API proxy functionality, no additional configuration is required beyond the header-based specification, making it easy to use in various deployment scenarios. The modular design separates the proxy configuration logic from the route handling, allowing for easy extension and modification of the proxy behavior without affecting the core API functionality.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [env.ts](file://src/utils/env.ts#L1-L12)