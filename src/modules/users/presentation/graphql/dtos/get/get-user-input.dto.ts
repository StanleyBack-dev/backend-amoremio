import { InputType, Field } from "@nestjs/graphql";
import { IsOptional, IsUUID, IsEmail } from "class-validator";

@InputType()
export class GetUserInputDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  idUsers?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
