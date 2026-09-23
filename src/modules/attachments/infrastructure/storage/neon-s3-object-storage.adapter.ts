import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  CreateUploadFormParams,
  ObjectStoragePort,
  PresignedUploadForm,
  PutObjectParams,
  StoredObjectInfo,
} from "@/modules/attachments/application/ports/object-storage.port";
import type { StorageConfig } from "@/modules/attachments/infrastructure/config/storage.config";

// Read URLs are signed as if issued at the start of the current window and
// stay valid for two windows. Every request in the same hour gets the exact
// same URL, so browsers can reuse cached images instead of re-downloading
// them on each page load, while each URL is still guaranteed at least one
// full hour of validity.
const READ_URL_WINDOW_SECONDS = 60 * 60;
const READ_URL_TTL_SECONDS = READ_URL_WINDOW_SECONDS * 2;

const DELETE_BATCH_LIMIT = 1000;

@Injectable()
export class NeonS3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(NeonS3ObjectStorageAdapter.name);
  private client: S3Client | null = null;
  private bucket = "";

  constructor(private readonly configService: ConfigService) {}

  async createUploadForm(
    params: CreateUploadFormParams,
  ): Promise<PresignedUploadForm> {
    const client = this.getClient();
    const result = await this.run("createUploadForm", () =>
      createPresignedPost(client, {
        Bucket: this.bucket,
        Key: params.key,
        Expires: params.expiresInSeconds,
        // Enforced by the storage itself: a different key, content type or
        // a file larger than maxBytes is rejected before it is stored.
        Conditions: [
          ["content-length-range", 1, params.maxBytes],
          ["eq", "$Content-Type", params.contentType],
        ],
        Fields: { "Content-Type": params.contentType },
      }),
    );
    return {
      url: result.url,
      fields: result.fields,
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000),
    };
  }

  async head(key: string): Promise<StoredObjectInfo | null> {
    const client = this.getClient();
    try {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        sizeBytes: Number(result.ContentLength ?? 0),
        contentType: result.ContentType ?? null,
      };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw this.toAppException("head", error);
    }
  }

  async getBuffer(key: string, maxBytes: number): Promise<Buffer> {
    const client = this.getClient();
    const result = await this.run("getBuffer", () =>
      client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          // Never pull more than the allowed size into memory, whatever
          // the object actually holds.
          Range: `bytes=0-${maxBytes}`,
        }),
      ),
    );
    if (!result.Body) {
      throw AppException.from(APP_ERRORS.attachments.uploadNotFound, undefined);
    }
    const bytes = await result.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async put(params: PutObjectParams): Promise<void> {
    const client = this.getClient();
    await this.run("put", () =>
      client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
          CacheControl: params.cacheControl,
        }),
      ),
    );
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const client = this.getClient();
    for (let start = 0; start < keys.length; start += DELETE_BATCH_LIMIT) {
      const chunk = keys.slice(start, start + DELETE_BATCH_LIMIT);
      await this.run("deleteMany", () =>
        client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
          }),
        ),
      );
    }
  }

  async signedReadUrl(key: string): Promise<string> {
    const client = this.getClient();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const windowStart = nowSeconds - (nowSeconds % READ_URL_WINDOW_SECONDS);
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      {
        expiresIn: READ_URL_TTL_SECONDS,
        signingDate: new Date(windowStart * 1000),
      },
    );
  }

  // Built lazily so environments without storage credentials still boot;
  // only the attachment operations fail, with an explicit error.
  private getClient(): S3Client {
    if (this.client) return this.client;

    const config = this.configService.get<Partial<StorageConfig>>("storage");
    if (
      !config?.endpoint ||
      !config.region ||
      !config.bucket ||
      !config.accessKeyId ||
      !config.secretAccessKey
    ) {
      throw AppException.from(
        APP_ERRORS.attachments.storageNotConfigured,
        undefined,
      );
    }

    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      // Neon only supports path-style addressing.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    return this.client;
  }

  private async run<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.toAppException(operation, error);
    }
  }

  private toAppException(operation: string, error: unknown): AppException {
    if (error instanceof AppException) return error;
    this.logger.error(
      `Object storage ${operation} failed: ${(error as Error)?.name} ${(error as Error)?.message}`,
    );
    return AppException.from(APP_ERRORS.attachments.storageFailure, undefined);
  }
}
