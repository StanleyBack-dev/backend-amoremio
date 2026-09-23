import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  AttachmentRefCommand,
  AttachmentView,
  ReorderAttachmentsCommand,
} from "@/modules/attachments/application/dto/attachment.commands";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentOwnerRef,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentViewMapper } from "@/modules/attachments/application/use-cases/attachment-view.mapper";
import { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";
import {
  assertCompleteOrder,
  moveToFront,
} from "@/modules/attachments/domain/services/attachment-ordering";
import { assertUuids } from "@/modules/attachments/domain/services/attachment-ids";

@Injectable()
export class ReorderAttachmentsUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly policies: AttachmentOwnerPolicyRegistry,
    private readonly viewMapper: AttachmentViewMapper,
  ) {}

  async execute(
    userId: string,
    command: ReorderAttachmentsCommand,
  ): Promise<AttachmentView[]> {
    assertUuids({ idStore: command.idStore, ownerId: command.ownerId });
    await this.policies
      .get(command.ownerType)
      .assertCanManage(userId, command.idStore, command.ownerId);

    const owner: AttachmentOwnerRef = {
      idStore: command.idStore,
      ownerType: command.ownerType,
      ownerId: command.ownerId,
    };
    const current = await this.attachmentRepository.listReady(owner);
    assertCompleteOrder(
      current.map((record) => record.idAttachment),
      command.orderedIds,
    );

    return this.applyOrder(owner, command.orderedIds);
  }

  // The cover is the first attachment, so this is a reorder that moves one
  // id to the front.
  async setCover(
    userId: string,
    command: AttachmentRefCommand,
  ): Promise<AttachmentView[]> {
    assertUuids({
      idStore: command.idStore,
      idAttachment: command.idAttachment,
    });
    const attachment = await this.attachmentRepository.findById(
      command.idStore,
      command.idAttachment,
    );
    if (!attachment || attachment.status !== AttachmentStatus.READY) {
      throw AppException.from(APP_ERRORS.attachments.notFound, undefined);
    }

    await this.policies
      .get(attachment.ownerType)
      .assertCanManage(userId, attachment.idStore, attachment.ownerId);

    const owner: AttachmentOwnerRef = {
      idStore: attachment.idStore,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
    };
    const current = await this.attachmentRepository.listReady(owner);
    const orderedIds = moveToFront(
      current.map((record) => record.idAttachment),
      attachment.idAttachment,
    );

    return this.applyOrder(owner, orderedIds);
  }

  private async applyOrder(
    owner: AttachmentOwnerRef,
    orderedIds: string[],
  ): Promise<AttachmentView[]> {
    await this.attachmentRepository.updatePositions(owner.idStore, orderedIds);
    return this.viewMapper.toViews(
      await this.attachmentRepository.listReady(owner),
    );
  }
}
