# Contributing Guidelines

<cite>
**Referenced Files in This Document**   
- [src/index.ts](file://src/index.ts)
- [src/run.ts](file://src/run.ts)
- [src/wrangler.ts](file://src/wrangler.ts)
- [src/types/elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [src/routes/clob.ts](file://src/routes/clob.ts)
- [src/routes/gamma.ts](file://src/routes/gamma.ts)
- [src/sdk/gamma-client.ts](file://src/sdk/gamma-client.ts)
- [src/sdk/index.ts](file://src/sdk/index.ts)
- [README.md](file://README.md)
- [AGENTS.md](file://AGENTS.md)
- [biome.json](file://biome.json)
- [package.json](file://package.json)
- [wrangler.ts](file://src/wrangler.ts)
</cite>

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Development Workflow](#development-workflow)
3. [Branching Model and Pull Request Process](#branching-model-and-pull-request-process)
4. [Extending the Codebase](#extending-the-codebase)
5. [Testing](#testing)
6. [Code Quality and Checks](#code-quality-and-checks)
7. [Deployment to Cloudflare Workers](#deployment-to-cloudflare-workers)
8. [Versioning and Release Process](#versioning-and-release-process)
9. [Contribution Requirements](#contribution-requirements)

## Development Environment Setup

To contribute to the polymarket-kit project, you need to set up your local development environment. The project supports both pnpm and bun as package managers.

First, clone the repository and navigate to the project directory:
```bash
git clone https://github.com/your-username/polymarket-kit.git
cd polymarket-kit
```

Install dependencies using either pnpm or bun:
```bash
# Using pnpm
pnpm install

# Using bun
bun install
```

The project requires specific environment variables for CLOB API access. Create a `.env` file in the root directory with the following variables:
```
POLYMARKET_KEY=your_private_key_here
POLYMARKET_FUNDER=your_funder_address
PORT=3000
```

**Section sources**
- [README.md](file://README.md#L150-L160)
- [AGENTS.md](file://AGENTS.md#L30-L31)

## Development Workflow

The development workflow for polymarket-kit is designed to be efficient and straightforward. The primary development server can be started using Bun's hot-reload feature.

To start the development server with hot reloading:
```bash
bun run --hot src/run.ts
```

Alternatively, you can use the predefined script in package.json:
```bash
bun run dev
```

For Cloudflare Workers development, use:
```bash
bun run dev:cf
```

The server will start on the port specified in the PORT environment variable (default: 3000). The hot-reload feature automatically restarts the server when code changes are detected, providing a seamless development experience.

The entry point for the development server is `src/run.ts`, which configures and starts the Elysia server with hot reloading enabled. The main server logic resides in `src/index.ts`, which defines the server routes and middleware.

**Section sources**
- [AGENTS.md](file://AGENTS.md#L20-L23)
- [src/run.ts](file://src/run.ts)
- [src/index.ts](file://src/index.ts)

## Branching Model and Pull Request Process

The polymarket-kit project follows a standard Git branching model with feature branches and pull requests for code review.

1. Create a new feature branch from the main branch:
```bash
git checkout -b feature/your-feature-name
```

2. Implement your changes and commit them with descriptive messages following Conventional Commits:
```bash
git commit -m "feat: add new API endpoint for market analysis"
```

3. Push your branch to the remote repository:
```bash
git push origin feature/your-feature-name
```

4. Create a pull request through the GitHub interface with the following requirements:
   - Clear description of changes
   - Reference to related issues (if applicable)
   - Updated tests
   - Screenshots or cURL examples for new endpoints (if applicable)

All pull requests must pass the required checks before merging, including formatting, type checking, and tests.

**Section sources**
- [AGENTS.md](file://AGENTS.md#L70-L75)

## Extending the Codebase

When adding new features to the polymarket-kit codebase, follow the established patterns for consistency and maintainability. The project has a well-defined structure for adding new API endpoints.

To add a new API endpoint, follow these steps:

1. **Define types in src/types**: Add new type schemas in `src/types/elysia-schemas.ts` using TypeBox for validation. This ensures type safety and automatic OpenAPI documentation generation.

2. **Implement in src/routes**: Create the route implementation in the appropriate routes file (`src/routes/gamma.ts` for Gamma API endpoints or `src/routes/clob.ts` for CLOB API endpoints). Use Elysia's routing system with proper validation.

3. **Wrap in src/sdk**: If the endpoint requires a dedicated SDK method, implement it in the appropriate SDK file (`src/sdk/gamma-client.ts` for Gamma API or `src/sdk/client.ts` for CLOB API).

4. **Mount in src/index.ts**: Ensure the route is properly mounted in the main server file `src/index.ts`.

For example, to add a new Gamma API endpoint for market analysis:
1. Define the request and response schemas in `elysia-schemas.ts`
2. Implement the route in `gamma.ts` with proper validation and error handling
3. Add a corresponding method in `gamma-client.ts` if needed
4. The route will be automatically available under the `/gamma` prefix

**Section sources**
- [src/types/elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [src/routes/gamma.ts](file://src/routes/gamma.ts)
- [src/routes/clob.ts](file://src/routes/clob.ts)
- [src/sdk/gamma-client.ts](file://src/sdk/gamma-client.ts)
- [src/sdk/index.ts](file://src/sdk/index.ts)

## Testing

The polymarket-kit project uses `bun:test` as the testing framework. Tests are colocated with the code they test, following the pattern `src/**/__tests__/*.test.ts`.

To run tests:
```bash
bun test
```

To run tests in watch mode:
```bash
bun run test:watch
```

The project includes tests for both route handlers and SDK methods. When adding new functionality, ensure you add corresponding tests. The test structure follows the standard `describe`, `test`, and `expect` pattern.

Test examples can be found in:
- `src/routes/__tests__/gamma.test.ts`
- `src/sdk/__tests__/gamma-client.test.ts`

Aim to cover route handlers, SDK methods, and utility functions. Use fixtures and mocks rather than making actual network requests in tests when possible.

**Section sources**
- [AGENTS.md](file://AGENTS.md#L40-L46)
- [src/routes/__tests__/gamma.test.ts](file://src/routes/__tests__/gamma.test.ts)
- [src/sdk/__tests__/gamma-client.test.ts](file://src/sdk/__tests__/gamma-client.test.ts)

## Code Quality and Checks

The polymarket-kit project enforces high code quality standards through automated checks. Before submitting a pull request, ensure your code passes all required checks.

Run formatting with Biome:
```bash
bun run format
```

Run type checking:
```bash
bun run typecheck
```

The project follows specific coding style guidelines:
- TypeScript with ESM and strict mode
- Formatting and linting with Biome
- Indentation with tabs
- Double quotes for strings
- Filenames in kebab-case (e.g., `gamma-client.ts`)
- Test files ending with `.test.ts`

All code must adhere to these standards. The CI/CD pipeline will run these checks automatically, and pull requests with failing checks will not be merged.

**Section sources**
- [AGENTS.md](file://AGENTS.md#L50-L58)
- [biome.json](file://biome.json)

## Deployment to Cloudflare Workers

The polymarket-kit project can be deployed to Cloudflare Workers using Wrangler. The deployment configuration is defined in `wrangler.ts`.

To deploy to Cloudflare Workers:
```bash
bun run deploy
```

This command uses the deployment script defined in `package.json` and the configuration in `wrangler.ts`. The deployment process includes:

1. Building the project for the Cloudflare Workers environment
2. Validating the configuration in `wrangler.ts`
3. Deploying to Cloudflare Workers using Wrangler CLI

Before deploying, ensure you have:
- Wrangler CLI installed and configured
- Proper Cloudflare account credentials
- Validated `wrangler.ts` configuration

For development on Cloudflare Workers, use:
```bash
bun run dev:cf
```

This starts a local development server that simulates the Cloudflare Workers environment.

**Section sources**
- [package.json](file://package.json)
- [wrangler.ts](file://src/wrangler.ts)
- [AGENTS.md](file://AGENTS.md#L22-L23)

## Versioning and Release Process

The polymarket-kit project follows Semantic Versioning (SemVer) for versioning. The version format is MAJOR.MINOR.PATCH, where:

- MAJOR version for incompatible API changes
- MINOR version for backward-compatible functionality additions
- PATCH version for backward-compatible bug fixes

The release process involves:
1. Creating a release branch from main
2. Updating the version number in package.json
3. Updating the changelog with notable changes
4. Running all tests and checks
5. Creating a release tag
6. Publishing to JSR (JavaScript Registry)

To publish to JSR, use the appropriate commands based on your package manager:
```bash
# Using Deno
deno add @hk/polymarket

# Using Bun
bunx jsr add @hk/polymarket

# Using npm
npx jsr add @hk/polymarket
```

The exports are configured in `jsr.json` and `package.json#exports` to provide proper module resolution.

**Section sources**
- [package.json](file://package.json)
- [jsr.json](file://jsr.json)

## Contribution Requirements

All contributions to the polymarket-kit project must meet the following requirements:

1. **Code Style Adherence**: Follow the established coding style and patterns. Use Biome for formatting and ensure all code passes type checking.

2. **Documentation Updates**: Update relevant documentation when adding new features or changing existing functionality. This includes:
   - README.md for major changes
   - Inline code comments for complex logic
   - Type definitions and JSDoc comments

3. **Backward Compatibility**: Maintain backward compatibility for public interfaces. Breaking changes should be reserved for major version releases and thoroughly documented.

4. **Test Coverage**: Include appropriate tests for new functionality and ensure existing tests pass. Aim for high test coverage, especially for critical paths.

5. **Security Considerations**: Never commit secrets or sensitive information. Store secrets in `.env` files that are git-ignored. Avoid logging sensitive headers or data.

6. **Commit Messages**: Use Conventional Commits format for commit messages (feat:, fix:, chore:, refactor:, etc.).

7. **Pull Request Requirements**: Include a clear description, linked issues, updated tests, and any necessary API documentation or examples.

8. **Performance**: Consider performance implications of changes, especially for frequently called functions and API endpoints.

Following these requirements ensures the stability, maintainability, and security of the polymarket-kit project.

**Section sources**
- [AGENTS.md](file://AGENTS.md#L65-L85)
- [README.md](file://README.md)