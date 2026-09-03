import { ObjectType } from "@nestjs/graphql";
import { BaseResponseDto } from "@/common/responses/dtos/base-response.dto";

@ObjectType()
export class LogoutResponseDto extends BaseResponseDto {}
