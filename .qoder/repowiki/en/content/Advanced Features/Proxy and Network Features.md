# Proxy and Network Features

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [test-proxy.js](file://test-proxy.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Components](#core-components)
3. [Architecture Overview](#architecture-overview)
4. [Detailed Component Analysis](#detailed-component-analysis)
5. [Proxy Configuration and Validation](#proxy-configuration-and-validation)
6. [Request Flow and Middleware Processing](#request-flow-and-middleware-processing)
7. [Proxy Agent Configuration in GammaClient](#proxy-agent-configuration-in-gammaclient)
8. [Fallback Mechanism and Environment Variables](#fallback-mechanism-and-environment-variables)
9. [Supported Proxy Formats and Examples](#supported-proxy-formats-and-examples)
10. [Error Handling and Degradation Strategy](#error-handling-and-degradation-strategy)
11. [Testing and Validation](#testing-and-validation)
12. [Conclusion](#conclusion)

## Introduction
The proxy support system in the Polymarket Kit enables network flexibility by allowing HTTP and HTTPS requests to be routed through intermediary proxies. This functionality is critical for bypassing network restrictions, enhancing privacy, and enabling access in restricted environments. The system leverages the `x-http-proxy` header to dynamically configure proxy settings for outbound API calls to the Gamma API. It supports both authenticated and unauthenticated proxies over HTTP and HTTPS protocols. The implementation spans multiple layers including request parsing, configuration validation, SDK integration, and fallback mechanisms. This document provides a comprehensive overview of the architecture, implementation details, and operational behavior of the proxy system.

## Core Components
The proxy system consists of three primary components: the `gammaRoutes` middleware that processes incoming requests, the `GammaSDK` class that manages API communication, and the `ProxyConfigSchema` that validates configuration inputs. These components work together to parse proxy headers, validate configurations, establish proxied connections, and gracefully handle failures. The system is designed to be transparent to end users while providing robust proxy support for developers and enterprise use cases.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L0-L36)

## Architecture Overview
The proxy architecture follows a layered approach where incoming HTTP requests are intercepted by Elysia middleware, parsed for proxy configuration, and used to instantiate a GammaSDK instance with appropriate proxy settings. The SDK then uses undici's ProxyAgent to route outbound requests through the specified proxy server. A fallback mechanism ensures connectivity even when direct proxy configuration fails.

```mermaid
graph TD
A[Client Request] --> B{x-http-proxy Header?}
B --> |Yes| C[Parse Proxy String]
C --> D[Validate Configuration]
D --> E[Create GammaSDK with Proxy]
E --> F[Configure ProxyAgent]
F --> G[Make API Request]
B --> |No| H[Create GammaSDK without Proxy]
H --> G
F --> |Failure| I[Set HTTP_PROXY/HTTPS_PROXY]
I --> G
G --> J[Gamma API]
K[Error] --> L[Graceful Degradation]
L --> M[Direct Connection]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)

## Detailed Component Analysis

### Proxy Configuration Parsing
The system parses proxy configuration from the `x-http-proxy` header using a dedicated `parseProxyString` function that converts URL-formatted strings into structured `ProxyConfigType` objects.

```mermaid
flowchart TD
A[Raw Proxy String] --> B{Valid URL?}
B --> |No| C[Throw Error]
B --> |Yes| D[Extract Protocol]
D --> E[Extract Hostname]
E --> F[Extract Port]
F --> G{Has Credentials?}
G --> |Yes| H[Decode Username/Password]
H --> I[Create ProxyConfigType]
G --> |No| I
I --> J[Return Configuration]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L72)

### GammaSDK Proxy Integration
The GammaSDK class integrates proxy configuration through its constructor and request lifecycle, enabling proxied API communication.

```mermaid
classDiagram
class GammaSDK {
-proxyConfig : ProxyConfigType
+constructor(config : GammaSDKConfig)
-createFetchOptions() : RequestInit
-buildProxyUrl(proxy : ProxyConfigType) : string
-makeRequest<T>(endpoint : string, query? : Record<string, any>) : Promise<{data : T | null, status : number, ok : boolean}>
}
class ProxyConfigType {
+host : string
+port : number
+username? : string
+password? : string
+protocol? : "http" | "https"
}
GammaSDK --> ProxyConfigType : "uses"
```

**Diagram sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)

## Proxy Configuration and Validation
The proxy configuration system uses a well-defined schema to validate input parameters and ensure proper formatting. The `ProxyConfigSchema` defines the structure for proxy settings including host, port, credentials, and protocol specification.

### Validation Schema
The validation schema ensures all proxy configurations meet required specifications:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| host | string | Yes | Proxy server hostname or IP address |
| port | number | Yes | Proxy server port number |
| username | string | No | Proxy authentication username |
| password | string | No | Proxy authentication password |
| protocol | "http" \| "https" | No | Proxy protocol (defaults to http) |

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L0-L36)

## Request Flow and Middleware Processing
The request flow begins with the `gammaRoutes` middleware intercepting incoming requests and processing the `x-http-proxy` header. The middleware extracts the header value and attempts to parse it into a valid proxy configuration.

### Middleware Processing Steps
1. Extract `x-http-proxy` header from incoming request
2. Parse header value into `ProxyConfigType` object
3. Validate configuration structure and values
4. Instantiate GammaSDK with proxy configuration
5. Handle parsing errors with graceful degradation

The middleware ensures that invalid proxy configurations do not disrupt service by falling back to direct connections.

```mermaid
sequenceDiagram
participant Client
participant Middleware
participant GammaSDK
participant API
Client->>Middleware : HTTP Request with x-http-proxy header
Middleware->>Middleware : Extract header value
alt Valid Proxy String
Middleware->>Middleware : Parse into ProxyConfigType
Middleware->>GammaSDK : Create instance with proxy
GammaSDK->>API : Proxied API Request
else Invalid Proxy String
Middleware->>Middleware : Log warning
Middleware->>GammaSDK : Create instance without proxy
GammaSDK->>API : Direct API Request
end
API-->>GammaSDK : Response
GammaSDK-->>Middleware : Response
Middleware-->>Client : Response
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L85-L103)

## Proxy Agent Configuration in GammaClient
The `createFetchOptions` method in `GammaClient` is responsible for configuring the HTTP client to use proxy settings when making API requests. This implementation is specifically designed for compatibility with the Bun runtime environment.

### Configuration Process
1. Create base fetch options with content-type header
2. Check for proxy configuration in SDK instance
3. Build proxy URL from configuration object
4. Dynamically import undici's ProxyAgent
5. Configure dispatcher with ProxyAgent instance
6. Handle import failures with environment variable fallback

The method uses dynamic imports to ensure undici is available and properly configured for proxy support in the Bun runtime.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L85)

## Fallback Mechanism and Environment Variables
The system implements a robust fallback mechanism to ensure connectivity when direct proxy configuration fails. When the ProxyAgent cannot be configured, the system sets environment variables as a secondary approach.

### Fallback Strategy
1. Attempt direct ProxyAgent configuration via dispatcher option
2. If configuration fails, catch error and log warning
3. Set `HTTP_PROXY` and `HTTPS_PROXY` environment variables
4. Allow underlying HTTP client to use environment-based proxy configuration

This two-tiered approach maximizes compatibility across different runtime environments and network conditions. The fallback ensures that proxy functionality remains available even when the preferred configuration method fails.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L70-L80)

## Supported Proxy Formats and Examples
The system supports multiple proxy URL formats to accommodate various deployment scenarios and authentication requirements.

### Supported Formats
- **Basic HTTP**: `http://proxy.com:8080`
- **Authenticated HTTP**: `http://user:pass@proxy.com:8080`
- **HTTPS Proxy**: `https://proxy.com:3128`
- **Authenticated HTTPS**: `https://user:pass@proxy.com:3128`

### Usage Examples
```bash
# Basic proxy usage
curl -H "x-http-proxy: http://proxy.example.com:8080" \
  http://localhost:3000/gamma/teams?limit=1

# Authenticated proxy
curl -H "x-http-proxy: http://username:password@proxy.example.com:8080" \
  http://localhost:3000/gamma/events?limit=5

# HTTPS proxy
curl -H "x-http-proxy: https://secure-proxy.com:3128" \
  http://localhost:3000/gamma/markets?active=true
```

The system automatically handles URL parsing, credential decoding, and protocol selection based on the provided format.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L52-L55)

## Error Handling and Degradation Strategy
The proxy system implements comprehensive error handling to maintain service availability under various failure conditions.

### Common Issues and Solutions
| Issue | Detection | Handling Strategy |
|------|----------|-------------------|
| Malformed URL | URL parsing exception | Log warning, use direct connection |
| Authentication failure | Proxy server rejection | Allow error to propagate to client |
| Network connectivity | Connection timeout | Rely on fetch timeout handling |
| Invalid port | Port parsing error | Throw validation error |
| Missing host | Empty hostname | Throw validation error |

The system gracefully degrades to direct connections when proxy configuration fails, ensuring that service remains available even with misconfigured proxy settings. This approach prioritizes availability over proxy functionality, preventing configuration errors from causing service outages.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L68-L72)

## Testing and Validation
The system includes comprehensive testing to validate proxy functionality across various scenarios.

### Test Coverage
- Valid HTTP proxy URLs
- Valid HTTPS proxy URLs
- Authenticated proxy URLs
- Malformed proxy URLs
- Empty proxy headers
- Direct connection fallback

The test script `test-proxy.js` verifies that the system correctly handles both valid and invalid proxy configurations, ensuring reliable operation in production environments.

```mermaid
flowchart TD
A[Test Execution] --> B{Proxy URL Valid?}
B --> |Yes| C[Expect Successful Response]
B --> |No| D[Expect Warning Log]
D --> E[Verify Direct Connection]
C --> F[Check Status Code]
F --> G[Validate Response Data]
E --> G
G --> H[Test Complete]
```

**Section sources**
- [test-proxy.js](file://test-proxy.js#L0-L53)

## Conclusion
The proxy support system in the Polymarket Kit provides robust network flexibility through the `x-http-proxy` header, enabling requests to be routed through intermediary proxies. The implementation features comprehensive validation, multiple configuration methods, and graceful degradation to ensure reliable operation. By supporting both authenticated and unauthenticated HTTP/HTTPS proxies, the system accommodates a wide range of deployment scenarios and network environments. The layered architecture separates concerns between request processing, configuration management, and HTTP client configuration, resulting in a maintainable and extensible design. The fallback mechanism using environment variables ensures compatibility across different runtime environments, making the system resilient to configuration failures while maintaining service availability.