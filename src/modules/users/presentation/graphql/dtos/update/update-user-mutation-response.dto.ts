import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { UpdateUserResponseDto } from "./update-user-response.dto";

export const UpdateUserMutationResponseDto = createDataResponseDto(
  UpdateUserResponseDto,
  "UpdateUserMutationResponseDto",
);
