import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { config } from "~/src/config/app.ts";
import { errorHandler } from "~/src/middleware/errorHandler.ts";
import articleRoutes from "~/src/routes/articleRoutes.ts";

// Create main application
const app = new Hono();

// Apply global middleware
app.use("*", logger());
app.use("*", errorHandler);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Mount route groups
app.route("/api/articles", articleRoutes);

// Start the server
console.log(`Server running on port ${config.server.port}`);
Deno.serve(app.fetch);
