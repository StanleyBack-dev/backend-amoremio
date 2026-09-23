import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseResponseDto } from "@/common/responses/dtos/base-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import type {
  AttachmentUploadTicket,
  AttachmentView,
} from "@/modules/attachments/application/dto/attachment.commands";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

@ObjectType()
export class AttachmentResponseDto {
  static fromView(view: AttachmentView): AttachmentResponseDto {
    const dto = new AttachmentResponseDto();
    Object.assign(dto, view);
    return dto;
  }

  @Field()
  idAttachment!: string;

  @Field(() => AttachmentOwnerType)
  ownerType!: AttachmentOwnerType;

  @Field()
  ownerId!: string;

  @Field(() => Int, { description: "0 is the cover image." })
  position!: number;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  sizeBytes!: number;

  @Field(() => Int, { nullable: true })
  width?: number | null;

  @Field(() => Int, { nullable: true })
  height?: number | null;

  @Field()
  originalName!: string;

  @Field({ description: "Signed, time-limited URL (valid for at least 1h)." })
  url!: string;

  @Field({ description: "Signed, time-limited URL (valid for at least 1h)." })
  thumbnailUrl!: string;

  @Field(() => Date)
  createdAt!: Date;
}

@ObjectType()
export class UploadFormFieldDto {
  @Field()
  name!: string;

  @Field()
  value!: string;
}

@ObjectType()
export class AttachmentUploadTicketDto {
  static fromTicket(ticket: AttachmentUploadTicket): AttachmentUploadTicketDto {
    const dto = new AttachmentUploadTicketDto();
    dto.idAttachment = ticket.idAttachment;
    dto.uploadUrl = ticket.upload.url;
    dto.fields = Object.entries(ticket.upload.fields).map(([name, value]) => ({
      name,
      value,
    }));
    dto.expiresAt = ticket.upload.expiresAt;
    dto.maxBytes = ticket.maxBytes;
    return dto;
  }

  @Field()
  idAttachment!: string;

  @Field({ description: "Target of a multipart/form-data POST." })
  uploadUrl!: string;

  @Field(() => [UploadFormFieldDto], {
    description: "Send these form fields, in order, before the `file` field.",
  })
  fields!: UploadFormFieldDto[];

  @Field(() => Date)
  expiresAt!: Date;

  @Field(() => Int)
  maxBytes!: number;
}

export const AttachmentUploadTicketResponseDto = createDataResponseDto(
  AttachmentUploadTicketDto,
  "AttachmentUploadTicketResponseDto",
);

export const AttachmentMutationResponseDto = createDataResponseDto(
  AttachmentResponseDto,
  "AttachmentMutationResponseDto",
);

@ObjectType()
export class AttachmentsMutationResponseDto extends BaseResponseDto {
  @Field(() => [AttachmentResponseDto])
  data!: AttachmentResponseDto[];
}
