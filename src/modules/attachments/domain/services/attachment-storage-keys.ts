import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import { IMAGE_UPLOAD_RULES } from "@/modules/attachments/domain/policies/image-upload.policy";

// Keys are built only from server-generated ids — never from the client's
// file name — so a key can't be steered into another store's prefix.
// Final objects get a fresh key per attachment and are never overwritten,
// which keeps them safe to cache as immutable.

export type AttachmentKeyParts = {
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  idAttachment: string;
};

export function buildTemporaryKey(parts: AttachmentKeyParts): string {
  return `tmp/${parts.idStore}/${parts.idAttachment}`;
}

function finalPrefix(parts: AttachmentKeyParts): string {
  return `stores/${parts.idStore}/${parts.ownerType.toLowerCase()}/${parts.ownerId}/${parts.idAttachment}`;
}

export function buildFinalKey(parts: AttachmentKeyParts): string {
  return `${finalPrefix(parts)}.${IMAGE_UPLOAD_RULES.output.extension}`;
}

export function buildThumbnailKey(parts: AttachmentKeyParts): string {
  return `${finalPrefix(parts)}_thumb.${IMAGE_UPLOAD_RULES.output.extension}`;
}
