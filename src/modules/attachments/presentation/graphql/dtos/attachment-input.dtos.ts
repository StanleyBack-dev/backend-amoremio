import { Field, InputType, Int } from "@nestjs/graphql";
import {
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

// Every rule here is enforced again by the domain (image-upload.policy):
// these decorators document the contract, they are not the safety net.

@InputType()
export class AttachmentOwnerInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => AttachmentOwnerType)
  @IsEnum(AttachmentOwnerType)
  ownerType!: AttachmentOwnerType;

  @Field()
  @IsUUID()
  ownerId!: string;
}

@InputType()
export class RequestAttachmentUploadInputDto extends AttachmentOwnerInputDto {
  @Field()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @Field()
  @IsString()
  @MaxLength(64)
  mimeType!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

@InputType()
export class AttachmentRefInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idAttachment!: string;
}

@InputType()
export class ReorderAttachmentsInputDto extends AttachmentOwnerInputDto {
  @Field(() => [String])
  @ArrayMaxSize(50)
  @IsUUID("all", { each: true })
  orderedIds!: string[];
}
