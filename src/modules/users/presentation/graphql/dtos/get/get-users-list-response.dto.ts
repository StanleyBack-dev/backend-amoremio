import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { GetUserResponseDto } from "./get-user-response.dto";

export const GetUsersListResponseDto = createListResponseDto(
  GetUserResponseDto,
  "GetUsersListResponseDto",
);
