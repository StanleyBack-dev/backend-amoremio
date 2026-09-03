import { Field, InputType } from "@nestjs/graphql";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

@InputType()
export class AdminUpdateUserAccessInputDto {
  @Field()
  @IsUUID()
  idUsers!: string;

  @Field(() => UserGroup, { nullable: true })
  @IsOptional()
  @IsEnum(UserGroup)
  group?: UserGroup;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => [PageAccessKey], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PageAccessKey, { each: true })
  pagePermissions?: PageAccessKey[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  useGroupDefaults?: boolean;
}
