import "~/cron.ts";

import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { config } from "~/src/config/app.ts";
import { apiKeyAuth } from "~/src/middleware/authMiddleware.ts";
import articleRoutes from "~/src/routes/articleRoutes.ts";
import frontRouter from "~/src/routes/frontRoutes.tsx";
import { ImageSearchService } from "~/src/services/imageSearchService.ts";

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
  const body = await c.req.json();

  if (!body || !body.query) return c.json({ message: "Invalid request" }, 400);

  const openVerse = await ImageSearchService.SearchOpenverseImages(body.query);
  openVerse.results;
  const google = await ImageSearchService.SearchGoogleImages(body.query);

  return c.json({
    google: google.items.map((v) => ({
      imgUrl: v.link,
      creditUrl: v.displayLink,
      attribution: v.snippet,
      license: "cc_0",
    })),
    openVerse: openVerse.results.map((v) => ({
      imgUrl: v.url,
      creditUrl: v.creator_url,
      attribution: v.attribution,
      license: v.license,
    })),
  });
});

// Start the server
console.log(`Server running on port ${config.server.port}`);

Deno.serve(app.fetch);
