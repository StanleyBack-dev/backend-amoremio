import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  BRAND_REPOSITORY,
  type BrandRepositoryPort,
  type BrandView,
} from "@/modules/brands/application/ports/brand-repository.port";

@Injectable()
export class GetBrandByIdUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: BrandRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idBrand: string,
  ): Promise<BrandView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    const brand = await this.brandRepository.findById(idStore, idBrand);
    if (!brand) {
      throw AppException.from(APP_ERRORS.brands.notFound, undefined);
    }

    return brand;
  }
}
