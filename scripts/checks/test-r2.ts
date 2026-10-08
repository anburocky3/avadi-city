import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load environment variables from .env or .env.local
dotenv.config();

// Validate environment variables exist to satisfy TypeScript strict typing
const accountId: string = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const accessKeyId: string = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
const secretAccessKey: string =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";
const bucketName: string = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "";

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error(
    "❌ ERROR: Missing required Cloudflare R2 environment variables.",
  );
  process.exit(1);
}

// Initialize the S3-compatible R2 client
const r2Client: S3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const testKey: string = `cli-test-${Date.now()}.txt`;

async function runR2Test(): Promise<void> {
  try {
    console.log("Testing connection to Cloudflare R2 bucket...");

    // 1. Test Write (Upload)
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: "Hello Cloudflare R2, TypeScript test successful!",
        ContentType: "text/plain",
      }),
    );
    console.log("✅ SUCCESS: Uploaded test file to R2!");

    // 2. Test Delete (Cleanup)
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }),
    );
    console.log("✅ SUCCESS: Deleted test file from R2!");
    console.log("🎉 All R2 configuration checks passed successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ FAILED: ${error.message}`);
    } else {
      console.error("❌ FAILED with an unknown error:", error);
    }
    process.exit(1);
  }
}

runR2Test();
