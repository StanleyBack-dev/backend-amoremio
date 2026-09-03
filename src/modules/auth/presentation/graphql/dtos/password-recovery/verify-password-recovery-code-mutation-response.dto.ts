import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { VerifyPasswordRecoveryCodeResponseDto } from "./verify-password-recovery-code-response.dto";

export const VerifyPasswordRecoveryCodeMutationResponseDto =
  createDataResponseDto(
    VerifyPasswordRecoveryCodeResponseDto,
    "VerifyPasswordRecoveryCodeMutationResponseDto",
  );
