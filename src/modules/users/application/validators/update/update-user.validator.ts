import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { UpdateUserInputDto } from "@/modules/users/presentation/graphql/dtos/update/update-user-input.dto";

export class UpdateUserValidator {
  static ensureValidUpdate(input: UpdateUserInputDto): void {
    if (!input.name && !input.urlAvatar && input.status === undefined) {
      throw AppException.from(APP_ERRORS.users.invalidUpdateInput, undefined);
    }
  }
}
