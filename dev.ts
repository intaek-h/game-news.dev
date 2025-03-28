#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

await dev(import.meta.url, "./main.ts", config);

// Wait for any background tasks to complete
await new Promise((resolve) => setTimeout(resolve, 5000));

Deno.exit();
