import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { UserPagePermissionsResponseDto } from "./user-page-permissions-response.dto";

export const SetUserPagePermissionsMutationResponseDto = createDataResponseDto(
  UserPagePermissionsResponseDto,
  "SetUserPagePermissionsMutationResponseDto",
);
