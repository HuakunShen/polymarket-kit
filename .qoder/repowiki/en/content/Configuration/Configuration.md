# Configuration

<cite>
**Referenced Files in This Document**   
- [env.ts](file://src/utils/env.ts)
- [Dockerfile](file://Dockerfile)
- [docker-compose.yml](file://docker-compose.yml)
- [wrangler.ts](file://src/wrangler.ts)
- [worker-configuration.d.ts](file://worker-configuration.d.ts)
- [clob.ts](file://src/routes/clob.ts)
- [client.ts](file://src/sdk/client.ts)
</cite>

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Configuration Methods by Deployment Environment](#configuration-methods-by-deployment-environment)
3. [Proxy Settings](#proxy-settings)
4. [Caching Configuration](#caching-configuration)
5. [Logging Options](#logging-options)
6. [Configuration Processing in env.ts](#configuration-processing-in-envts)
7. [Best Practices for Secrets and Environment-Specific Settings](#best-practices-for-secrets-and-environment-specific-settings)
8. [Troubleshooting Configuration Issues](#troubleshooting-configuration-issues)

## Environment Variables

The application utilizes several environment variables to control runtime behavior across different environments. These variables are used for port binding, API authentication, base URLs, and caching parameters.

| Environment Variable | Purpose | Default Value | Security Implication |
|----------------------|--------|---------------|------------------------|
| `NODE_ENV` | Specifies the runtime environment (development, production) | `"development"` | Affects logging verbosity and error exposure |
| `PORT` | Port number on which the server listens | `3000` | Must be unique per service; conflicts can prevent startup |
| `BASE_URL` | Base URL for constructing external links and redirects | `http://localhost:${PORT}` | Should reflect actual deployment URL in production |
| `POLYMARKET_KEY` | API key for authenticating with Polymarket services | None (required) | Highly sensitive; must be kept secret and rotated regularly |
| `POLYMARKET_FUNDER` | Address used for funding operations on Polymarket | None (required) | Sensitive; represents financial authority |
| `SDK_CACHE_TTL_HOURS` | Cache TTL for SDK responses in hours | `1` hour | Impacts data freshness vs performance trade-off |
| `CLOB_CLIENT_CACHE_TTL_MINUTES` | Cache TTL for CLOB client operations in minutes | `30` minutes | Shorter values increase accuracy but reduce performance |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy server URLs for outbound requests | None | Required in restricted network environments |

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L11)
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L5-L10)
- [clob.ts](file://src/routes/clob.ts#L31)
- [client.ts](file://src/sdk/client.ts#L32)

## Configuration Methods by Deployment Environment

### Local Development
For local development, configuration is managed through environment variables loaded from `.env` files or directly exported in the shell. The default port is 3000, and `NODE_ENV` defaults to `"development"` if not set.

Example `.env` file:
```
NODE_ENV=development
PORT=3000
POLYMARKET_KEY=your_dev_api_key_here
POLYMARKET_FUNDER=0xYourFundingAddress
BASE_URL=http://localhost:3000
SDK_CACHE_TTL_HOURS=1
CLOB_CLIENT_CACHE_TTL_MINUTES=30
```

### Docker Containers
In Docker deployments, environment variables are passed via the `environment` section in `docker-compose.yml`. The image is built using multi-stage Dockerfile that sets `NODE_ENV=production` during compilation.

Example `docker-compose.yml` snippet:
```yaml
services:
  proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - POLYMARKET_KEY=${POLYMARKET_KEY}
```

Build and run:
```bash
docker build -t polymarket-proxy .
docker run --rm -p 3000:3000 -e POLYMARKET_KEY=your_key_here polymarket-proxy
```

**Section sources**
- [Dockerfile](file://Dockerfile#L1-L36)
- [docker-compose.yml](file://docker-compose.yml#L1-L8)

### Cloudflare Workers
For Cloudflare Workers deployment, configuration is defined in `wrangler.toml` and bound as environment variables. Durable Objects are used for stateful components, and secrets like `POLYMARKET_KEY` are configured via Wrangler CLI using `wrangler secret put`.

The `worker-configuration.d.ts` file defines the expected environment bindings, including:
- `POLYMARKET_KEY`: Secret API key
- `POLYMARKET_FUNDER`: Funding wallet address
- `MY_CONTAINER`: Durable Object namespace for containerized execution

Configuration in `wrangler.ts` includes default environment values:
```typescript
override envVars = {
  MESSAGE: "I was passed in via the container class!",
  NODE_ENV: "production",
  PORT: "3000",
  BASE_URL: "https://polymarket.huakun.tech",
};
```

**Section sources**
- [wrangler.ts](file://src/wrangler.ts#L5-L76)
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L5-L10)

## Proxy Settings

The application supports HTTP/HTTPS proxying through both environment variables and programmatic configuration. When using the Gamma SDK, proxy settings can be specified in the client configuration:

```typescript
const client = new GammaClient({
  proxy: {
    protocol: "http",
    host: "proxy.example.com",
    port: 8080,
    username: "user",
    password: "pass"
  }
});
```

This configuration is processed in `gamma-client.ts`, where it dynamically imports `undici.ProxyAgent` to create a dispatcher for fetch operations. If dynamic import fails, it falls back to setting `HTTP_PROXY` and `HTTPS_PROXY` environment variables.

Proxy support is particularly important in Cloudflare Workers and Dockerized environments where outbound traffic may need to traverse corporate proxies.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L54-L100)

## Caching Configuration

The application implements multiple caching layers with configurable TTLs:

- **SDK Cache**: Controls how long SDK responses are cached (default: 30 minutes)
- **CLOB Client Cache**: Manages order book and market data freshness (default: 30 minutes)
- **Global Cache**: Used for general response caching with a default TTL of 60 seconds in testing environments

Cache TTLs are configured via environment variables:
- `SDK_CACHE_TTL_HOURS`: Converts hours to milliseconds (e.g., 1 hour = 3,600,000 ms)
- `CLOB_CLIENT_CACHE_TTL_MINUTES`: Converts minutes to milliseconds (e.g., 30 minutes = 1,800,000 ms)

These values are read directly from `process.env` with safe defaults to prevent cache stampedes while ensuring reasonable data freshness.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L31)
- [client.ts](file://src/sdk/client.ts#L32)

## Logging Options

Logging behavior is controlled by the `NODE_ENV` variable and can be further refined using log level environment variables. In development mode, verbose logging is enabled to aid debugging. In production, logging is minimized to essential messages.

The following log level environment variables are recognized:
- `MINIFLARE_LOG_LEVEL`: Controls log verbosity in Miniflare testing environment
- `MF-Log-Level`: Alternative log level setting for Workers runtime

Log output includes timestamps, request/response metadata, and error traces when applicable. Error logs include stack traces only in development mode to prevent information leakage.

**Section sources**
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L640)
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L6641)

## Configuration Processing in env.ts

The `env.ts` file provides a centralized configuration interface that abstracts environment variable access with type safety and fallbacks:

```typescript
export function getEnv() {
	return process.env.NODE_ENV || "development";
}

export function getPort() {
	return Number(process.env.PORT || Bun?.env?.PORT || 3000);
}

export function getBaseUrl() {
	return process.env.BASE_URL || `http://localhost:${getPort()}`;
}
```

This module implements:
- **Type coercion**: Ensures numeric values (like PORT) are properly converted
- **Fallback chains**: Uses multiple sources (e.g., `process.env` and `Bun.env`)
- **Default values**: Provides safe defaults when variables are unset
- **Derived values**: Constructs `BASE_URL` from other configuration

The functions are designed to be side-effect free and idempotent, making them suitable for repeated calls throughout the application lifecycle.

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L11)

## Best Practices for Secrets and Environment-Specific Settings

### Secrets Management
- Never commit secrets to version control
- Use `.env` files with `.gitignore` protection for local development
- Utilize `wrangler secret put POLYMARKET_KEY` for Cloudflare Workers
- Rotate API keys regularly and revoke unused ones
- Use different keys for development, staging, and production

### Environment-Specific Configuration
- Use `NODE_ENV` to control behavior across environments
- Externalize all environment-specific values (URLs, ports, keys)
- Use Docker secrets or Cloudflare Secrets for production deployments
- Validate required environment variables at startup
- Document all configuration requirements in README

### Configuration Validation
Implement startup checks to verify critical variables:
```typescript
if (!process.env.POLYMARKET_KEY) {
  throw new Error("POLYMARKET_KEY is required");
}
```

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L11)
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L5-L10)

## Troubleshooting Configuration Issues

### Common Issues and Solutions

| Issue | Symptoms | Resolution |
|------|---------|------------|
| Incorrect API Key | 401/403 errors, authentication failures | Verify `POLYMARKET_KEY` value and format; regenerate if compromised |
| Port Conflicts | Application fails to start, EADDRINUSE errors | Change `PORT` environment variable or stop conflicting service |
| Missing Environment Variables | Unexpected defaults, connection failures | Check `.env` file loading; verify variable names match expected format |
| Proxy Configuration Failures | Timeout errors, inability to reach external APIs | Validate proxy URL format; ensure credentials are correct; check network policies |
| Cache Staleness | Outdated market data, stale order books | Reduce `*_CACHE_TTL_*` values; implement cache invalidation logic |
| Base URL Misconfiguration | Broken redirects, incorrect links | Ensure `BASE_URL` matches actual deployment URL including protocol and port |

### Diagnostic Commands
- Check current environment: `printenv | grep POLYMARKET`
- Test connectivity: `curl -v http://localhost:3000/health`
- Verify Worker bindings: `wrangler secret list`
- Inspect Docker environment: `docker inspect <container_id> | grep Env`

### Debugging Tips
- Enable verbose logging in development by setting `NODE_ENV=development`
- Use `console.log` statements in `env.ts` to trace configuration values
- Validate environment loading with a test endpoint that returns config (exclude from production)
- Monitor startup logs for configuration warnings or fallbacks

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L11)
- [wrangler.ts](file://src/wrangler.ts#L5-L76)
- [worker-configuration.d.ts](file://worker-configuration.d.ts#L5-L10)