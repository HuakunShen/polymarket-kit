# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Polymarket SDK and proxy server built with Elysia/TypeScript. The project provides both standalone SDK clients and a proxy server with type-safe endpoints for CLOB and Gamma APIs.

Key components:
- **src/sdk/**: Standalone SDK clients (PolymarketSDK for CLOB, GammaSDK for Gamma API)
- **src/routes/**: Elysia server routes (clob.ts, gamma.ts)
- **src/types/elysia-schemas.ts**: Single source of truth for TypeBox schemas and types
- **src/index.ts**: Main Elysia server entry point
- **src/mod.ts**: JSR package exports for standalone SDK usage

## Development Commands

### Package Management
```bash
bun install              # Install dependencies
```

### Development
```bash
bun run dev              # Start development server with hot reload
bun run dev:cf           # Start Cloudflare Workers development server
```

### Code Quality
```bash
bun run format           # Format code using Biome
bun run typecheck        # Type checking and linting with Biome
```

### Deployment
```bash
bun run deploy          # Deploy to Cloudflare Workers (production)
bun run cf-typegen      # Generate Cloudflare Workers types
```

## Architecture Overview

### Dual-Purpose Design
The project serves as both:
1. **Standalone SDK**: Import `PolymarketSDK`/`GammaSDK` directly
2. **Proxy Server**: Elysia REST API with full type validation

### Type Safety System
- **Single Schema Source**: All types defined in `src/types/elysia-schemas.ts` using TypeBox
- **Runtime Validation**: Automatic request/response validation in Elysia routes
- **Compile-time Safety**: Full TypeScript types derived from schemas
- **OpenAPI Generation**: Automatic Swagger docs at `/docs`

### SDK Architecture
- **PolymarketSDK**: CLOB client wrapper (requires credentials)
- **GammaSDK**: Gamma API client (no credentials required)
- **Caching**: LRU cache for SDK instances and CLOB clients
- **Credential Management**: Headers in production, env vars in development

### Environment Configuration
Production credentials via headers:
- `x-polymarket-key`: Private key
- `x-polymarket-funder`: Funder address

Development fallback to env vars:
- `POLYMARKET_KEY`
- `POLYMARKET_FUNDER`

## Coding Conventions

### Type Safety Requirements
- Use TypeBox schemas from `elysia-schemas.ts` for all API operations
- Never use `any` types (some exceptions allowed in specific files via biome.json)
- All SDK methods must be fully typed with proper return types
- Validate all external data through schemas

### Code Style
- **Formatter**: Biome with tab indentation
- **Quotes**: Double quotes for strings
- **Imports**: Manual organization (auto-organize disabled)
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

### Development Patterns
- Prefer editing existing files over creating new ones
- Use LRU caches for expensive operations (SDK instances, CLOB clients)
- Follow Elysia patterns for route definitions with proper schema validation
- Include detailed JSDoc comments for all main functions and classes

## Testing Strategy

Currently no test framework is configured. When implementing tests:
1. Check if testing setup exists in the codebase
2. If not, ask user for preferred testing approach
3. Follow existing patterns if tests are already present

## Common Development Tasks

### Adding New API Endpoints
1. Define schemas in `src/types/elysia-schemas.ts`
2. Add route in appropriate file (`src/routes/clob.ts` or `src/routes/gamma.ts`)
3. Update SDK methods if needed
4. Test with `/docs` endpoint for OpenAPI validation

### SDK Method Development
1. Add method to appropriate SDK class (`PolymarketSDK` or `GammaSDK`)
2. Ensure proper TypeBox schema validation
3. Handle caching if applicable
4. Update exports in `src/sdk/index.ts`

### Deployment Considerations
- Cloudflare Workers compatibility (uses wrangler.jsonc)
- Docker support available (Dockerfile present)
- Environment variable configuration required for production
- CORS enabled for web application integration