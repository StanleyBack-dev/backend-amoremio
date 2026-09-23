import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { AttachmentOwnerPolicy } from "@/modules/attachments/application/ports/attachment-owner-policy.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

export const MAX_PRODUCT_IMAGES = 4;

// Product photos: same permissions as the product itself (manage to change,
// view-store to read) and the product must belong to the store.
@Injectable()
export class ProductAttachmentOwnerPolicy
  implements AttachmentOwnerPolicy, OnModuleInit
{
  readonly ownerType = AttachmentOwnerType.PRODUCT;
  readonly maxAttachments = MAX_PRODUCT_IMAGES;

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly registry: AttachmentOwnerPolicyRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async assertCanManage(
    userId: string,
    idStore: string,
    ownerId: string,
  ): Promise<void> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.MANAGE_PRODUCTS,
    );
    await this.assertProductExists(idStore, ownerId);
  }

  async assertCanView(
    userId: string,
    idStore: string,
    ownerId: string,
  ): Promise<void> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );
    await this.assertProductExists(idStore, ownerId);
  }

  private async assertProductExists(
    idStore: string,
    idProduct: string,
  ): Promise<void> {
    const [product] = await this.productRepository.findManyByIds(idStore, [
      idProduct,
    ]);
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }
  }
}
