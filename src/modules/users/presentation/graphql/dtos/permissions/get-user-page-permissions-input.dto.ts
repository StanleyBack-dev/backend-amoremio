import { Field, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

@InputType()
export class GetUserPagePermissionsInputDto {
  @Field()
  @IsUUID()
  idUsers!: string;
}
