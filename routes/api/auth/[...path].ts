import { Handlers } from "$fresh/server.ts";
import { auth } from "~/auth.ts";

export const handler: Handlers = {
  GET(req) {
    return auth.handler(req);
  },
  POST(req) {
    return auth.handler(req);
  },
};
