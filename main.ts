import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { config } from "~/src/config/app.ts";
import { apiKeyAuth } from "~/src/middleware/authMiddleware.ts";
import articleRoutes from "~/src/routes/articleRoutes.ts";
import frontRouter from "~/src/routes/frontRoutes.tsx";
import "~/cron.ts";
import { ArticleService } from "~/src/services/articleService.ts";

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
  const [aiArticle] = await ArticleService.writeArticles([
    "Silent Hill Transmission set for March 2025 with Silent Hill f details",
  ]);

  if (!aiArticle) {
    return console.error("Failed to write articles");
  }

  const [inspectedArticle] = await ArticleService.finalArticleInspection(
    [aiArticle.reply],
  );

  if (!inspectedArticle) {
    return console.error("Failed to inspect articles");
  }

  const [translatedArticle] = await ArticleService.translateArticles(
    [inspectedArticle],
  );

  return c.json({ aiArticle, inspectedArticle, translatedArticle });
});

// Start the server
console.log(`Server running on port ${config.server.port}`);

Deno.serve(app.fetch);
