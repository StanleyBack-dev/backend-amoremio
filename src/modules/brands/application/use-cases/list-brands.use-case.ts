import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  BRAND_REPOSITORY,
  type BrandFilterOptions,
  type BrandRepositoryPort,
  type BrandView,
} from "@/modules/brands/application/ports/brand-repository.port";
import { ListBrandsQuery } from "@/modules/brands/application/dto/brand.commands";

export interface PaginatedBrands {
  items: BrandView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: BrandRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: ListBrandsQuery,
  ): Promise<PaginatedBrands> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.VIEW_STORE,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.brandRepository.listByStore(
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
  ): Promise<BrandFilterOptions> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.brandRepository.listFilterOptions(idStore);
  }
}
