export interface BaseResponse {
  success: boolean;
  message?: string;
  code?: string;
}

export interface ResponseMessageDefinition {
  code: string;
  message: string;
}

export interface DataResponse<TData> extends BaseResponse {
  data: TData;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ListResponse<TItem>
  extends BaseResponse, PaginatedResult<TItem> {}

export interface SuccessResponse extends BaseResponse {
  success: true;
}
