import { app, PORT } from "./index";

// Start the server and explicitly bind to 0.0.0.0 for container runtime
const port = typeof PORT === "string" ? Number(PORT) : PORT;
app.listen({ port, hostname: "0.0.0.0" });

console.log("🚀 Polymarket Proxy Server started!");
console.log(
  `📖 API Documentation: http://${app.server?.hostname}:${app.server?.port}/docs`
);
console.log(
  `🌐 Server running at: http://${app.server?.hostname}:${app.server?.port}`
);
console.log("\n📋 Available endpoints:");
console.log("  GET  /                    - API information");
console.log("  GET  /health              - Global health check");
console.log("  GET  /docs                - Swagger documentation");
console.log("  GET  /gamma/markets       - Get markets from Gamma API (with comprehensive filtering)");
console.log("  GET  /gamma/events        - Get events from Gamma API (with comprehensive filtering)");
console.log("  GET  /clob/prices-history    - Get price history (requires market query param)");
console.log("  GET  /clob/health         - CLOB client health check");

// export default app;
