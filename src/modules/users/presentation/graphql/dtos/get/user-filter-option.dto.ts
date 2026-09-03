import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserFilterOptionDto {
  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  username?: string;
}
