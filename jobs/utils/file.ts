import { err, ok } from "neverthrow";

export class FileUtilities {
  static ReadFileSafeSync(filePath: string) {
    try {
      return ok(Deno.readTextFileSync(Deno.cwd() + filePath));
    } catch (error) {
      return err({ err: error, message: "Failed to read file: " + filePath });
    }
  }
}
