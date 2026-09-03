import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { CreateUserResponseDto } from "./create-user-response.dto";

export const CreateUserMutationResponseDto = createDataResponseDto(
  CreateUserResponseDto,
  "CreateUserMutationResponseDto",
);
