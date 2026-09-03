import { Field, InputType } from "@nestjs/graphql";
import { IsString, MinLength } from "class-validator";

@InputType()
export class ResetPasswordWithRecoveryInputDto {
  @Field()
  @IsString()
  recoveryToken!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
