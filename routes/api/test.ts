import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST(req) {
    const apiKey = req.headers.get("X-API-KEY");
    return Response.json({ apiKey });
  },
};
