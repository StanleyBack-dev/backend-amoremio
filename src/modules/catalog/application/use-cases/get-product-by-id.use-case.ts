import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
  type ProductView,
} from "@/modules/catalog/application/ports/product-repository.port";

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idProduct: string,
  ): Promise<ProductView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    const product = await this.productRepository.findById(idStore, idProduct);
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    return product;
  }
}
