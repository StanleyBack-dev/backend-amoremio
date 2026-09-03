import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseFilterOptions,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { ListPurchasesQuery } from "@/modules/purchasing/application/dto/purchase.commands";

export interface PaginatedPurchases {
  items: PurchaseView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListPurchasesUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: ListPurchasesQuery,
  ): Promise<PaginatedPurchases> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.purchaseRepository.listByStore(
      query.idStore,
      {
        page,
        limit,
        status: query.status,
        supplierName: query.supplierName,
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
  ): Promise<PurchaseFilterOptions> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    return this.purchaseRepository.listFilterOptions(idStore);
  }
}
