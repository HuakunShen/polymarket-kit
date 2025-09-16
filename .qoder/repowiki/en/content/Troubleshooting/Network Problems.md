# Network Problems

<cite>
**Referenced Files in This Document**   
- [gamma.ts](file://src/routes/gamma.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [client.ts](file://src/sdk/client.ts)
- [docker-compose.yml](file://docker-compose.yml)
- [Dockerfile](file://Dockerfile)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [index.ts](file://src/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Common Network Issues](#common-network-issues)
3. [Proxy Architecture and Configuration](#proxy-architecture-and-configuration)
4. [Docker Deployment Configuration](#docker-deployment-configuration)
5. [Cloudflare Worker Network Behavior](#cloudflare-worker-network-behavior)
6. [Error Handling and Timeout Configuration](#error-handling-and-timeout-configuration)
7. [Diagnostic Tools and Techniques](#diagnostic-tools-and-techniques)
8. [Recommended Solutions](#recommended-solutions)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive guidance for diagnosing and resolving network connectivity issues in the polymarket-kit application. The system serves as both a fully typed SDK and proxy server for Polymarket APIs, supporting multiple runtimes including Cloudflare Workers. Network issues can arise from various sources including timeout errors, DNS resolution failures, blocked ports, CORS restrictions, and proxy configuration problems. This guide covers the architecture of the proxy system, Docker deployment configuration, Cloudflare Worker-specific behaviors, and practical debugging techniques to identify and resolve connectivity problems.

## Common Network Issues

### Timeout Errors
Timeout errors occur when HTTP requests to Polymarket APIs exceed the default timeout threshold. The polymarket-kit uses the standard fetch API without explicit timeout configuration, making it susceptible to hanging requests when upstream services are slow or unresponsive. These timeouts can manifest as stalled requests in browser environments or unhandled promise rejections in server contexts.

### DNS Resolution Failures
DNS resolution failures happen when the application cannot resolve domain names for Polymarket's API endpoints such as gamma-api.polymarket.com or clob.polymarket.com. This can be caused by network configuration issues, DNS server problems, or firewall restrictions blocking DNS queries. In Docker environments, DNS resolution can be affected by container network settings and DNS configuration in docker-compose.yml.

### Blocked Ports
Port blocking issues can prevent the application from establishing connections to external services. The polymarket-kit exposes port 3000 for incoming connections, and any firewall rules blocking this port will prevent external access to the proxy server. Additionally, outbound connections from the application to Polymarket's API endpoints may be blocked by corporate firewalls or security groups, preventing data retrieval.

### CORS Restrictions
CORS (Cross-Origin Resource Sharing) restrictions affect browser-based clients attempting to access the proxy server. The application includes CORS middleware configured to allow all origins in development mode, but production deployments may require specific origin configurations. Misconfigured CORS headers can result in browser console errors and blocked API requests from web applications.

**Section sources**
- [index.ts](file://src/index.ts#L15-L45)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L15-L25)

## Proxy Architecture and Configuration

### Proxy Architecture Overview
The polymarket-kit implements a proxy architecture that routes client requests through an intermediate server before accessing Polymarket's APIs. This architecture provides several benefits including request transformation, caching, and centralized error handling. The proxy server is built with Elysia and handles requests to both the Gamma API (market and event data) and CLOB API (trading and price history).

The proxy architecture introduces additional network hops that can become failure points. Client requests first reach the proxy server, which then makes outbound requests to Polymarket's API endpoints. This two-step process increases the potential for network issues, as failures can occur in either the inbound connection to the proxy or the outbound connection to the upstream APIs.

### HTTP Proxy Configuration
The application supports HTTP/HTTPS proxy configuration for outbound requests to Polymarket APIs. This is particularly useful in restricted network environments where direct internet access is blocked. The proxy configuration is implemented through the `x-http-proxy` header, which accepts proxy URLs in standard formats.

The proxy configuration supports authentication via username and password in the proxy URL (e.g., http://user:pass@proxy.com:8080). When the `x-http-proxy` header is present, the application creates a GammaSDK instance with the specified proxy configuration. If proxy parsing fails, the application falls back to direct connections without a proxy.

```mermaid
flowchart TD
Client["Client Application"] --> |HTTP Request| Proxy["polymarket-kit Proxy Server"]
Proxy --> |Direct Connection| GammaAPI["gamma-api.polymarket.com"]
Proxy --> |Proxied Connection| HTTPProxy["HTTP/HTTPS Proxy"]
HTTPProxy --> GammaAPI
Proxy --> |Direct Connection| ClobAPI["clob.polymarket.com"]
```

**Diagram sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)

## Docker Deployment Configuration

### Docker Compose Configuration
The docker-compose.yml file defines the service configuration for deploying the polymarket-kit in Docker containers. The configuration exposes port 3000 on the host machine, mapping it to port 3000 in the container. This allows external access to the proxy server through localhost:3000.

The service is built from the current directory using the Dockerfile, ensuring the container contains the compiled application. Environment variables are set to indicate a production environment, which affects application behavior such as logging and error reporting.

```yaml
services:
  proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

### Dockerfile Configuration
The Dockerfile implements a multi-stage build process to create a minimal production image. The first stage uses the oven/bun base image to install dependencies and compile the application into a standalone executable. This approach reduces the final image size and improves startup performance.

The second stage uses a distroless base image, which contains only the application and its minimal runtime dependencies. This enhances security by reducing the attack surface and minimizing the container footprint. The compiled server executable is copied to the final image and configured to run on port 3000.

The EXPOSE instruction in the Dockerfile documents that the container listens on port 3000, but does not automatically publish the port. Port publishing is controlled by the docker-compose.yml file or docker run command-line options.

**Diagram sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L8)
- [Dockerfile](file://Dockerfile#L1-L36)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L8)
- [Dockerfile](file://Dockerfile#L1-L36)

## Cloudflare Worker Network Behavior

### Cloudflare Worker Limitations
When deployed to Cloudflare Workers, the polymarket-kit operates within the constraints of Cloudflare's serverless platform. Cloudflare Workers have specific network behavior and limitations that affect connectivity. The workers run in Cloudflare's global network, which provides low-latency access to Polymarket APIs but introduces platform-specific restrictions.

Cloudflare Workers use a modified fetch API that supports the same basic functionality as standard fetch but with some differences in behavior and available options. The workers automatically handle connection pooling and reuse, reducing the overhead of establishing new connections for each request.

### Request Handling in Workers
The worker-configuration.d.ts file defines the types and interfaces for Cloudflare Worker handlers. The ExportedHandler interface supports fetch, tail, trace, and scheduled handlers, allowing the application to respond to HTTP requests and process events. The fetch handler receives Request, Env, and ExecutionContext objects, providing access to incoming requests and execution context.

Cloudflare Workers automatically handle certain aspects of request processing, including TLS termination, DDoS protection, and request routing. However, this abstraction can make debugging network issues more challenging, as some network-level details are hidden from the application code.

**Section sources**
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L419-L461)
- [wrangler.ts](file://src/wrangler.ts#L50-L76)

## Error Handling and Timeout Configuration

### HTTP Call Error Handling
The polymarket-kit implements comprehensive error handling around HTTP calls to Polymarket APIs. The GammaSDK class includes a makeRequest method that wraps fetch operations with try-catch blocks to handle network errors and API failures. When a request fails, the method throws an error with descriptive messaging that includes the endpoint and original error message.

For CLOB API operations, the PolymarketSDK class includes similar error handling in methods like getPriceHistory. These methods catch errors during client initialization and API requests, providing meaningful error messages that help diagnose connectivity issues. The healthCheck method specifically tests CLOB client connectivity and returns detailed status information.

### Timeout Considerations
While the current implementation does not explicitly configure timeouts for HTTP requests, the underlying fetch implementation in Bun and Cloudflare Workers has default timeout values. In Bun, the default timeout for fetch operations is 5 seconds for connection and 30 seconds for response. In Cloudflare Workers, requests are subject to a 10-second CPU time limit and 60-second total execution time limit.

To improve resilience, applications should implement their own timeout mechanisms using AbortController or similar approaches. This allows for more granular control over timeout values and better user experience when dealing with slow upstream services.

```mermaid
sequenceDiagram
participant Client
participant Proxy
participant PolymarketAPI
Client->>Proxy : HTTP Request
Proxy->>PolymarketAPI : Fetch with timeout
alt Success
PolymarketAPI-->>Proxy : Response
Proxy-->>Client : Transformed Response
else Timeout/Error
PolymarketAPI--xProxy : Timeout/Error
Proxy->>Proxy : Error Handling
Proxy-->>Client : Error Response
end
```

**Diagram sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)
- [client.ts](file://src/sdk/client.ts#L296-L348)

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)
- [client.ts](file://src/sdk/client.ts#L296-L348)

## Diagnostic Tools and Techniques

### Using curl for Testing
The curl command-line tool can be used to bypass client layers and test connectivity directly to the proxy server. This helps isolate whether issues are in the client application or the network path to the server.

```bash
# Test connectivity to the proxy server
curl http://localhost:3000/health

# Test Gamma API endpoint through proxy
curl "http://localhost:3000/gamma/markets?limit=5"

# Test with proxy header
curl -H "x-http-proxy: http://proxy.com:8080" http://localhost:3000/gamma/health
```

### Network Diagnostics
Several command-line tools can help diagnose network connectivity issues:

- **netstat**: Check if the application is listening on port 3000
- **ping**: Test basic connectivity to the server
- **traceroute**: Identify network hops and potential routing issues
- **nslookup/dig**: Test DNS resolution for Polymarket API domains

### Browser Developer Tools
Browser developer tools provide valuable insights into network requests when using the proxy server in web applications. The Network tab shows request timing, headers, status codes, and response bodies. This helps identify CORS issues, slow requests, and failed connections.

The Console tab displays JavaScript errors including CORS violations and network errors. The Application/Storage tab allows inspection of environment variables and configuration that might affect network behavior.

**Section sources**
- [index.ts](file://src/index.ts#L100-L130)
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)

## Recommended Solutions

### Retry Mechanisms
Implement retry mechanisms for transient network failures using exponential backoff. This approach retries failed requests with increasing delays between attempts, reducing load on upstream services while improving success rates for temporary issues.

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, baseDelay * Math.pow(2, i))
      );
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Fallback Endpoints
Configure fallback endpoints for critical API calls. If the primary endpoint fails, the application can attempt to retrieve data from alternative sources or cached data. This improves resilience and user experience during partial outages.

### Connection Pooling Considerations
Leverage the connection pooling capabilities of the underlying runtime. In Cloudflare Workers, connections are automatically pooled and reused across requests. In Docker deployments, ensure the application server is configured to maintain persistent connections to upstream APIs.

### Configuration Best Practices
- Set appropriate timeout values based on expected response times
- Implement circuit breaker patterns to prevent cascading failures
- Use environment-specific configurations for development and production
- Monitor and log network errors for proactive issue detection

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L102-L164)
- [client.ts](file://src/sdk/client.ts#L296-L348)

## Conclusion
Network connectivity issues in polymarket-kit can stem from various sources including timeout errors, DNS resolution failures, blocked ports, and CORS restrictions. The proxy architecture introduces additional complexity but also provides opportunities for improved error handling and request management. Proper configuration of Docker deployments and understanding of Cloudflare Worker network behavior are essential for reliable operation. By using diagnostic tools like curl, browser developer tools, and network utilities, developers can effectively identify and resolve connectivity problems. Implementing retry mechanisms, fallback endpoints, and proper error handling enhances the resilience of applications using the polymarket-kit.