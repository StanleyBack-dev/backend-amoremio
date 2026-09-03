import { Field, InputType } from "@nestjs/graphql";
import { IsString, MinLength } from "class-validator";

@InputType()
export class LoginInputDto {
  @Field()
  @IsString()
  @MinLength(3)
  username!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;
}
