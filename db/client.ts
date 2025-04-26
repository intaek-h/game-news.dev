import { Config, createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";

const TURSO_API_KEY = Deno.env.get("TURSO_API_KEY");
const TURSO_PRODUCTION_DB_URL = Deno.env.get("TURSO_PRODUCTION_DB_URL");

if (!TURSO_API_KEY || !TURSO_PRODUCTION_DB_URL) {
  throw new Error("Missing Turso database credentials in .env file");
}

const config: Config = {
  url: `file:${Deno.cwd()}/replica.db`,
  syncUrl: TURSO_PRODUCTION_DB_URL,
  authToken: TURSO_API_KEY,
  syncInterval: 3600, // 1h
};

export const client = createClient(config);

export const db = drizzle({ client });
