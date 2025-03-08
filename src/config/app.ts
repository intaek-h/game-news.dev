// Application configuration
export const config = {
  // Server settings
  server: {
    port: 8000,
    host: "localhost",
  },

  // Environment settings
  env: {
    isDev: Deno.env.get("ENVIRONMENT") !== "production",
  },

  // Database settings
  database: {
    url: Deno.env.get("TURSO_PRODUCTION_DB_URL"),
    apiKey: Deno.env.get("TURSO_API_KEY"),
  },
};
