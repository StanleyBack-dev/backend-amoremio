import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PRODUCT_REPOSITORY,
  type ProductFilterOptions,
  type ProductRepositoryPort,
  type ProductView,
} from "@/modules/catalog/application/ports/product-repository.port";
import { ListProductsQuery } from "@/modules/catalog/application/dto/product.commands";

export interface PaginatedProducts {
  items: ProductView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: ListProductsQuery,
  ): Promise<PaginatedProducts> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.VIEW_STORE,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.productRepository.listByStore(
      query.idStore,
      {
        page,
        limit,
        search: query.search,
        status: query.status,
        kinds: query.kinds,
        name: query.name,
        brand: query.brand,
        withoutBrand: query.withoutBrand,
        unit: query.unit,
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
  ): Promise<ProductFilterOptions> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.productRepository.listFilterOptions(idStore);
  }
}
