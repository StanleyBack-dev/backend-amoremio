import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { AttachmentOwnerPolicy } from "@/modules/attachments/application/ports/attachment-owner-policy.port";
import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

// Owner modules register their policy on init (see
// ProductAttachmentOwnerPolicy in catalog). An owner type without a policy
// is rejected, so a new enum value can't be used before its rules exist.
@Injectable()
export class AttachmentOwnerPolicyRegistry {
  private readonly policies = new Map<
    AttachmentOwnerType,
    AttachmentOwnerPolicy
  >();

  register(policy: AttachmentOwnerPolicy): void {
    this.policies.set(policy.ownerType, policy);
  }

  get(ownerType: AttachmentOwnerType): AttachmentOwnerPolicy {
    const policy = this.policies.get(ownerType);
    if (!policy) {
      throw AppException.from(
        APP_ERRORS.attachments.ownerTypeNotSupported,
        undefined,
      );
    }
    return policy;
  }
}
