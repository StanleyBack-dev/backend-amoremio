import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { UpdatePurchaseItemCommand } from "@/modules/purchasing/application/dto/purchase.commands";
import { PurchaseCalculatorService } from "@/modules/purchasing/domain/services/purchase-calculator.service";
import {
  assertDraft,
  loadPurchaseOrFail,
} from "@/modules/purchasing/application/use-cases/purchase-access.helper";

@Injectable()
export class UpdatePurchaseItemUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdatePurchaseItemCommand,
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

    const current = purchase.items.find(
      (item) => item.idPurchaseItem === command.idPurchaseItem,
    );
    if (!current) {
      throw AppException.from(APP_ERRORS.purchasing.itemNotFound, undefined);
    }

    const purchasedQuantity =
      command.purchasedQuantity ?? current.purchasedQuantity;
    const conversionFactor =
      command.conversionFactor ?? current.conversionFactor;
    const unitPrice = command.unitPrice ?? current.unitPrice;

    const calc = PurchaseCalculatorService.calculate({
      items: [{ ref: "x", purchasedQuantity, conversionFactor, unitPrice }],
      freightAmount: 0,
      discountAmount: 0,
    });

    return this.purchaseRepository.updateItem({
      idPurchase: command.idPurchase,
      idPurchaseItem: command.idPurchaseItem,
      purchasedQuantity: command.purchasedQuantity,
      purchasedUnit: command.purchasedUnit?.trim(),
      conversionFactor: command.conversionFactor,
      unitPrice: command.unitPrice,
      lineTotal: calc.items[0].lineTotal,
    });
  }
}
