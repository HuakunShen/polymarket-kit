# Polymarket Kit (SDK & Proxy) Constitution

## Core Principles

### I. End‑to‑End Type Safety (NON‑NEGOTIABLE)
- TypeScript everywhere, ESM, strict mode on.
- No `any` or `unknown` types. Code must be type safe. Prefer precise generics, discriminated unions, and TypeBox‑derived types.
- Runtime schemas are the single source of truth; static types derive from them.

### II. Single Source of Truth Schemas
- Use Elysia TypeBox for all request/response validation.
- Generate OpenAPI from these schemas; SDKs and routes must conform.
- Transform and normalize external API data at the edge to match validated schemas.

### III. Dual‑Purpose Design
- Provide both standalone SDK clients (`GammaSDK`, `PolymarketSDK`) and an optional Elysia proxy server.
- Keep SDKs framework‑agnostic and fully typed; routes are thin adapters over shared schemas and utils.

### IV. Testing First
- Test framework: `bun:test` with `describe/test/expect`.
- Colocate tests under `src/**/__tests__/*.test.ts`.
- Prioritize routes, SDK methods, and utils; use fixtures over network I/O.

### V. Simplicity, Reliability, Observability
- Favor minimal, readable implementations over cleverness.
- Comprehensive error handling with structured responses and proper status codes.
- Health endpoints and caching/metrics surfaces should be maintained and tested.

## Project Structure & Conventions
- Entry points: `src/index.ts` (server), `src/run.ts` (dev runner).
- SDKs in `src/sdk/` (standalone, typed). Routes in `src/routes/`.
- Schemas in `src/types/` (TypeBox). Utilities in `src/utils/`.
- Build artifacts in `build/` (e.g., CLI `weather` → `build/weather.js`).
- Filenames: kebab‑case; tests end with `.test.ts`.
- Exports organized via `jsr.json` and `package.json#exports`.

## Build, Dev, Test
- Dependencies: `bun install`.
- Dev server: `bun run dev` (hot‑reload) and `bun run dev:cf` (Wrangler for Workers).
- Build CLI: `bun run build`.
- Tests: `bun test` or `bun run test:watch`.
- Formatting/Linting: Biome. Run `bun run format` and `bun run typecheck`.
- Style: tabs for indentation; double quotes.

## Security & Configuration
- Required envs for CLOB: `POLYMARKET_KEY`, `POLYMARKET_FUNDER`. Optional: `PORT`, cache limits.
- Store secrets in `.env` locally; never commit secrets. Avoid logging sensitive headers.
- For Cloudflare Workers, verify `wrangler.jsonc` and regenerate bindings via `bun run cf-typegen` when they change.

## API & SDK Contracts
- Gamma routes served under `/gamma/*`; CLOB routes under `/clob/*`.
- Price history endpoint: `GET /clob/prices-history` supports `market`, time range, interval, fidelity; uses headers `x-polymarket-key` and `x-polymarket-funder` as required.
- Maintain strict alignment between route schemas, OpenAPI, and SDK method signatures.

## Commit & Review
- Conventional Commits required: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- PRs must include a clear description, linked issue, updated tests, and relevant API/route screenshots or cURL examples.
- Keep changes scoped; update README/docs when adding endpoints or envs.

## Development Workflow
- Plan from schemas: define/adjust TypeBox schemas → derive types → implement SDK/routes.
- Write/adjust tests alongside implementation; prefer fixtures to external calls.
- Run `bun run typecheck` and `bun run format` before PR.
- Validate OpenAPI docs and route availability (`/docs`, `/health`).

## Governance
- This constitution reflects the README and repository guidelines and supersedes conflicting practices.
- Amendments require documentation in PRs, reviewer approval, and migration notes for any breaking changes.
- Reviewers must verify type safety, schema alignment, tests, and formatting before merge.

Version: 1.0.0 | Ratified: 2025-09-15 | Last Amended: 2025-09-15
