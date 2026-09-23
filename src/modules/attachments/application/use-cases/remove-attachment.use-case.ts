import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { AttachmentRefCommand } from "@/modules/attachments/application/dto/attachment.commands";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import {
  OBJECT_STORAGE,
  type ObjectStoragePort,
} from "@/modules/attachments/application/ports/object-storage.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { assertUuids } from "@/modules/attachments/domain/services/attachment-ids";

@Injectable()
export class RemoveAttachmentUseCase {
  private readonly logger = new Logger(RemoveAttachmentUseCase.name);

  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
    private readonly policies: AttachmentOwnerPolicyRegistry,
  ) {}

  async execute(userId: string, command: AttachmentRefCommand): Promise<void> {
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

    await this.policies
      .get(attachment.ownerType)
      .assertCanManage(userId, attachment.idStore, attachment.ownerId);

    // Row first: once it is gone no reader can get a URL to the objects, so
    // a storage failure afterwards only leaves an unreachable leftover.
    await this.attachmentRepository.delete(
      attachment.idStore,
      attachment.idAttachment,
    );

    // Close the gap left in the positions so the order stays 0..n-1.
    const remaining = await this.attachmentRepository.listReady({
      idStore: attachment.idStore,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
    });
    await this.attachmentRepository.updatePositions(
      attachment.idStore,
      remaining.map((record) => record.idAttachment),
    );

    const keys = [attachment.storageKey, attachment.thumbnailKey].filter(
      (key): key is string => Boolean(key),
    );
    try {
      await this.storage.deleteMany(keys);
    } catch (error) {
      this.logger.error(
        `Failed to delete storage objects [${keys.join(", ")}]: ${(error as Error)?.message}`,
      );
    }
  }
}
