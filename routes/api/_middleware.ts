import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  // Get allowed origins from environment or use a default value
  const allowedOrigin = Deno.env.get("SELF_URL") || "";

  // Get the origin from the request
  const origin = req.headers.get("Origin") || "";

  // Create response headers for CORS
  const corsHeaders = new Headers();

  // Check if the origin is allowed
  if (allowedOrigin === origin) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigin === ("*")) {
    corsHeaders.set("Access-Control-Allow-Origin", "*");
  }

  // Set other CORS headers
  corsHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  corsHeaders.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-API-KEY, Authorization",
  );
  corsHeaders.set("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // API key validation (keep existing logic for now)
  const apiKey = req.headers.get("X-API-KEY");
  const validApiKey = Deno.env.get("INTAEK_API_KEY");

  if (!apiKey || apiKey !== validApiKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Add CORS headers to the response
  const response = await ctx.next();

  // Copy the CORS headers to the actual response
  for (const [key, value] of corsHeaders.entries()) {
    response.headers.set(key, value);
  }

  return response;
}
