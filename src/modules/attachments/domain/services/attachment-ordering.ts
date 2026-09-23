import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

// The first attachment by position is the owner's cover image, so "set as
// cover" is just a reorder that moves one id to the front.

export function assertCompleteOrder(
  currentIds: string[],
  orderedIds: string[],
): void {
  const current = new Set(currentIds);
  const ordered = new Set(orderedIds);
  const sameMembers =
    orderedIds.length === currentIds.length &&
    ordered.size === orderedIds.length &&
    orderedIds.every((id) => current.has(id));
  if (!sameMembers) {
    throw AppException.from(APP_ERRORS.attachments.invalidOrder, undefined);
  }
}

export function moveToFront(currentIds: string[], id: string): string[] {
  if (!currentIds.includes(id)) {
    throw AppException.from(APP_ERRORS.attachments.notFound, undefined);
  }
  return [id, ...currentIds.filter((current) => current !== id)];
}
