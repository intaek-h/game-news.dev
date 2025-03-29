import { db } from "~/db/client.ts";
import { languages } from "~/db/migrations/schema.ts";

export class LanguageAtom {
  static async GetAllLanguages() {
    try {
      const start = performance.now();
      const result = await db.select().from(languages).all();
      const end = performance.now();
      console.log(
        `LanguageAtom.GetAllLanguages() -> ${Math.round(end - start)}ms`,
      );
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
