# Header-Based Proxying

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [test-proxy.js](file://test-proxy.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Proxy Configuration via Headers](#proxy-configuration-via-headers)
3. [Implementation of parseProxyString Function](#implementation-of-parseproxystring-function)
4. [GammaSDK Proxy Integration](#gammasdk-proxy-integration)
5. [Error Handling and Fallback Behavior](#error-handling-and-fallback-behavior)
6. [Security Considerations](#security-considerations)
7. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
8. [Testing the Proxy Functionality](#testing-the-proxy-functionality)

## Introduction
The polymarket-kit implements a header-based proxying mechanism that allows clients to route outgoing HTTP requests through a specified proxy server when accessing the Gamma API. This feature is particularly useful in environments with restricted network access or when users need to anonymize their requests. The system leverages the `x-http-proxy` header to dynamically configure proxy settings for each request, enabling flexible and secure API access patterns.

## Proxy Configuration via Headers
The polymarket-kit uses the `x-http-proxy` HTTP header to accept proxy configuration from clients. When a request includes this header, its value is parsed and used to configure an HTTP proxy for all outgoing requests made by the GammaSDK instance during that request lifecycle.

The header supports multiple proxy URL formats:
- Basic proxy: `http://proxy.com:8080`
- Authenticated proxy: `http://user:pass@proxy.com:8080`
- HTTPS proxy: `https://proxy.com:3128`

This approach enables clients to dynamically route their API traffic through different proxy servers without requiring changes to the server configuration or client-side code. The proxy configuration is applied at the request level, ensuring isolation between different client requests.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)

## Implementation of parseProxyString Function
The `parseProxyString` function is responsible for parsing the proxy URL string from the `x-http-proxy` header into a structured `ProxyConfigType` object. This function uses JavaScript's built-in `URL` class to safely parse the proxy string and extract its components.

The function processes the following components from the proxy URL:
- **protocol**: Extracted from the URL protocol (e.g., "http" or "https")
- **host**: Extracted from the URL hostname
- **port**: Parsed as an integer from the URL port
- **username**: Decoded from the URL username (if present)
- **password**: Decoded from the URL password (if present)

When authentication credentials are included in the proxy URL, they are properly decoded using `decodeURIComponent` to handle special characters. The function is wrapped in a try-catch block to handle malformed URLs gracefully, throwing a descriptive error message when parsing fails.

```mermaid
flowchart TD
Start([Start parseProxyString]) --> ParseURL["Parse URL with new URL()"]
ParseURL --> ExtractProtocol["Extract protocol (remove trailing colon)"]
ParseURL --> ExtractHost["Extract hostname"]
ParseURL --> ExtractPort["Parse port as integer"]
ParseURL --> CheckAuth["Check for username/password"]
CheckAuth --> HasAuth{"Credentials present?"}
HasAuth --> |Yes| DecodeAuth["Decode username/password"]
HasAuth --> |No| Continue
DecodeAuth --> Continue
Continue --> CreateConfig["Create ProxyConfig object"]
CreateConfig --> ReturnConfig["Return configuration"]
ParseURL --> Error{"Invalid URL?"}
Error --> |Yes| ThrowError["Throw formatted error"]
ThrowError --> End([Function Exit])
ReturnConfig --> End
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L72)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L72)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L10-L36)

## GammaSDK Proxy Integration
The proxy configuration is applied to the GammaSDK instance creation within the Elysia middleware. When a request contains the `x-http-proxy` header, the parsed configuration is passed to the GammaSDK constructor, which then uses it to configure the underlying HTTP client.

In the GammaSDK implementation, proxy support is handled through two mechanisms:
1. **Dispatcher with ProxyAgent**: The SDK attempts to use undici's `ProxyAgent` with a dispatcher option, which provides direct proxy support in Bun runtime
2. **Environment Variables Fallback**: If the ProxyAgent cannot be loaded, the SDK falls back to setting `HTTP_PROXY` and `HTTPS_PROXY` environment variables

The `buildProxyUrl` method constructs the complete proxy URL from the configuration object, properly formatting authentication credentials when present. This URL is then used to initialize the proxy agent or set environment variables.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Middleware as "Elysia Middleware"
participant Parser as "parseProxyString"
participant SDK as "GammaSDK"
participant Fetch as "fetch() with ProxyAgent"
Client->>Middleware : Request with x-http-proxy header
Middleware->>Parser : Call parseProxyString(header)
Parser-->>Middleware : Return ProxyConfig or error
alt Valid Proxy Config
Middleware->>SDK : Create GammaSDK with proxy config
SDK->>Fetch : Configure fetch with ProxyAgent
Fetch-->>SDK : Return configured client
SDK-->>Middleware : Return SDK instance
else Invalid Proxy Config
Middleware->>Console : Log warning
Middleware->>SDK : Create GammaSDK without proxy
SDK-->>Middleware : Return SDK instance
end
Middleware->>Client : Process request with SDK
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L74-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)
- [gamma.ts](file://src/routes/gamma.ts#L74-L103)

## Error Handling and Fallback Behavior
The system implements robust error handling for malformed proxy configurations. When the `parseProxyString` function encounters an invalid proxy URL format, it throws a descriptive error that is caught in the middleware. Instead of failing the entire request, the system gracefully falls back to creating a GammaSDK instance without proxy configuration.

This fallback behavior ensures service continuity even when clients provide invalid proxy headers. The system logs a warning message that includes both the invalid proxy header value and the parsing error, which aids in troubleshooting. This approach prioritizes availability over strict validation, allowing legitimate requests to proceed even when proxy configuration fails.

The test script in `test-proxy.js` demonstrates this behavior by testing both valid and invalid proxy URLs, confirming that the server handles malformed headers gracefully while still processing the underlying API request.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L85-L95)
- [test-proxy.js](file://test-proxy.js#L0-L53)

## Security Considerations
Accepting proxy configurations via headers introduces several security considerations that the implementation addresses:

1. **Input Validation**: The use of the `URL` constructor for parsing provides built-in validation of URL structure, preventing many types of injection attacks
2. **Authentication Handling**: Credentials in proxy URLs are properly decoded but not logged in full, reducing the risk of credential exposure in logs
3. **Environment Isolation**: Proxy configuration is applied per-request and does not affect the global application state
4. **Fallback Safety**: When proxy configuration fails, the system falls back to direct connections rather than using potentially compromised proxy settings

The implementation does not validate the trustworthiness of the proxy server itself, as this is considered a client responsibility. However, by limiting the scope of proxy configuration to individual requests and providing clear error logging, the system minimizes the potential impact of malicious proxy configurations.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)

## Common Issues and Troubleshooting
Several common issues may arise when using the header-based proxying feature:

**Malformed Proxy URLs**: Incorrectly formatted proxy URLs will trigger the fallback behavior. Common mistakes include:
- Missing protocol (e.g., `proxy.com:8080` instead of `http://proxy.com:8080`)
- Invalid port numbers
- Special characters in credentials that aren't properly percent-encoded

**Network Connectivity Problems**: Even with valid proxy configuration, connectivity issues may occur due to:
- Proxy server unavailability
- Authentication failures with authenticated proxies
- Firewall restrictions on the proxy port

**Troubleshooting Steps**:
1. Verify the proxy URL format matches one of the supported patterns
2. Check that the proxy server is reachable from the server environment
3. Examine server logs for warning messages about invalid proxy headers
4. Test with a known working proxy configuration
5. Use the test script in `test-proxy.js` to validate proxy functionality

The system's logging of invalid proxy configurations provides valuable diagnostic information for resolving these issues.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L85-L95)
- [test-proxy.js](file://test-proxy.js#L0-L53)

## Testing the Proxy Functionality
The repository includes a test script (`test-proxy.js`) that verifies the proxy header functionality. This script tests various proxy URL formats, including valid configurations with and without authentication, as well as invalid formats.

The test script demonstrates the expected behavior:
- Valid proxy URLs should result in successful API requests (indicated by HTTP status 200)
- Invalid proxy URLs should trigger the fallback mechanism, with the request still succeeding but accompanied by a warning log
- The absence of a proxy header should result in direct API access

To run the tests, the server must be running, and the script can be executed with the `--run` flag. This comprehensive test coverage ensures the reliability of the proxying feature across different configuration scenarios.

**Section sources**
- [test-proxy.js](file://test-proxy.js#L0-L53)