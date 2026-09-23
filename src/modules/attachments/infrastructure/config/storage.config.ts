import { registerAs } from "@nestjs/config";

export type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

// Neon Object Storage (S3-compatible). The endpoint is branch-scoped: each
// Neon branch (dev, production) has its own bucket and credentials.
export default registerAs(
  "storage",
  (): Partial<StorageConfig> => ({
    endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined,
    region: process.env.AWS_REGION || undefined,
    bucket: process.env.AWS_S3_BUCKET || undefined,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
  }),
);
