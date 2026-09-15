export class CreateCustomerCommand {
  idStore!: string;
  name!: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: boolean;
}

export class UpdateCustomerCommand {
  idStore!: string;
  idCustomer!: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: boolean;
}

export class ListCustomersQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}
