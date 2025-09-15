# Repository Guidelines

## Project Structure & Modules
- `src/index.ts`: Elysia server entry. `src/run.ts`: dev runner.
- `src/sdk/`: standalone SDKs (`GammaSDK`, `PolymarketSDK`).
- `src/routes/`: HTTP routes (`gamma.ts`, `clob.ts`).
- `src/types/`: TypeBox schemas (single source of truth).
- `src/utils/`: helpers. `build/`: compiled CLI (e.g., `weather`).
- Tests live under `src/**/__tests__/*.test.ts`.

## Build, Test, and Dev
- `bun install`: install deps.
- `bun run dev`: hot-reload local server (`src/run.ts`).
- `bun run dev:cf`: Cloudflare Workers dev via Wrangler.
- `bun run build`: build CLI `weather` → `build/weather.js`.
- `bun test` / `bun run test:watch`: run tests.
- `bun run deploy`: deploy to Cloudflare Workers.

## Coding Style & Naming
- TypeScript, ESM, strict mode (`tsconfig.json`).
- Formatting/Linting: Biome. Run `bun run format` and `bun run typecheck`.
- Indentation: tabs; quotes: double (see `biome.json`).
- Filenames: kebab-case (`gamma-client.ts`), tests end with `.test.ts`.
- Exports organized via `jsr.json` and `package.json#exports`.

## Testing Guidelines
- Framework: `bun:test` with `describe/test/expect`.
- Place tests in `__tests__` next to code; name `*.test.ts`.
- Aim to cover route handlers, SDK methods, and utils. Use fixtures over network.
- Run locally: `bun test` (optionally `--watch`).

## Commit & Pull Requests
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- PRs must include: clear description, linked issue, test updates, and any API/route screenshots or cURL examples.
- Keep changes scoped; update README or docs when adding endpoints or envs.

## Security & Configuration
- Required envs for CLOB: `POLYMARKET_KEY`, `POLYMARKET_FUNDER`. Optional: `PORT`, cache limits (see README).
- Store secrets in `.env` locally; never commit secrets. Avoid logging sensitive headers.
- For Workers, verify `wrangler.jsonc` before deploy and regenerate types via `bun run cf-typegen` when bindings change.

## Quick Examples
- Start dev server: `bun run dev`
- Format all files: `bun run format`
- Run Gamma routes tests: `bun test src/routes/__tests__/gamma.test.ts`
