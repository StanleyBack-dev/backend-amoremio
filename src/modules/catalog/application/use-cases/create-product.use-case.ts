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
import { CreateProductCommand } from "@/modules/catalog/application/dto/product.commands";
import {
  Product,
  buildSkuBase,
} from "@/modules/catalog/domain/entities/product.entity";

// Upper bound for the numeric suffix search when generating a SKU. A single
// mnemonic base is not expected to collide anywhere near this many times.
const MAX_SKU_SUFFIX_ATTEMPTS = 1000;

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreateProductCommand,
  ): Promise<ProductView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_PRODUCTS,
    );

    const sku = await this.generateSku(command.idStore, command.name);

    const product = Product.create({
      idStore: command.idStore,
      name: command.name,
      sku,
      description: command.description,
      brand: command.brand,
      kind: command.kind,
      unit: command.unit,
      packagingUnit: command.packagingUnit,
      packSize: command.packSize,
      salePrice: command.salePrice,
      createdByUserId: userId,
    });
    const primitive = product.toPrimitive();

    // With a brand, only the name/brand pair must be unique; without one, the
    // name alone must be unique within the store.
    const duplicated = await this.productRepository.findByName(
      primitive.idStore,
      primitive.name,
      primitive.brand,
    );
    if (duplicated) {
      throw AppException.from(
        primitive.brand
          ? APP_ERRORS.catalog.duplicatedNameForBrand
          : APP_ERRORS.catalog.duplicatedName,
        undefined,
      );
    }

    return this.productRepository.create({
      idStore: primitive.idStore,
      name: primitive.name,
      sku: primitive.sku ?? sku,
      description: primitive.description,
      brand: primitive.brand,
      kind: primitive.kind,
      unit: primitive.unit,
      packagingUnit: primitive.packagingUnit,
      packSize: primitive.packSize,
      salePrice: primitive.salePrice,
      createdByUserId: primitive.createdByUserId,
    });
  }

  // Derives a store-unique SKU from the product name: a short mnemonic base
  // plus a 3-digit sequential suffix (BOLOCH-001, BOLOCH-002, ...). The
  // existing count for the base is only a starting hint; each candidate is
  // checked against the repository, and the DB unique constraint is the
  // final backstop.
  private async generateSku(idStore: string, name: string): Promise<string> {
    const base = buildSkuBase(name);
    const startFrom = await this.productRepository.countBySkuBase(
      idStore,
      base,
    );

    for (
      let suffix = startFrom + 1;
      suffix <= startFrom + MAX_SKU_SUFFIX_ATTEMPTS;
      suffix += 1
    ) {
      const candidate = `${base}-${String(suffix).padStart(3, "0")}`;
      const taken = await this.productRepository.findBySku(idStore, candidate);
      if (!taken) {
        return candidate;
      }
    }

    throw AppException.from(APP_ERRORS.catalog.skuGenerationFailed, undefined);
  }
}
