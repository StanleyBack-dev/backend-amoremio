import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SUPPLIER_REPOSITORY,
  type SupplierFilterOptions,
  type SupplierRepositoryPort,
  type SupplierView,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { ListSuppliersQuery } from "@/modules/suppliers/application/dto/supplier.commands";

export interface PaginatedSuppliers {
  items: SupplierView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListSuppliersUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: ListSuppliersQuery,
  ): Promise<PaginatedSuppliers> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.VIEW_STORE,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.supplierRepository.listByStore(
      query.idStore,
      {
        page,
        limit,
        search: query.search,
        status: query.status,
        name: query.name,
        createdByUserId: query.createdByUserId,
      },
    );

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async filterOptions(
    userId: string,
    idStore: string,
  ): Promise<SupplierFilterOptions> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.supplierRepository.listFilterOptions(idStore);
  }
}
