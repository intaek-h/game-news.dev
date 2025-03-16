import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const apiKey = req.headers.get("X-API-KEY");
  const validApiKey = Deno.env.get("INTAEK_API_KEY");

  if (!apiKey || apiKey !== validApiKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  return await ctx.next();
}
