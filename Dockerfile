FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages
COPY package.json ./package.json
COPY bun.lock ./bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production
RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/run.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000

# Run in repo root
# docker build -t polymarket-proxy .
# docker run --rm -p 3000:3000 polymarket-proxy