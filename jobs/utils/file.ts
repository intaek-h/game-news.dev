import { err, ok } from "neverthrow";

export class FileUtilities {
  static DetectContentTypeFromExtension(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      "png": "image/png",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "gif": "image/gif",
      "webp": "image/webp",
      "svg": "image/svg+xml",
      "pdf": "application/pdf",
      "json": "application/json",
      "txt": "text/plain",
      "html": "text/html",
      "htm": "text/html",
      "css": "text/css",
      "js": "application/javascript",
      "xml": "application/xml",
      "zip": "application/zip",
      "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "mp3": "audio/mpeg",
      "mp4": "video/mp4",
      "webm": "video/webm",
      "csv": "text/csv",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  static DetectMimeTypeFromMagicNumbers(data: Uint8Array): string | null {
    if (data.length < 4) {
      return null; // Not enough data to detect
    }

    // Helper to match hex patterns
    const matchPattern = (bytes: number[], pattern: number[]): boolean => {
      return pattern.every((val, i) => val === -1 || bytes[i] === val);
    };

    // Convert first bytes to array for easier comparison
    const bytes = Array.from(data.slice(0, 16));

    // JPEG: FF D8 FF
    if (matchPattern(bytes, [0xFF, 0xD8, 0xFF])) {
      return "image/jpeg";
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (matchPattern(bytes, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
      return "image/png";
    }

    // GIF: 47 49 46 38 (followed by either 37a or 39a)
    if (matchPattern(bytes, [0x47, 0x49, 0x46, 0x38])) {
      return "image/gif";
    }

    // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
    if (
      matchPattern(bytes, [
        0x52,
        0x49,
        0x46,
        0x46,
        -1,
        -1,
        -1,
        -1,
        0x57,
        0x45,
        0x42,
        0x50,
      ])
    ) {
      return "image/webp";
    }

    // PDF: 25 50 44 46
    if (matchPattern(bytes, [0x25, 0x50, 0x44, 0x46])) {
      return "application/pdf";
    }

    // ZIP (includes DOCX, XLSX, PPTX, etc): 50 4B 03 04
    if (matchPattern(bytes, [0x50, 0x4B, 0x03, 0x04])) {
      // Specific Office types could be determined by further inspection,
      // but for basic purposes we'll label as generic ZIP
      return "application/zip";
    }

    // SVG typically starts with "<?xml" or "<svg" (check as text)
    const textStart = new TextDecoder().decode(data.slice(0, 100)).trim()
      .toLowerCase();
    if (textStart.startsWith("<?xml") && textStart.includes("<svg")) {
      return "image/svg+xml";
    }
    if (textStart.startsWith("<svg")) {
      return "image/svg+xml";
    }

    // JSON check - starts with { or [
    if (
      (textStart.startsWith("{") || textStart.startsWith("[")) &&
      (textStart.includes(":") || textStart.includes(","))
    ) {
      return "application/json";
    }

    // HTML check - looks for HTML tags
    if (
      textStart.startsWith("<!doctype html") ||
      textStart.startsWith("<html") ||
      textStart.includes("<head") ||
      textStart.includes("<body")
    ) {
      return "text/html";
    }

    // Check for UTF-8 BOM (EF BB BF)
    if (matchPattern(bytes, [0xEF, 0xBB, 0xBF])) {
      return "text/plain; charset=utf-8";
    }

    // If nothing else matched but looks like text
    if (/^[\x20-\x7E\r\n\t]*$/.test(textStart)) {
      return "text/plain";
    }

    // Default fallback
    return null;
  }

  static ReadFileSafeSync(filePath: string) {
    try {
      return ok(Deno.readTextFileSync(Deno.cwd() + filePath));
    } catch (error) {
      return err({ err: error, message: "Failed to read file" });
    }
  }
}
