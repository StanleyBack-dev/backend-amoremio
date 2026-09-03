import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type ListStockMovementsFilters,
  type StockMovementView,
} from "@/modules/inventory/application/ports/inventory-repository.port";

export interface PaginatedMovements {
  items: StockMovementView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListStockMovementsUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    filters?: ListStockMovementsFilters,
  ): Promise<PaginatedMovements> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_INVENTORY,
    );

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;

    const { records, total } = await this.inventoryRepository.listMovements(
      idStore,
      { idProduct: filters?.idProduct, type: filters?.type, page, limit },
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
}
