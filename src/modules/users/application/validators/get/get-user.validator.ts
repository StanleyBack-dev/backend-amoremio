import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { GetUserInputDto } from "@/modules/users/presentation/graphql/dtos/get/get-user-input.dto";

export class GetUserValidator {
  static ensureValidInput(input: GetUserInputDto): void {
    if (!input.idUsers && !input.email) {
      throw AppException.from(APP_ERRORS.users.invalidLookupInput, undefined);
    }
  }
}
