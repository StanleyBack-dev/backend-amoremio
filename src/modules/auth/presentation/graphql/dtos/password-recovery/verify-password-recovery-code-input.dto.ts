import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class VerifyPasswordRecoveryCodeInputDto {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(5)
  @MaxLength(5)
  @Matches(/^\d{5}$/)
  code!: string;
}
