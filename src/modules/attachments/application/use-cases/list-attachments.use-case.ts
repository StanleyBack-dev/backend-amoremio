import { Inject, Injectable } from "@nestjs/common";
import type {
  AttachmentOwnerCommand,
  AttachmentView,
} from "@/modules/attachments/application/dto/attachment.commands";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentViewMapper } from "@/modules/attachments/application/use-cases/attachment-view.mapper";
import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import { assertUuids } from "@/modules/attachments/domain/services/attachment-ids";

@Injectable()
export class ListAttachmentsUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly policies: AttachmentOwnerPolicyRegistry,
    private readonly viewMapper: AttachmentViewMapper,
  ) {}

  async execute(
    userId: string,
    command: AttachmentOwnerCommand,
  ): Promise<AttachmentView[]> {
    assertUuids({ idStore: command.idStore, ownerId: command.ownerId });
    await this.policies
      .get(command.ownerType)
      .assertCanView(userId, command.idStore, command.ownerId);

    return this.viewMapper.toViews(
      await this.attachmentRepository.listReady(command),
    );
  }

  // For owner modules enriching their own read models (e.g. a product list
  // with cover thumbnails). Performs no authorization: the caller already
  // authorized access to these owners. One query however many owners.
  async forOwners(
    idStore: string,
    ownerType: AttachmentOwnerType,
    ownerIds: string[],
    options?: { coverOnly?: boolean },
  ): Promise<Map<string, AttachmentView[]>> {
    const byOwner = new Map<string, AttachmentView[]>();
    if (ownerIds.length === 0) return byOwner;

    const records = await this.attachmentRepository.listReadyByOwners(
      idStore,
      ownerType,
      ownerIds,
    );
    // Records come ordered by owner then position, so the cover is the
    // first record of each owner run.
    const selected = options?.coverOnly
      ? records.filter(
          (record, index) =>
            index === 0 || records[index - 1].ownerId !== record.ownerId,
        )
      : records;

    const views = await this.viewMapper.toViews(selected);
    for (const view of views) {
      const list = byOwner.get(view.ownerId) ?? [];
      list.push(view);
      byOwner.set(view.ownerId, list);
    }
    return byOwner;
  }
}
