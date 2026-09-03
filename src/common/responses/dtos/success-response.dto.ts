import { ObjectType } from "@nestjs/graphql";
import { BaseResponseDto } from "./base-response.dto";

@ObjectType()
export class SuccessResponseDto extends BaseResponseDto {}
