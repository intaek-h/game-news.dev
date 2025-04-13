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
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return await ctx.next();
}
