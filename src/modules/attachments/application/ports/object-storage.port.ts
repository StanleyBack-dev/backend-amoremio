export type PresignedUploadForm = {
  url: string;
  // Form fields the browser must send, in order, before the file field.
  fields: Record<string, string>;
  expiresAt: Date;
};

export type CreateUploadFormParams = {
  key: string;
  contentType: string;
  maxBytes: number;
  expiresInSeconds: number;
};

export type StoredObjectInfo = {
  sizeBytes: number;
  contentType: string | null;
};

export type PutObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

// Provider-agnostic object storage. The only implementation today targets
// Neon Object Storage through its S3-compatible API, but nothing above the
// infrastructure layer knows that.
export interface ObjectStoragePort {
  // Signed browser form upload whose policy the storage itself enforces
  // (exact key, content type and size range).
  createUploadForm(
    params: CreateUploadFormParams,
  ): Promise<PresignedUploadForm>;
  // null when the object does not exist.
  head(key: string): Promise<StoredObjectInfo | null>;
  getBuffer(key: string, maxBytes: number): Promise<Buffer>;
  put(params: PutObjectParams): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  // Signed, time-limited read URL. Computed locally, no network round trip.
  signedReadUrl(key: string): Promise<string>;
}

export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");
