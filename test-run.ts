import { db } from "~/db/client.ts";
import { user } from "~/db/migrations/schema.ts";

const users = await db.select().from(user);
console.log("hi", users);
