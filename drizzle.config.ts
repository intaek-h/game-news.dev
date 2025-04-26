import type { Config } from "drizzle-kit";

const TURSO_API_KEY = Deno.env.get("TURSO_API_KEY");
const TURSO_PRODUCTION_DB_URL = Deno.env.get("TURSO_PRODUCTION_DB_URL");

if (!TURSO_API_KEY || !TURSO_PRODUCTION_DB_URL) {
  console.error("Missing Turso database credentials in .env file");
}

export default {
  schema: "./db/migrations/schema.ts",
  out: "./db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: TURSO_PRODUCTION_DB_URL ?? "",
    authToken: TURSO_API_KEY ?? "",
  },
} satisfies Config;
