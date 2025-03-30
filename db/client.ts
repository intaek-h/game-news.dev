import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";

const TURSO_API_KEY = Deno.env.get("TURSO_API_KEY");
const TURSO_PRODUCTION_DB_URL = Deno.env.get("TURSO_PRODUCTION_DB_URL");

if (!TURSO_API_KEY || !TURSO_PRODUCTION_DB_URL) {
  throw new Error("Missing Turso database credentials in .env file");
}

export const client = createClient({
  url: `file:${Deno.cwd()}/replica.db`,
  syncUrl: TURSO_PRODUCTION_DB_URL,
  authToken: TURSO_API_KEY,
  syncInterval: 3600, // 1h
});

if (Deno.args.includes("sync-replica")) {
  await client.sync();

  console.info("Replica DB Synced With Production DB");
} else {
  console.info("Skipping Replica DB Sync");
  console.info(
    "To sync, run the build command with the 'sync-replica' argument",
  );
}

export const db = drizzle({ client });
