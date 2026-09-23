import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import type { PresignedUploadForm } from "@/modules/attachments/application/ports/object-storage.port";

export type AttachmentOwnerCommand = {
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
};

export type RequestAttachmentUploadCommand = AttachmentOwnerCommand & {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type AttachmentRefCommand = {
  idStore: string;
  idAttachment: string;
};

export type ReorderAttachmentsCommand = AttachmentOwnerCommand & {
  orderedIds: string[];
};

export type AttachmentUploadTicket = {
  idAttachment: string;
  upload: PresignedUploadForm;
  maxBytes: number;
};

export type AttachmentView = {
  idAttachment: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  position: number;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  createdAt: Date;
};
