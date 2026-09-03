import { Field, ObjectType } from "@nestjs/graphql";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@ObjectType()
export class CreateUserResponseDto {
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
  mustChangePassword!: boolean;

  @Field({ nullable: true })
  urlAvatar?: string;

  @Field()
  status!: boolean;

  @Field()
  createdAt!: Date;
}
