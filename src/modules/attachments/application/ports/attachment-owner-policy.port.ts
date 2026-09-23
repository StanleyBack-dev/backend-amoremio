import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

// Implemented by the module that owns the aggregate (e.g. catalog for
// PRODUCT) and registered in AttachmentOwnerPolicyRegistry. This keeps the
// attachments module generic: it never imports the owners' modules.
export interface AttachmentOwnerPolicy {
  readonly ownerType: AttachmentOwnerType;
  readonly maxAttachments: number;
  // Must throw when the owner doesn't exist in the store or the user lacks
  // permission to change its attachments.
  assertCanManage(
    userId: string,
    idStore: string,
    ownerId: string,
  ): Promise<void>;
  // Must throw when the user can't read the owner's attachments.
  assertCanView(
    userId: string,
    idStore: string,
    ownerId: string,
  ): Promise<void>;
}
