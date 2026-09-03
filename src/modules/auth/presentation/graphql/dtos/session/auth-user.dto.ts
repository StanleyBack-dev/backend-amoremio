import { Field, ObjectType } from "@nestjs/graphql";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@ObjectType()
export class AuthUserDto {
  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field(() => UserGroup)
  group!: UserGroup;

  @Field()
  status!: boolean;

  @Field({ nullable: true })
  urlAvatar?: string;
}
