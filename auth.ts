import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.ts";
import schema from "./db/migrations/schema.ts";

const selfUrl = Deno.env.get("SELF_URL");

if (!selfUrl) {
  console.error("SELF_URL is not set");
}

export const auth = betterAuth({
  baseURL: selfUrl,
  trustedOrigins: [selfUrl ?? ""],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true, // TODO: email verification
  },
  user: {
    additionalFields: {
      // better-auth/cli generate 커맨드가 기본적으로 생성하는 user 테이블에 추가 필드를 추가할 수 있습니다.
      type: {
        type: "string", // admin | null
        default: null,
        input: false,
      },
      preferredLanguage: {
        type: "string",
        default: "en",
        input: false,
      },
      deletedAt: {
        type: "date",
        default: null,
        input: false,
      },
    },
  },
});
