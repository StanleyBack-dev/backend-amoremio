import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type ListStoreStockFilters,
  type StockItemView,
} from "@/modules/inventory/application/ports/inventory-repository.port";

export interface PaginatedStock {
  items: StockItemView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  stockValueTotal: number;
}

@Injectable()
export class ListStoreStockUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    filters?: ListStoreStockFilters,
  ): Promise<PaginatedStock> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_INVENTORY,
    );

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;

    const { records, total, valueTotal } =
      await this.inventoryRepository.listStoreStock(idStore, {
        ...filters,
        page,
        limit,
      });

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      stockValueTotal: valueTotal,
    };
  }
}
