import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class UpdateUserResponseDto {
  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  urlAvatar?: string;

  @Field()
  status!: boolean;

  @Field()
  updatedAt!: Date;
}
