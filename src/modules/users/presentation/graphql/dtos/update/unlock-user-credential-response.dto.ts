import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UnlockUserCredentialResponseDto {
  @Field()
  idUsers!: string;

  @Field()
  updatedAt!: Date;
}
