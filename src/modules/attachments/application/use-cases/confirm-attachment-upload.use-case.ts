import { createHash } from "crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  AttachmentRefCommand,
  AttachmentView,
} from "@/modules/attachments/application/dto/attachment.commands";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRecord,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import {
  IMAGE_PROCESSOR,
  type ImageProcessorPort,
} from "@/modules/attachments/application/ports/image-processor.port";
import {
  OBJECT_STORAGE,
  type ObjectStoragePort,
} from "@/modules/attachments/application/ports/object-storage.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentViewMapper } from "@/modules/attachments/application/use-cases/attachment-view.mapper";
import { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";
import {
  IMAGE_UPLOAD_RULES,
  assertImageDimensions,
  assertImageSignature,
  assertSizeWithinLimit,
  isAllowedImageMime,
} from "@/modules/attachments/domain/policies/image-upload.policy";
import {
  buildFinalKey,
  buildThumbnailKey,
} from "@/modules/attachments/domain/services/attachment-storage-keys";
import { assertUuids } from "@/modules/attachments/domain/services/attachment-ids";

// Final objects never change under the same key, so readers may cache them
// for as long as their signed URL lives.
const FINAL_CACHE_CONTROL = "private, max-age=31536000, immutable";

// Step 2 of the upload: nothing the client declared is trusted here. The
// uploaded bytes are re-checked (size, magic bytes, decodability,
// dimensions), re-encoded into the canonical format and only then made
// visible. Any rejection discards the upload entirely.
@Injectable()
export class ConfirmAttachmentUploadUseCase {
  private readonly logger = new Logger(ConfirmAttachmentUploadUseCase.name);

  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
    @Inject(IMAGE_PROCESSOR)
    private readonly imageProcessor: ImageProcessorPort,
    private readonly policies: AttachmentOwnerPolicyRegistry,
    private readonly viewMapper: AttachmentViewMapper,
  ) {}

  async execute(
    userId: string,
    command: AttachmentRefCommand,
  ): Promise<AttachmentView> {
    assertUuids({
      idStore: command.idStore,
      idAttachment: command.idAttachment,
    });
    const attachment = await this.attachmentRepository.findById(
      command.idStore,
      command.idAttachment,
    );
    if (!attachment) {
      throw AppException.from(APP_ERRORS.attachments.notFound, undefined);
    }

    const policy = this.policies.get(attachment.ownerType);
    await policy.assertCanManage(
      userId,
      attachment.idStore,
      attachment.ownerId,
    );

    // Idempotent: a repeated confirm (double click, network retry) just
    // returns the already processed attachment.
    if (attachment.status === AttachmentStatus.READY) {
      return this.viewMapper.toView(attachment);
    }

    const ageMs = Date.now() - attachment.createdAt.getTime();
    if (ageMs > IMAGE_UPLOAD_RULES.pendingTtlSeconds * 1000) {
      await this.discard(attachment);
      throw AppException.from(APP_ERRORS.attachments.uploadExpired, undefined);
    }

    const stored = await this.storage.head(attachment.storageKey);
    if (!stored) {
      // Kept on purpose: the client may still retry the upload while the
      // signed form is valid. Abandoned rows are purged by the cleanup job.
      throw AppException.from(APP_ERRORS.attachments.uploadNotFound, undefined);
    }

    const processed = await this.validateAndNormalize(
      attachment,
      stored.sizeBytes,
    );

    const ready = await this.attachmentRepository.listReady({
      idStore: attachment.idStore,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
    });
    if (ready.length >= policy.maxAttachments) {
      await this.discard(attachment);
      throw AppException.from(APP_ERRORS.attachments.limitReached, {
        max: policy.maxAttachments,
      });
    }

    const keyParts = {
      idStore: attachment.idStore,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      idAttachment: attachment.idAttachment,
    };
    const finalKey = buildFinalKey(keyParts);
    const thumbnailKey = buildThumbnailKey(keyParts);

    await Promise.all([
      this.storage.put({
        key: finalKey,
        body: processed.main.buffer,
        contentType: processed.mimeType,
        cacheControl: FINAL_CACHE_CONTROL,
      }),
      this.storage.put({
        key: thumbnailKey,
        body: processed.thumbnail.buffer,
        contentType: processed.mimeType,
        cacheControl: FINAL_CACHE_CONTROL,
      }),
    ]);

    let saved: AttachmentRecord;
    try {
      saved = await this.attachmentRepository.markReady({
        idAttachment: attachment.idAttachment,
        storageKey: finalKey,
        thumbnailKey,
        mimeType: processed.mimeType,
        sizeBytes: processed.main.buffer.length,
        width: processed.main.width,
        height: processed.main.height,
        checksumSha256: processed.checksumSha256,
        position: ready.length,
      });
    } catch (error) {
      await this.safeDelete([finalKey, thumbnailKey]);
      throw error;
    }

    await this.safeDelete([attachment.storageKey]);
    return this.viewMapper.toView(saved);
  }

  private async validateAndNormalize(
    attachment: AttachmentRecord,
    storedSize: number,
  ) {
    try {
      assertSizeWithinLimit(storedSize);
      const original = await this.storage.getBuffer(
        attachment.storageKey,
        IMAGE_UPLOAD_RULES.maxBytes,
      );
      assertSizeWithinLimit(original.length);
      const signature = assertImageSignature(original);

      const info = await this.imageProcessor.inspect(original);
      // The decoder must agree with the magic bytes; a mismatch means a
      // crafted file (e.g. a valid JPEG header glued onto something else).
      if (
        !info.mimeType ||
        !isAllowedImageMime(info.mimeType) ||
        info.mimeType !== signature
      ) {
        throw AppException.from(APP_ERRORS.attachments.invalidImage, undefined);
      }
      assertImageDimensions(info.width, info.height);

      const normalized = await this.imageProcessor.normalize(original);
      return {
        ...normalized,
        checksumSha256: createHash("sha256").update(original).digest("hex"),
      };
    } catch (error) {
      await this.discard(attachment);
      if (error instanceof AppException) {
        throw error;
      }
      // Decoder failures (truncated/corrupted files, unsupported variants)
      // surface as plain errors from the image library.
      this.logger.warn(
        `Rejected attachment ${attachment.idAttachment}: ${(error as Error)?.message}`,
      );
      throw AppException.from(APP_ERRORS.attachments.invalidImage, undefined);
    }
  }

  private async discard(attachment: AttachmentRecord): Promise<void> {
    await this.safeDelete([attachment.storageKey]);
    await this.attachmentRepository.delete(
      attachment.idStore,
      attachment.idAttachment,
    );
  }

  // Storage cleanup is best effort: a leftover object is harmless (never
  // referenced, private bucket), a failed request must not mask the real
  // outcome of the operation.
  private async safeDelete(keys: string[]): Promise<void> {
    try {
      await this.storage.deleteMany(keys);
    } catch (error) {
      this.logger.error(
        `Failed to delete storage objects [${keys.join(", ")}]: ${(error as Error)?.message}`,
      );
    }
  }
}
