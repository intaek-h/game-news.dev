import { HTTPException } from "@hono/hono/http-exception";

import type { Context, Next } from "@hono/hono";

// API key authentication middleware
export async function apiKeyAuth(c: Context, next: Next) {
  // Skip auth for health check endpoint
  if (c.req.path === "/health" || !c.req.path.startsWith("/api")) {
    return next();
  }

  const apiKey = c.req.header("X-API-KEY");
  const validApiKey = Deno.env.get("INTAEK_API_KEY");

  if (!apiKey || apiKey !== validApiKey) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await next();
}
