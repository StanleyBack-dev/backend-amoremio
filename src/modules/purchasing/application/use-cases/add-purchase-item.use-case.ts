import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import { PURCHASABLE_KINDS } from "@/modules/catalog/domain/enums/product-kind.enum";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { AddPurchaseItemCommand } from "@/modules/purchasing/application/dto/purchase.commands";
import { PurchaseCalculatorService } from "@/modules/purchasing/domain/services/purchase-calculator.service";
import {
  assertDraft,
  loadPurchaseOrFail,
} from "@/modules/purchasing/application/use-cases/purchase-access.helper";

@Injectable()
export class AddPurchaseItemUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: AddPurchaseItemCommand,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const purchase = await loadPurchaseOrFail(
      this.purchaseRepository,
      command.idStore,
      command.idPurchase,
    );
    assertDraft(purchase);

    const product = await this.productRepository.findById(
      command.idStore,
      command.idProduct,
    );
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    if (!PURCHASABLE_KINDS.includes(product.kind)) {
      throw AppException.from(
        APP_ERRORS.purchasing.productNotPurchasable,
        undefined,
      );
    }

    // The same product can only have one line — the quantity is edited on the
    // existing line instead of adding a second one.
    if (purchase.items.some((item) => item.idProduct === product.idProduct)) {
      throw AppException.from(APP_ERRORS.purchasing.duplicatedItem, {
        product: product.name,
      });
    }

    // Single-item run just to validate and get the line total consistently.
    const calc = PurchaseCalculatorService.calculate({
      items: [
        {
          ref: "new",
          purchasedQuantity: command.purchasedQuantity,
          conversionFactor: command.conversionFactor,
          unitPrice: command.unitPrice,
        },
      ],
      freightAmount: 0,
      discountAmount: 0,
    });

    return this.purchaseRepository.addItem({
      idPurchase: command.idPurchase,
      idProduct: product.idProduct,
      productName: product.name,
      purchasedQuantity: command.purchasedQuantity,
      purchasedUnit: (command.purchasedUnit || product.unit).trim(),
      conversionFactor: command.conversionFactor,
      unitPrice: command.unitPrice,
      lineTotal: calc.items[0].lineTotal,
    });
  }
}
