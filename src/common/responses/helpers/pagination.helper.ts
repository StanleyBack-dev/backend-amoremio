export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export function resolvePagination(page?: number, limit?: number) {
  const safePage = page && page > 0 ? page : DEFAULT_PAGE;
  const safeLimit = limit && limit > 0 ? limit : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function calculateHasNextPage(
  page: number,
  limit: number,
  total: number,
): boolean {
  return page * limit < total;
}

export function calculateTotalPages(limit: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.ceil(total / limit);
}
