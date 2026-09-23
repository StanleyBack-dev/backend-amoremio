import { Inject, Injectable } from "@nestjs/common";
import type { AttachmentView } from "@/modules/attachments/application/dto/attachment.commands";
import type { AttachmentRecord } from "@/modules/attachments/application/ports/attachment-repository.port";
import {
  OBJECT_STORAGE,
  type ObjectStoragePort,
} from "@/modules/attachments/application/ports/object-storage.port";

@Injectable()
export class AttachmentViewMapper {
  constructor(
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
  ) {}

  async toView(record: AttachmentRecord): Promise<AttachmentView> {
    const [url, thumbnailUrl] = await Promise.all([
      this.storage.signedReadUrl(record.storageKey),
      this.storage.signedReadUrl(record.thumbnailKey ?? record.storageKey),
    ]);
    return {
      idAttachment: record.idAttachment,
      ownerType: record.ownerType,
      ownerId: record.ownerId,
      position: record.position,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      width: record.width,
      height: record.height,
      originalName: record.originalName,
      url,
      thumbnailUrl,
      createdAt: record.createdAt,
    };
  }

  toViews(records: AttachmentRecord[]): Promise<AttachmentView[]> {
    return Promise.all(records.map((record) => this.toView(record)));
  }
}
