import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { UnlockUserCredentialResponseDto } from "./unlock-user-credential-response.dto";

export const UnlockUserCredentialMutationResponseDto = createDataResponseDto(
  UnlockUserCredentialResponseDto,
  "UnlockUserCredentialMutationResponseDto",
);
