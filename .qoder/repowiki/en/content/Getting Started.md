# Getting Started

<cite>
**Referenced Files in This Document**   
- [run.ts](file://src/run.ts)
- [Dockerfile](file://Dockerfile)
- [package.json](file://package.json)
- [env.ts](file://src/utils/env.ts)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation with pnpm](#installation-with-pnpm)
3. [Environment Setup](#environment-setup)
4. [Launching the Server](#launching-the-server)
   - [Direct Execution](#direct-execution)
   - [Docker Deployment](#docker-deployment)
   - [Cloudflare Workers](#cloudflare-workers)
5. [Basic Usage Examples](#basic-usage-examples)
6. [Configuration Options](#configuration-options)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Prerequisites

Before setting up the Polymarket proxy server, ensure your development environment meets the following requirements:

- **Node.js**: Version 18 or higher (recommended: latest LTS)
- **Bun**: Runtime environment for executing TypeScript directly (alternative to Node.js + pnpm)
- **pnpm**: Package manager used for dependency resolution and script execution
- Basic understanding of environment variables and API endpoints
- Access to a terminal or command-line interface

This project leverages Bun for hot-reload development and production builds, but remains compatible with standard Node.js environments through pnpm.

**Section sources**
- [package.json](file://package.json#L0-L55)

## Installation with pnpm

To install dependencies using pnpm, follow these steps:

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/your-repo/polymarket-kit.git
   cd polymarket-kit
   ```

2. Install all required dependencies:
   ```bash
   pnpm install
   ```

This command reads the `package.json` file and installs all listed dependencies, including Elysia for server routing, Cloudflare Wrangler for deployment, and Polymarket CLOB client for market data access.

**Section sources**
- [package.json](file://package.json#L0-L55)

## Environment Setup

The server uses environment variables for configuration. While there is no `.env.example` file present in the repository, the following variables are essential based on code analysis:

- `POLYMARKET_API_KEY`: Required for authenticating requests to Polymarket APIs
- `PORT`: Specifies the port number the server listens on (default: 3000)
- `NODE_ENV`: Sets the environment mode (`development` or `production`)
- `BASE_URL`: Overrides the base URL used in console output (default: `http://localhost:${PORT}`)

These values are accessed via the `getEnv()`, `getPort()`, and `getBaseUrl()` functions in `env.ts`.

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)

## Launching the Server

### Direct Execution

For local development, use the built-in Bun script:

```bash
pnpm dev
```

This executes `bun run --hot src/run.ts`, enabling hot reloading during development. The server starts on port 3000 by default and outputs startup information including available endpoints and documentation URLs.

Alternatively, build and run the production version:

```bash
pnpm build
pnpm start
```

**Section sources**
- [run.ts](file://src/run.ts#L0-L27)
- [package.json](file://package.json#L20-L21)

### Docker Deployment

A multi-stage Dockerfile is provided for containerized deployment:

```bash
# Build the image
docker build -t polymarket-proxy .

# Run the container
docker run --rm -p 3000:3000 polymarket-proxy
```

The Docker image:
- Uses `oven/bun:1` as the builder to compile `run.ts` into a standalone binary
- Deploys using `gcr.io/distroless/base` for minimal footprint
- Exposes port 3000
- Runs the compiled server executable

Environment variables can be passed at runtime:
```bash
docker run -e POLYMARKET_API_KEY=your_key -e PORT=3000 -p 3000:3000 polymarket-proxy
```

**Section sources**
- [Dockerfile](file://Dockerfile#L0-L35)

### Cloudflare Workers

To deploy to Cloudflare Workers:

```bash
# Generate types
pnpm cf-typegen

# Deploy in development mode
pnpm dev:cf

# Deploy to production
pnpm deploy
```

These scripts utilize Wrangler, configured through `wrangler.toml` (not visible in current context), to manage deployment to Cloudflare’s edge network.

**Section sources**
- [package.json](file://package.json#L22-L24)

## Basic Usage Examples

After starting the server, verify functionality with these sample requests:

### Starting the Server

Upon successful launch, you'll see output similar to:
```
🚀 Polymarket Proxy Server started!
📖 API Documentation: http://localhost:3000/docs
🌐 Server running at: http://localhost:3000
```

### Making Sample Requests

**Gamma API - Fetch Markets**
```bash
curl "http://localhost:3000/gamma/markets"
```

**Gamma API - Fetch Events**
```bash
curl "http://localhost:3000/gamma/events"
```

**CLOB API - Price History (requires market)**
```bash
curl "http://localhost:3000/clob/prices-history?market=0x..."
```

**Health Check**
```bash
curl "http://localhost:3000/health"
```

Expected responses include JSON payloads with market data, event details, or price history depending on the endpoint. The `/docs` route provides interactive Swagger documentation.

**Section sources**
- [run.ts](file://src/run.ts#L15-L25)

## Configuration Options

The server supports several configuration options through environment variables:

| Variable | Default | Description |
|--------|--------|-----------|
| `PORT` | 3000 | Port number for the HTTP server |
| `NODE_ENV` | development | Environment mode affecting logging and error exposure |
| `BASE_URL` | http://localhost:${PORT} | Base URL used in console logs and response metadata |
| `POLYMARKET_API_KEY` | (required) | API key for authenticating with Polymarket services |

These options allow customization of behavior across development, staging, and production environments without changing code.

**Section sources**
- [env.ts](file://src/utils/env.ts#L0-L10)
- [run.ts](file://src/run.ts#L0-L27)

## Troubleshooting Common Issues

### Missing Dependencies
If `pnpm install` fails:
- Ensure pnpm is installed globally: `npm install -g pnpm`
- Clear cache if needed: `pnpm clean-cache`

### Server Fails to Start
Common causes:
- Port 3000 already in use: Change with `PORT=4000 pnpm dev`
- Invalid environment setup: Verify `POLYMARKET_API_KEY` is set

### Authentication Errors
If receiving 401/403 responses:
- Confirm `POLYMARKET_API_KEY` is correctly set
- Validate the key has necessary permissions in the Polymarket dashboard

### Docker Build Failures
Ensure Bun lockfile (`bun.lock`) exists and is up to date. If missing, initialize with `bun install` before building.

### Endpoint Not Found
Verify the server has started successfully and check console output for registered routes. Some endpoints require query parameters (e.g., `market` for price history).

**Section sources**
- [run.ts](file://src/run.ts#L0-L27)
- [Dockerfile](file://Dockerfile#L0-L35)
- [env.ts](file://src/utils/env.ts#L0-L10)