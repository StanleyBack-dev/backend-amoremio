import { InputType, Field } from "@nestjs/graphql";
import {
  IsUUID,
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
} from "class-validator";

@InputType()
export class UpdateUserInputDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  idUsers?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: "A URL do avatar deve ser válida." })
  urlAvatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
