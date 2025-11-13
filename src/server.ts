import Elysia from "elysia";
import { clobRoutes } from "./routes/clob";
import { dataRoutes } from "./routes/data";
import { gammaRoutes } from "./routes/gamma";

export const app = new Elysia()
  // Global error handler
  .onError(({ code, error, set }) => {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[${code}] ${errorMessage}`);

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Invalid request parameters or body",
          details: errorMessage,
        };

      case "NOT_FOUND":
        set.status = 404;
        return {
          error: "Not Found",
          message: "The requested resource was not found",
        };

      case "PARSE":
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Invalid JSON in request body",
        };

      default:
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        };
    }
  })
  .use(dataRoutes)
  .use(gammaRoutes)
  .use(clobRoutes);
