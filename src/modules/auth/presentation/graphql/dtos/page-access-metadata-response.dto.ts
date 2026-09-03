import { Field, ObjectType } from "@nestjs/graphql";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@ObjectType()
export class GroupDefaultDto {
  @Field(() => UserGroup)
  group!: UserGroup;

  @Field(() => [PageAccessKey])
  defaultPermissions!: PageAccessKey[];
}

@ObjectType()
export class PageAccessMetadataResponseDto {
  @Field(() => [PageAccessKey])
  allKeys!: PageAccessKey[];

  @Field(() => [GroupDefaultDto])
  groupDefaults!: GroupDefaultDto[];
}
