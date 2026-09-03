import { Field, InputType } from "@nestjs/graphql";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

@InputType()
export class SetUserPagePermissionsInputDto {
  @Field()
  @IsUUID()
  idUsers!: string;

  @Field(() => Boolean)
  @IsBoolean()
  useGroupDefaults!: boolean;

  @Field(() => [PageAccessKey], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PageAccessKey, { each: true })
  pagePermissions?: PageAccessKey[];
}
