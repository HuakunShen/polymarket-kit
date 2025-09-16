# Environment Variables

<cite>
**Referenced Files in This Document**   
- [env.ts](file://src/utils/env.ts)
- [clob.ts](file://src/routes/clob.ts)
- [dev.ts](file://src/dev.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Environment Variables](#core-environment-variables)
3. [Caching Configuration](#caching-configuration)
4. [Accessing Environment Variables in Code](#accessing-environment-variables-in-code)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Best Practices for Managing Secrets](#best-practices-for-managing-secrets)
7. [Common Pitfalls and Troubleshooting](#common-pitfalls-and-troubleshooting)

## Introduction
This document provides comprehensive guidance on the environment variables used in the Polymarket Kit application. It details each variable's purpose, accepted values, defaults, and security considerations. The application uses environment variables to configure runtime behavior across different environments while maintaining security for sensitive credentials. These variables are accessed through utility functions in the `env.ts` module, ensuring consistent and type-safe access throughout the codebase.

## Core Environment Variables

### POLYMARKET_API_KEY
**Purpose**: Authentication credential for accessing Polymarket API services. This key authenticates the application with the Polymarket trading infrastructure.

**Accepted Values**: 
- Valid API key string (alphanumeric with special characters)
- Must be a hexadecimal string starting with "0x" followed by 64 characters

**Default Value**: None (required)

**Security Considerations**: 
- **Highly sensitive** - must never be exposed in client-side code or version control
- Should be stored in secure secret management systems
- Rotate regularly and follow least-privilege principles
- Never commit to git repositories

**Section sources**
- [dev.ts](file://src/dev.ts#L3-L4)

### PORT
**Purpose**: Specifies the network port on which the application server listens for incoming HTTP requests.

**Accepted Values**: 
- Integer between 1 and 65535
- Common values: 3000, 8080, 80, 443

**Default Value**: 3000

**Security Considerations**: 
- Ports below 1024 require elevated privileges
- Avoid well-known ports used by other services
- In production, typically behind a reverse proxy

**Section sources**
- [env.ts](file://src/utils/env.ts#L5-L7)

### BASE_URL
**Purpose**: Defines the base URL for the application, used for generating absolute URLs in APIs, redirects, and external service communications.

**Accepted Values**: 
- Valid URL string (e.g., "https://api.example.com", "http://localhost:3000")
- Must include protocol and hostname
- Can include port if non-standard

**Default Value**: `http://localhost:${PORT}` where PORT is determined by the getPort() function

**Security Considerations**: 
- Ensure HTTPS in production environments
- Validate URL format to prevent injection attacks
- Should match the actual deployment domain

**Section sources**
- [env.ts](file://src/utils/env.ts#L9-L11)

### NODE_ENV
**Purpose**: Indicates the current deployment environment, affecting application behavior, logging verbosity, and error handling.

**Accepted Values**: 
- "development" - for local development
- "production" - for live production environment  
- "test" - for testing environments
- "staging" - for pre-production staging

**Default Value**: "development"

**Security Considerations**: 
- Controls exposure of sensitive error details
- Affects caching behavior and performance optimizations
- Should be explicitly set in production deployments

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L3)
- [clob.ts](file://src/routes/clob.ts#L36)

## Caching Configuration

### SDK_CACHE_MAX_SIZE
**Purpose**: Sets the maximum number of items to store in the SDK client cache, controlling memory usage and cache hit rates.

**Accepted Values**: 
- Positive integer
- Higher values increase memory usage but improve cache hit rates

**Default Value**: 50

**Security Considerations**: 
- Memory consumption scales with this value
- Consider server memory limits when setting
- No direct security implications

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L30)

### SDK_CACHE_TTL_HOURS
**Purpose**: Determines how long cached items remain valid before expiration, measured in hours.

**Accepted Values**: 
- Positive integer or decimal
- Values less than 1 can be used for aggressive refresh (e.g., 0.5 for 30 minutes)

**Default Value**: 1 hour

**Security Considerations**: 
- Shorter TTLs provide fresher data but increase API load
- Longer TTLs reduce API calls but may serve stale data
- Balance between performance and data freshness

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L31)

## Accessing Environment Variables in Code

The application provides utility functions in `env.ts` for safely accessing environment variables with appropriate defaults and type conversion.

### getPort()
Retrieves the configured port number with fallback logic:
```typescript
export function getPort() {
	return Number(process.env.PORT || Bun?.env?.PORT || 3000);
}
```
This function attempts to read from `process.env.PORT`, then falls back to `Bun.env.PORT` (for Bun runtime), and finally defaults to 3000. The `Number()` conversion ensures the return value is always a numeric type.

**Section sources**
- [env.ts](file://src/utils/env.ts#L5-L7)

### getBaseUrl()
Constructs the base URL using environment configuration:
```typescript
export function getBaseUrl() {
	return process.env.BASE_URL || `http://localhost:${getPort()}`;
}
```
This function prioritizes the explicitly set `BASE_URL` environment variable, falling back to a localhost URL constructed with the port from `getPort()`.

**Section sources**
- [env.ts](file://src/utils/env.ts#L9-L11)

### getEnv()
Determines the current environment context:
```typescript
export function getEnv() {
	return process.env.NODE_ENV || "development";
}
```
Returns the `NODE_ENV` value or defaults to "development" if not set. This is used throughout the application to modify behavior based on environment.

**Section sources**
- [env.ts](file://src/utils/env.ts#L1-L3)

## Environment-Specific Configuration

### Development Environment
For local development, create a `.env` file in the project root:
```
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
POLYMARKET_KEY=0x...
POLYMARKET_FUNDER=0x...
SDK_CACHE_MAX_SIZE=50
SDK_CACHE_TTL_HOURS=1
```

### Production Environment
In production, use environment variables rather than `.env` files:
```bash
# Set environment variables
export NODE_ENV=production
export PORT=80
export BASE_URL=https://api.yourdomain.com
export POLYMARKET_KEY=0x... # From secure secret store
export POLYMARKET_FUNDER=0x... # From secure secret store
export SDK_CACHE_MAX_SIZE=100
export SDK_CACHE_TTL_HOURS=2
```

### Docker Deployment
When using Docker, pass environment variables via docker-compose.yml:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - BASE_URL=https://api.yourdomain.com
  - POLYMARKET_KEY=${POLYMARKET_KEY}
  - POLYMARKET_FUNDER=${POLYMARKET_FUNDER}
```

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L30-L31)

## Best Practices for Managing Secrets

### Secret Storage
- **Never commit secrets to version control** - Add `.env` to `.gitignore`
- Use secret management services (AWS Secrets Manager, Hashicorp Vault, etc.)
- For development, use `.env.local` files that are git-ignored
- Rotate API keys periodically

### Access Control
- Follow the principle of least privilege
- Restrict API key permissions to only required operations
- Use different keys for different environments
- Monitor API key usage and set up alerts for unusual activity

### Runtime Security
- Validate and sanitize environment variable inputs
- Log environment variables only in development
- Use HTTPS for all external communications
- Regularly audit environment variable usage

### CI/CD Integration
- Configure environment variables in CI/CD pipeline settings
- Use encrypted secrets in GitHub Actions or similar platforms
- Implement approval workflows for production deployments
- Automate secret rotation where possible

## Common Pitfalls and Troubleshooting

### Missing API Keys
**Symptoms**: Authentication failures, 401 errors, SDK initialization failures

**Solution**: 
- Verify `POLYMARKET_KEY` and `POLYMARKET_FUNDER` are set
- Check for typos in variable names
- Ensure keys are properly formatted (hexadecimal, 64 characters after "0x")

**Section sources**
- [dev.ts](file://src/dev.ts#L3-L4)

### Incorrect URL Formatting
**Symptoms**: Connection errors, redirect issues, broken links

**Prevention**:
- Always include protocol (`http://` or `https://`)
- Ensure no trailing slashes unless intended
- Validate URLs with proper parsing

**Example of correct formatting**:
```
# Correct
BASE_URL=https://api.example.com
BASE_URL=http://localhost:3000

# Incorrect
BASE_URL=api.example.com
BASE_URL=https://api.example.com/
```

### Port Conflicts
**Symptoms**: "Address already in use" errors, server startup failures

**Resolution**:
- Check if the port is already in use: `lsof -i :3000`
- Change PORT to an available port
- Use environment-specific port configurations

### Caching Issues
**Symptoms**: Stale data, inconsistent responses, memory leaks

**Troubleshooting**:
- Verify `SDK_CACHE_MAX_SIZE` and `SDK_CACHE_TTL_HOURS` settings
- Monitor memory usage with high cache sizes
- Clear cache when debugging data inconsistencies
- Consider cache invalidation strategies for critical data

### Environment Detection Problems
**Symptoms**: Development features in production, missing error details

**Fix**:
- Explicitly set `NODE_ENV=production` in production
- Verify environment detection logic
- Test environment-specific behavior in staging

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L36)