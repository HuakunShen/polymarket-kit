# Troubleshooting

<cite>
**Referenced Files in This Document**   
- [client.ts](file://src/sdk/client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [clob.ts](file://src/routes/clob.ts)
- [env.ts](file://src/utils/env.ts)
- [cfg.yml](file://go-polymarket/cfg.yml)
- [polymarket_client.go](file://go-polymarket/client/polymarket_client.go)
- [api.json](file://go-polymarket/api.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication Failures](#authentication-failures)
3. [API Rate Limiting](#api-rate-limiting)
4. [Network Connectivity Issues](#network-connectivity-issues)
5. [Configuration Errors](#configuration-errors)
6. [Response Parsing Problems](#response-parsing-problems)
7. [Performance Issues](#performance-issues)
8. [Diagnostic Commands](#diagnostic-commands)
9. [Error Code Reference](#error-code-reference)

## Introduction
This troubleshooting guide provides practical solutions for common issues encountered when using or deploying polymarket-kit. The guide is organized by problem category and includes actionable steps, debugging techniques, and diagnostic tools. All solutions are designed to be accessible to both beginners and experienced developers working with the Polymarket API proxy and SDK.

## Authentication Failures

### Symptoms
- HTTP 401 Unauthorized responses
- Empty or malformed authentication headers
- Session expiration errors
- Proxy authentication failures when using authenticated proxies

### Root Cause Analysis
Authentication issues typically stem from missing or invalid authentication tokens, incorrect proxy configuration, or expired sessions. The polymarket-kit routes do not require direct API keys but may fail if upstream Polymarket APIs require authentication that isn't properly forwarded.

### Solutions
1. **Verify proxy configuration**: Ensure proxy headers are correctly formatted
   ```bash
   curl -H "x-http-proxy: http://user:pass@proxy.com:8080" http://localhost/gamma/events
   ```

2. **Test without proxy**: Isolate authentication issues from proxy issues
   ```bash
   curl http://localhost/gamma/events
   ```

3. **Check environment variables**: Verify proxy credentials are properly set
   ```bash
   echo $PROXY_USERNAME
   echo $PROXY_PASSWORD
   ```

4. **Enable debug logging**: Monitor authentication flow
   ```ts
   // In your application code
   console.log('Proxy header received:', headers['x-http-proxy']);
   ```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [env.ts](file://src/utils/env.ts)

## API Rate Limiting

### Symptoms
- HTTP 429 Too Many Requests responses
- Intermittent failures during high-frequency requests
- Slow response times that improve after pauses
- "Rate limit exceeded" error messages

### Root Cause Analysis
Rate limiting occurs when the number of requests exceeds the threshold allowed by either the proxy server or upstream Polymarket APIs. The Go-based CLOB client and Gamma API endpoints may have different rate limits.

### Solutions
1. **Implement request throttling**: Add delays between requests
   ```ts
   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
   
   for (const id of marketIds) {
     const data = await sdk.getMarket(id);
     await delay(100); // 100ms between requests
   }
   ```

2. **Use caching**: Leverage built-in client caching
   ```ts
   // CLOB client automatically caches instances
   const wasCached = await sdk.healthCheck();
   console.log('Client was cached:', wasCached.cached);
   ```

3. **Batch requests**: Combine multiple queries when possible
   ```bash
   # Use endpoints that return multiple items
   curl "http://localhost/gamma/markets?limit=100"
   ```

4. **Monitor rate limits**: Check response headers for rate limit information
   ```bash
   curl -I http://localhost/gamma/events
   ```

**Section sources**
- [client.ts](file://src/sdk/client.ts#L296-L348)
- [api.json](file://go-polymarket/api.json)

## Network Connectivity Issues

### Symptoms
- Connection timeout errors
- ECONNREFUSED or ECONNRESET errors
- DNS resolution failures
- Intermittent connectivity

### Root Cause Analysis
Network issues can originate from local firewall settings, proxy misconfiguration, DNS problems, or upstream service outages. The polymarket-kit uses Cloudflare Workers infrastructure, which may be affected by network policies.

### Solutions
1. **Test basic connectivity**: Verify the service is reachable
   ```bash
   curl -v http://localhost/health
   ```

2. **Check proxy settings**: Validate proxy configuration
   ```ts
   // Test proxy parsing function
   const proxyConfig = parseProxyString('http://proxy.com:8080');
   console.log(proxyConfig);
   ```

3. **Test from different networks**: Rule out local network issues
   ```bash
   # Use external service to test
   curl https://api.allorigins.win/get?url=http://localhost:8787/health
   ```

4. **Verify DNS resolution**: Ensure domain names resolve correctly
   ```bash
   nslookup localhost
   dig localhost
   ```

5. **Check firewall rules**: Ensure ports are open
   ```bash
   # Check if port is listening
   lsof -i :8787
   netstat -an | grep 8787
   ```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L49-L103)
- [clob.ts](file://src/routes/clob.ts)

## Configuration Errors

### Symptoms
- Application fails to start
- Missing required configuration values
- Unexpected behavior despite correct API usage
- Environment-specific issues

### Root Cause Analysis
Configuration errors typically result from missing environment variables, incorrect YAML configuration, or mismatched proxy settings between different components of the polymarket-kit.

### Solutions
1. **Verify environment variables**: Check required variables are set
   ```bash
   # Required environment variables
   echo "PROXY_HOST: $PROXY_HOST"
   echo "PROXY_PORT: $PROXY_PORT"
   echo "CACHE_ENABLED: $CACHE_ENABLED"
   ```

2. **Validate YAML configuration**: Check cfg.yml syntax
   ```bash
   # Test YAML validity
   yamllint go-polymarket/cfg.yml
   ```

3. **Check configuration loading**: Verify config is properly read
   ```ts
   // In env.ts, configuration values are loaded from environment
   const config = {
     proxyHost: process.env.PROXY_HOST,
     proxyPort: parseInt(process.env.PROXY_PORT || '8080'),
   };
   ```

4. **Use default values**: Ensure fallbacks exist for optional settings
   ```ts
   // Configuration with defaults
   const port = parseInt(process.env.PORT || '8787');
   ```

**Section sources**
- [env.ts](file://src/utils/env.ts)
- [cfg.yml](file://go-polymarket/cfg.yml)

## Response Parsing Problems

### Symptoms
- JSON parsing errors
- Unexpected data types in responses
- Missing fields in parsed objects
- Type conversion errors

### Root Cause Analysis
Response parsing issues occur when the actual API response structure differs from expected types, often due to API version mismatches, schema changes, or incomplete error handling in the client SDK.

### Solutions
1. **Validate response structure**: Check actual vs expected format
   ```bash
   curl http://localhost/gamma/events | jq
   ```

2. **Handle error responses**: Properly process non-200 responses
   ```ts
   try {
     const response = await fetch('/gamma/events');
     if (!response.ok) {
       const error = await response.json();
       console.error('API Error:', error);
       return;
     }
     const data = await response.json();
   } catch (error) {
     console.error('Parse error:', error);
   }
   ```

3. **Use type guards**: Validate data before processing
   ```ts
   function isValidEvent(event: any): event is EventType {
     return event && typeof event.id === 'string' && typeof event.name === 'string';
   }
   ```

4. **Update SDK**: Ensure using latest version with current types
   ```bash
   pnpm update @polymarket/sdk
   ```

**Section sources**
- [api.json](file://go-polymarket/api.json)
- [gamma.ts](file://src/routes/gamma.ts)

## Performance Issues

### Symptoms
- Slow API response times
- High memory usage
- Request queuing or timeouts
- Degraded performance under load

### Root Cause Analysis
Performance issues may stem from inefficient caching, unoptimized network requests, memory leaks in the SDK, or upstream API latency. The CLOB client initialization and caching mechanism can impact performance.

### Optimization Recommendations
1. **Enable client caching**: Reuse client instances
   ```ts
   // CLOB client is cached by default
   const sdk = new PolymarketSDK();
   // Subsequent calls will use cached client if available
   ```

2. **Monitor cache effectiveness**: Check health endpoint
   ```ts
   const health = await sdk.healthCheck();
   console.log('Client was cached:', health.cached);
   ```

3. **Optimize request patterns**: Batch and cache responses
   ```ts
   // Cache expensive operations
   const cache = new Map();
   async function getCachedMarkets() {
     if (cache.has('markets')) {
       return cache.get('markets');
     }
     const markets = await sdk.getAllMarkets();
     cache.set('markets', markets);
     return markets;
   }
   ```

4. **Adjust concurrency**: Limit parallel requests
   ```ts
   // Process requests in batches
   const BATCH_SIZE = 5;
   for (let i = 0; i < ids.length; i += BATCH_SIZE) {
     const batch = ids.slice(i, i + BATCH_SIZE);
     await Promise.all(batch.map(id => sdk.getMarket(id)));
     await new Promise(resolve => setTimeout(resolve, 100));
   }
   ```

5. **Monitor memory usage**: Check for leaks
   ```bash
   # Use Node.js diagnostics
   node --inspect-brk your-app.js
   ```

**Section sources**
- [client.ts](file://src/sdk/client.ts#L296-L348)
- [polymarket_client.go](file://go-polymarket/client/polymarket_client.go)

## Diagnostic Commands

### Health Check Script
Test the basic functionality of the polymarket-kit:

```bash
#!/bin/bash
echo "Testing polymarket-kit health..."

# Test health endpoint
echo "1. Testing health endpoint:"
curl -s -w "\nStatus: %{http_code}\n" http://localhost/health

# Test CLOB client health
echo "2. Testing CLOB client:"
curl -s -w "\nStatus: %{http_code}\n" http://localhost/clob/health

# Test Gamma API
echo "3. Testing Gamma API:"
curl -s -w "\nStatus: %{http_code}\n" "http://localhost/gamma/events?limit=1&offset=0"

# Test with proxy (if configured)
if [ ! -z "$PROXY_HOST" ]; then
    echo "4. Testing with proxy:"
    curl -H "x-http-proxy: http://$PROXY_HOST:$PROXY_PORT" \
         -s -w "\nStatus: %{http_code}\n" \
         http://localhost/gamma/events
fi

echo "Diagnostic complete"
```

### Environment Verification
Check that all required environment variables are set:

```bash
#!/bin/bash
echo "Checking polymarket-kit environment variables..."

REQUIRED_VARS=("PROXY_HOST" "PROXY_PORT")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
        echo "❌ $VAR is not set"
    else
        echo "✅ $VAR=${!VAR}"
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "All required environment variables are set"
else
    echo "Missing ${#MISSING_VARS[@]} required variables"
    exit 1
fi
```

### Cache Inspection
Monitor and manage the client cache:

```ts
// cache-inspect.ts
import { clobClientCache } from './src/sdk/client';

console.log('CLOB Client Cache Status:');
console.log('Size:', clobClientCache.size);
console.log('Keys:', Array.from(clobClientCache.keys()));

// Clear cache if needed
if (process.argv.includes('--clear')) {
    clobClientCache.clear();
    console.log('Cache cleared');
}
```

## Error Code Reference

### Proxy Server Error Codes
| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 400 | Bad Request | Invalid request parameters | Validate input parameters and query strings |
| 401 | Unauthorized | Authentication required | Check proxy authentication credentials |
| 429 | Too Many Requests | Rate limit exceeded | Implement request throttling |
| 500 | Internal Server Error | Unexpected server error | Check server logs and retry |
| 503 | Service Unavailable | Service temporarily unavailable | Wait and retry, check upstream services |

### Upstream Polymarket API Errors
| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 400 | Bad Request | Invalid request format | Validate API parameters and structure |
| 404 | Not Found | Resource does not exist | Verify resource ID or endpoint |
| 500 | Internal Error | Upstream service error | Retry request, check Polymarket status |
| 503 | Service Unavailable | Upstream service down | Wait for service recovery |

### SDK-Specific Error Patterns
- **CLOB Client Errors**: Look for `book_item_with_token400_error.go`, `markets500_error.go` files
- **Gamma API Errors**: Check `events_slug_item_with_slug500_error.go` for error structures
- **Health Check Responses**: See `health_get_response.go` for status formats

The error response structure typically includes:
- `error`: Error type or code
- `message`: Human-readable error description  
- `details`: Additional context about the error
- `status`: HTTP status code

**Section sources**
- [api.json](file://go-polymarket/api.json)
- [health_get_response.go](file://go-polymarket/client/clob/health_get_response.go)
- [events_slug_item_with_slug500_error.go](file://go-polymarket/client/gamma/events_slug_item_with_slug500_error.go)