import Elysia from "elysia";
import { createClobRoutes } from "./routes/clob";
import { createDataRoutes } from "./routes/data";
import { createGammaRoutes } from "./routes/gamma";

export function createApp(opts?: Pick<NonNullable<ConstructorParameters<typeof Elysia>[0]>, "aot" | "adapter" | "name">) {
	return new Elysia({ normalize: "typebox", ...opts })
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
		.use(createDataRoutes(opts))
		.use(createGammaRoutes(opts))
		.use(createClobRoutes(opts));
}

export const app = createApp();
