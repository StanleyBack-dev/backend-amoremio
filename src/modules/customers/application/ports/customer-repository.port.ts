export type CreateCustomerPayload = {
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: boolean;
  createdByUserId: string;
};

export type UpdateCustomerPayload = {
  idCustomer: string;
  idStore: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: boolean;
};

export type CustomerView = {
  idCustomer: string;
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
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

export type ListCustomersFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
};

export type CustomerFilterOptions = {
  names: string[];
  creators: UserOption[];
};

export interface CustomerRepositoryPort {
  create(payload: CreateCustomerPayload): Promise<CustomerView>;
  update(payload: UpdateCustomerPayload): Promise<CustomerView>;
  findById(idStore: string, idCustomer: string): Promise<CustomerView | null>;
  // Dedupe key: phone is normalized to digits-only before comparing, so
  // "(11) 91234-5678" and "11912345678" resolve to the same customer.
  findByPhone(idStore: string, phone: string): Promise<CustomerView | null>;
  listByStore(
    idStore: string,
    filters?: ListCustomersFilters,
  ): Promise<{ records: CustomerView[]; total: number }>;
  listFilterOptions(idStore: string): Promise<CustomerFilterOptions>;
}

export const CUSTOMER_REPOSITORY = Symbol("CUSTOMER_REPOSITORY");
