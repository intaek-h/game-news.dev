import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// Get environment variables
const TURSO_API_KEY = Deno.env.get("TURSO_API_KEY");
const TURSO_PRODUCTION_DB_URL = Deno.env.get("TURSO_PRODUCTION_DB_URL");

if (!TURSO_API_KEY || !TURSO_PRODUCTION_DB_URL) {
  throw new Error("Missing Turso database credentials in .env file");
}

// Create Turso client
export const client = createClient({
  url: TURSO_PRODUCTION_DB_URL,
  authToken: TURSO_API_KEY,
});

// Initialize Drizzle with the Turso client
export const db = drizzle({ client });
