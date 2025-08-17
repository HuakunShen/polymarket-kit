import { app, PORT } from "./index";
import { getBaseUrl, getHostname } from "./utils/env";

const port = typeof PORT === "string" ? Number(PORT) : PORT;
const hostname = getHostname();
app.listen({ port, hostname: "0.0.0.0" });

const baseUrl = getBaseUrl(port);

console.log("🚀 Polymarket Proxy Server started!");
console.log(`📖 API Documentation: ${baseUrl}/docs`);
console.log(`🌐 Server running at: ${baseUrl}`);
console.log("\n📋 Available endpoints:");
console.log("  GET  /                    - API information");
console.log("  GET  /health              - Global health check");
console.log("  GET  /docs                - Swagger documentation");
console.log(
  "  GET  /gamma/markets       - Get markets from Gamma API (with comprehensive filtering)"
);
console.log(
  "  GET  /gamma/events        - Get events from Gamma API (with comprehensive filtering)"
);
console.log(
  "  GET  /clob/prices-history    - Get price history (requires market query param)"
);
console.log("  GET  /clob/health         - CLOB client health check");

// export default app;
