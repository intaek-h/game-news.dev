import { db } from "~/db/client.ts";
import { languages } from "~/db/migrations/schema.ts";

export class LanguageAtom {
  static async GetAllLanguages() {
    try {
      const result = await db.select().from(languages).all();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
