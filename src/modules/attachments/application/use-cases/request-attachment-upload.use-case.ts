import { randomUUID } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  AttachmentUploadTicket,
  RequestAttachmentUploadCommand,
} from "@/modules/attachments/application/dto/attachment.commands";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import {
  OBJECT_STORAGE,
  type ObjectStoragePort,
} from "@/modules/attachments/application/ports/object-storage.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import {
  IMAGE_UPLOAD_RULES,
  assertDeclaredUpload,
} from "@/modules/attachments/domain/policies/image-upload.policy";
import { buildTemporaryKey } from "@/modules/attachments/domain/services/attachment-storage-keys";
import { assertUuids } from "@/modules/attachments/domain/services/attachment-ids";

// Step 1 of the upload: validates what the client declares and hands out a
// short-lived signed form so the browser sends the file straight to object
// storage — the bytes never go through the BFF/backend functions.
@Injectable()
export class RequestAttachmentUploadUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
    private readonly policies: AttachmentOwnerPolicyRegistry,
  ) {}

  async execute(
    userId: string,
    command: RequestAttachmentUploadCommand,
  ): Promise<AttachmentUploadTicket> {
    assertUuids({ idStore: command.idStore, ownerId: command.ownerId });
    const policy = this.policies.get(command.ownerType);
    await policy.assertCanManage(userId, command.idStore, command.ownerId);

    const accepted = assertDeclaredUpload(command);

    const pendingSince = new Date(
      Date.now() - IMAGE_UPLOAD_RULES.pendingSlotHoldSeconds * 1000,
    );
    const active = await this.attachmentRepository.countActive(
      {
        idStore: command.idStore,
        ownerType: command.ownerType,
        ownerId: command.ownerId,
      },
      pendingSince,
    );
    if (active >= policy.maxAttachments) {
      throw AppException.from(APP_ERRORS.attachments.limitReached, {
        max: policy.maxAttachments,
      });
    }

    const idAttachment = randomUUID();
    const storageKey = buildTemporaryKey({
      idStore: command.idStore,
      ownerType: command.ownerType,
      ownerId: command.ownerId,
      idAttachment,
    });

    const upload = await this.storage.createUploadForm({
      key: storageKey,
      contentType: accepted.mimeType,
      maxBytes: IMAGE_UPLOAD_RULES.maxBytes,
      expiresInSeconds: IMAGE_UPLOAD_RULES.uploadUrlTtlSeconds,
    });

    await this.attachmentRepository.createPending({
      idAttachment,
      idStore: command.idStore,
      ownerType: command.ownerType,
      ownerId: command.ownerId,
      storageKey,
      mimeType: accepted.mimeType,
      sizeBytes: accepted.sizeBytes,
      originalName: accepted.originalName,
      createdByUserId: userId,
    });

    return { idAttachment, upload, maxBytes: IMAGE_UPLOAD_RULES.maxBytes };
  }
}
