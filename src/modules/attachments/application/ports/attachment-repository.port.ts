import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import type { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";

export type AttachmentRecord = {
  idAttachment: string;
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  status: AttachmentStatus;
  storageKey: string;
  thumbnailKey: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksumSha256: string | null;
  position: number;
  originalName: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePendingAttachmentPayload = {
  idAttachment: string;
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  createdByUserId: string;
};

export type MarkAttachmentReadyPayload = {
  idAttachment: string;
  storageKey: string;
  thumbnailKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  checksumSha256: string;
  position: number;
};

export type AttachmentOwnerRef = {
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
};

export interface AttachmentRepositoryPort {
  createPending(
    payload: CreatePendingAttachmentPayload,
  ): Promise<AttachmentRecord>;
  markReady(payload: MarkAttachmentReadyPayload): Promise<AttachmentRecord>;
  findById(
    idStore: string,
    idAttachment: string,
  ): Promise<AttachmentRecord | null>;
  // READY attachments of one owner, ordered by position.
  listReady(owner: AttachmentOwnerRef): Promise<AttachmentRecord[]>;
  // READY attachments of many owners at once (avoids N+1 on list screens),
  // ordered by owner then position.
  listReadyByOwners(
    idStore: string,
    ownerType: AttachmentOwnerType,
    ownerIds: string[],
  ): Promise<AttachmentRecord[]>;
  // READY plus still-live PENDING slots — what counts against the limit.
  countActive(owner: AttachmentOwnerRef, pendingSince: Date): Promise<number>;
  updatePositions(idStore: string, orderedIds: string[]): Promise<void>;
  delete(idStore: string, idAttachment: string): Promise<void>;
  listStalePending(olderThan: Date, limit: number): Promise<AttachmentRecord[]>;
  deleteMany(idAttachments: string[]): Promise<void>;
}

export const ATTACHMENT_REPOSITORY = Symbol("ATTACHMENT_REPOSITORY");
