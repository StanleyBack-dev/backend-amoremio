import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationInputDto } from "@/common/responses/dtos/pagination-input.dto";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@InputType()
export class GetUsersInputDto extends PaginationInputDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field(() => UserGroup, { nullable: true })
  @IsOptional()
  @IsEnum(UserGroup)
  group?: UserGroup;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
