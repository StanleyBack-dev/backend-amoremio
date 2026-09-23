import { registerEnumType } from "@nestjs/graphql";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

registerEnumType(AttachmentOwnerType, { name: "AttachmentOwnerType" });
