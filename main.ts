import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { config } from "~/src/config/app.ts";
import { apiKeyAuth } from "~/src/middleware/authMiddleware.ts";
import articleRoutes from "~/src/routes/articleRoutes.ts";
import frontRouter from "~/src/routes/frontRoutes.tsx";

const SELF_URL = Deno.env.get("SELF_URL") ?? "";

if (!SELF_URL) {
  console.error("SELF_URL is not set");
  Deno.exit(1);
}

// Create main application
const app = new Hono();

// Apply global middleware
app.use("*", logger());
app.use("*", apiKeyAuth);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Mount route groups
app.route("/", frontRouter);
app.route("/api/articles", articleRoutes);

app.post("/api/test", (c) => {
  // const images = await ImageSearchService.SearchGoogleImages("Elden Ring");
  // const images = await ImageSearchService.SearchOpenverseImages("Elden Ring");

  // return c.json(images);

  return c.json({ message: "Test" });
});

Deno.cron("sample-cron", "* * * * *", async () => {
  const response = await fetch(SELF_URL + "/api/test", { method: "POST" });
  const json = await response.json();
  console.log(json);
});

// Start the server
console.log(`Server running on port ${config.server.port}`);

Deno.serve(app.fetch);
