export class CreateBrandCommand {
  idStore!: string;
  name!: string;
  status?: boolean;
}

export class UpdateBrandCommand {
  idStore!: string;
  idBrand!: string;
  name?: string;
  status?: boolean;
}

export class ListBrandsQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}
