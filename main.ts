import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { config } from "~/src/config/app.ts";
import { apiKeyAuth } from "~/src/middleware/authMiddleware.ts";
import articleRoutes from "~/src/routes/articleRoutes.ts";
import frontRouter from "~/src/routes/frontRoutes.tsx";
import { kv } from "~/kv.ts";

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

app.post("/api/test", async (c) => {
  const store = await kv.enqueue(["hot-topic", {
    topic: "Lego bringing game development in-house",
    gid: 100,
  }], { delay: 1000 });

  return c.json({ message: "Hello, World!", store: store.versionstamp });
});

Deno.cron("sample-cron", { minute: 1 }, () => {
  console.log("Running cron job", new Date());
});

// Start the server
console.log(`Server running on port ${config.server.port}`);

Deno.serve(app.fetch);
