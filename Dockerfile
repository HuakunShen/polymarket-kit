
FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
RUN bun install -g pnpm
COPY apps/proxy/package.json ./apps/proxy/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json

RUN pnpm install --frozen-lockfile

COPY apps/proxy ./apps/proxy
COPY packages/sdk ./packages/sdk

ENV NODE_ENV=production
RUN cd /app/apps/proxy && bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/run.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/apps/proxy/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000

# Run in repo root
# docker build -t polymarket-proxy -f apps/proxy/Dockerfile .
