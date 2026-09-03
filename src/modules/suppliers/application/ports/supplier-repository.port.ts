export type CreateSupplierPayload = {
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  document: string | null;
  notes: string | null;
  status: boolean;
  createdByUserId: string;
};

export type UpdateSupplierPayload = {
  idSupplier: string;
  idStore: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  instagram?: string | null;
  document?: string | null;
  notes?: string | null;
  status?: boolean;
};

export type SupplierView = {
  idSupplier: string;
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  document: string | null;
  notes: string | null;
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

export type ListSuppliersFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
};

export type SupplierFilterOptions = {
  names: string[];
  creators: UserOption[];
};

export interface SupplierRepositoryPort {
  create(payload: CreateSupplierPayload): Promise<SupplierView>;
  update(payload: UpdateSupplierPayload): Promise<SupplierView>;
  findById(idStore: string, idSupplier: string): Promise<SupplierView | null>;
  findByName(idStore: string, name: string): Promise<SupplierView | null>;
  listByStore(
    idStore: string,
    filters?: ListSuppliersFilters,
  ): Promise<{ records: SupplierView[]; total: number }>;
  listFilterOptions(idStore: string): Promise<SupplierFilterOptions>;
}

export const SUPPLIER_REPOSITORY = Symbol("SUPPLIER_REPOSITORY");
