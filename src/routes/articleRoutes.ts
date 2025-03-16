import { Hono } from "@hono/hono";
import { ArticleController } from "~/src/controllers/articleController.ts";

// Create a router for article endpoints
const articleRouter = new Hono();

// Define routes
articleRouter.post(
  "/generate",
  async (c) => c.json(await ArticleController.EnqueueHotTopics()),
);

export default articleRouter;
