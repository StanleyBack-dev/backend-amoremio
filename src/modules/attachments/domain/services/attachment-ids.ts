import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Ids reach the database as uuid parameters; a malformed one would surface
// as an opaque driver error instead of a validation error.
export function assertUuids(values: Record<string, string | undefined>): void {
  for (const [field, value] of Object.entries(values)) {
    if (!value || !UUID_PATTERN.test(value)) {
      throw AppException.from(APP_ERRORS.validation.invalidFormat, {
        value: field,
      });
    }
  }
}
