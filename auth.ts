import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.ts";
import schema from "./db/migrations/schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
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
    },
  },
});
