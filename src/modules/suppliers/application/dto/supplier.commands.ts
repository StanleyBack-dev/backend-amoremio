export class CreateSupplierCommand {
  idStore!: string;
  name!: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  instagram?: string | null;
  document?: string | null;
  notes?: string | null;
  status?: boolean;
}

export class UpdateSupplierCommand {
  idStore!: string;
  idSupplier!: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  instagram?: string | null;
  document?: string | null;
  notes?: string | null;
  status?: boolean;
}

export class ListSuppliersQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}
