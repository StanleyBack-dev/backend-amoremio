import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { AdminUpdateUserAccessResponseDto } from "./admin-update-user-access-response.dto";

export const AdminUpdateUserAccessMutationResponseDto = createDataResponseDto(
  AdminUpdateUserAccessResponseDto,
  "AdminUpdateUserAccessMutationResponseDto",
);
