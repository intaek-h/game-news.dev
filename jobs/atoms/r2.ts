import { FileUtilities } from "~/jobs/utils/file.ts";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const BUCKET = Deno.env.get("R2_BUCKET");

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
  throw new Error(
    "R2 configuration is missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET environment variables.",
  );
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export class R2Atom {
  static async PutObject(
    bucket: string,
    key: string,
    file: Uint8Array,
    contentType?: string,
  ): Promise<{ url: string; etag?: string }> {
    if (!bucket || !key) {
      throw new Error("Missing required parameters");
    }

    if (!file || file.length === 0) {
      throw new Error("File data is empty");
    }

    // Use provided content type or detect from file signatures and fallback to extension
    const detectedType = contentType ||
      FileUtilities.DetectMimeTypeFromMagicNumbers(file) ||
      FileUtilities.DetectContentTypeFromExtension(key);

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: detectedType,
        Metadata: {
          "x-amz-meta-original-filename": key,
          "x-amz-meta-original-content-type": detectedType,
        },
      });
      const response = await s3.send(command);

      return {
        url: `https://${bucket}.r2.dev/${key}`,
        etag: response.ETag || "",
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`R2 upload error: ${error.message}`);
      }
      throw error;
    }
  }
}
