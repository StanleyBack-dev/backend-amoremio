import { Field, InputType } from "@nestjs/graphql";
import { IsString, MinLength } from "class-validator";

@InputType()
export class ChangePasswordInputDto {
  @Field()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
