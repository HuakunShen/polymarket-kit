// bun build src/weather.ts --outdir build --target node
Bun.build({
  entrypoints: ["src/weather.ts", "src/mcp/polymarket.ts"],
  outdir: "build",
  target: "node",
});
