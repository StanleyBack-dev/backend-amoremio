import type {
  DataResponse,
  ListResponse,
  PaginatedResult,
  ResponseMessageDefinition,
  SuccessResponse,
} from "../interfaces/response.interface";

export function buildDataResponse<TData>(
  data: TData,
  definition: ResponseMessageDefinition,
): DataResponse<TData> {
  return {
    success: true,
    message: definition.message,
    code: definition.code,
    data,
  };
}

export function buildPaginatedListResponse<TItem>(
  result: PaginatedResult<TItem>,
  definition: ResponseMessageDefinition,
): ListResponse<TItem> {
  return {
    success: true,
    message: definition.message,
    code: definition.code,
    items: result.items,
    total: result.total,
    currentPage: result.currentPage,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
  };
}

export function buildSuccessResponse(
  definition: ResponseMessageDefinition,
): SuccessResponse {
  return {
    success: true,
    message: definition.message,
    code: definition.code,
  };
}
