import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class VerifyPasswordRecoveryCodeResponseDto {
  @Field()
  recoveryToken!: string;

  @Field(() => Date)
  expiresAt!: Date;
}
