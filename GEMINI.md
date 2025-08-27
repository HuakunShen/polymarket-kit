This is a polyglot monorepo containing a TypeScript/Python SDK and a proxy server for interacting with the Polymarket APIs (CLOB and Gamma). The project is structured as a pnpm workspace for TypeScript and a uv workspace for Python.

The core of the project is a TypeScript SDK that provides a unified interface for the Polymarket CLOB and Gamma APIs. A proxy server built with the Elysia framework exposes this SDK functionality as a RESTful API. The Python part of the project seems to be intended for data analysis and strategy development, utilizing `numpy` and `pandas`.

### Key Technologies

*   **TypeScript**: The primary language for the SDK and proxy server.
*   **Elysia**: A web framework for Bun and Node.js, used for the proxy server.
*   **Python**: Used for data analysis and strategy development.
*   **pnpm**: The package manager for the TypeScript monorepo.
*   **uv**: The package manager for the Python workspace.
*   **Turbo**: A high-performance build system for JavaScript and TypeScript codebases.
*   **Docker**: The project includes a `docker-compose.yml` file, suggesting containerization is an option.

## Building and Running

### TypeScript

The following commands are available for the TypeScript part of the project:

*   **Install dependencies**: `pnpm install`
*   **Run in development mode**: `pnpm run dev`
*   **Build for production**: `pnpm run build`
*   **Run linters**: `pnpm run lint`
*   **Format code**: `pnpm run format`
*   **Type-check**: `pnpm run check-types`

### Python

The Python part of the project is managed with `uv`. To run the Python code, you would typically use `uv run` within the respective workspace packages (`apps/exp-py` or `apps/polymarket`).

*   **Install dependencies**: `uv pip install -r requirements.txt` (or `uv pip sync pyproject.toml`)
*   **Run the main script**: `python main.py`

## Development Conventions

*   **Monorepo Structure**: The project is organized as a monorepo, with separate packages for different components.
*   **TypeScript Coding Style**: The use of `prettier` and `eslint` (inferred from `turbo.json` and `package.json`) suggests a consistent coding style is enforced.
*   **Python Coding Style**: The Python part of the project uses `numpy` and `pandas`, suggesting a data-oriented coding style.
*   **API Documentation**: The proxy server provides OpenAPI documentation at the `/docs` endpoint when running.
*   **Environment Variables**: The application is configured using environment variables, as documented in the `README.md` file.