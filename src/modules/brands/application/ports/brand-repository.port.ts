export type CreateBrandPayload = {
  idStore: string;
  name: string;
  status: boolean;
  createdByUserId: string;
};

export type UpdateBrandPayload = {
  idBrand: string;
  idStore: string;
  name?: string;
  status?: boolean;
};

export type BrandView = {
  idBrand: string;
  idStore: string;
  name: string;
  status: boolean;
  createdByUserId: string;
  createdByUserName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserOption = {
  id: string;
  name: string;
};

export type ListBrandsFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
};

export type BrandFilterOptions = {
  names: string[];
  creators: UserOption[];
};

export interface BrandRepositoryPort {
  create(payload: CreateBrandPayload): Promise<BrandView>;
  update(payload: UpdateBrandPayload): Promise<BrandView>;
  findById(idStore: string, idBrand: string): Promise<BrandView | null>;
  findByName(idStore: string, name: string): Promise<BrandView | null>;
  listByStore(
    idStore: string,
    filters?: ListBrandsFilters,
  ): Promise<{ records: BrandView[]; total: number }>;
  listFilterOptions(idStore: string): Promise<BrandFilterOptions>;
}

export const BRAND_REPOSITORY = Symbol("BRAND_REPOSITORY");
