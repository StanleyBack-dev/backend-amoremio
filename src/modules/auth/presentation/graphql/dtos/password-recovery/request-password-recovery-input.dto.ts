import { Field, InputType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

@InputType()
export class RequestPasswordRecoveryInputDto {
  @Field()
  @IsEmail()
  email!: string;
}
