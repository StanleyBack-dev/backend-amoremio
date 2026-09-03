import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseCalculatorService } from "@/modules/purchasing/domain/services/purchase-calculator.service";
import {
  assertDraft,
  loadPurchaseOrFail,
} from "@/modules/purchasing/application/use-cases/purchase-access.helper";

const PURCHASE_SOURCE = "PURCHASE";

@Injectable()
export class FinalizePurchaseUseCase {
  private readonly logger = new Logger(FinalizePurchaseUseCase.name);

  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idPurchase: string,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.FINALIZE_PURCHASE,
    );

    const purchase = await loadPurchaseOrFail(
      this.purchaseRepository,
      idStore,
      idPurchase,
    );
    assertDraft(purchase);

    if (purchase.items.length === 0) {
      throw AppException.from(APP_ERRORS.purchasing.emptyPurchase, undefined);
    }

    const calc = PurchaseCalculatorService.calculate({
      items: purchase.items.map((item) => ({
        ref: item.idPurchaseItem,
        purchasedQuantity: item.purchasedQuantity,
        conversionFactor: item.conversionFactor,
        unitPrice: item.unitPrice,
      })),
      freightAmount: purchase.freightAmount,
      discountAmount: purchase.discountAmount,
    });

    const resultByRef = new Map(calc.items.map((item) => [item.ref, item]));

    // Freeze totals and the per-item base quantity / effective unit cost.
    // Done before the stock movements so the purchase can never be
    // finalized twice (assertDraft would fail on a retry), which keeps the
    // additive stock entries from ever being applied more than once.
    const finalized = await this.purchaseRepository.finalize({
      idPurchase,
      itemsSubtotal: calc.itemsSubtotal,
      total: calc.total,
      freightAmount: calc.freightAmount,
      discountAmount: calc.discountAmount,
      finalizedAt: new Date(),
      items: purchase.items.map((item) => {
        const line = resultByRef.get(item.idPurchaseItem)!;
        return {
          idPurchaseItem: item.idPurchaseItem,
          baseQuantity: line.baseQuantity,
          effectiveUnitCost: line.effectiveUnitCost,
        };
      }),
    });

    // Credit every line into stock in one batched transaction — dozens of
    // sequential round-trips collapse to a handful, keeping this call well
    // under the request timeout against a cloud database.
    try {
      await this.inventoryLedgerService.registerMovements(
        purchase.items.map((item) => {
          const line = resultByRef.get(item.idPurchaseItem)!;
          return {
            idStore,
            idProduct: item.idProduct,
            type: StockMovementType.ENTRADA_COMPRA,
            quantity: line.baseQuantity,
            unitCost: line.effectiveUnitCost,
            sourceType: PURCHASE_SOURCE,
            sourceId: idPurchase,
            note: `Compra ${idPurchase}`,
            createdByUserId: userId,
            occurredAt: purchase.purchaseDate,
          };
        }),
      );
    } catch (error) {
      // Stock could not be credited — the purchase stays finalized (the
      // batch is atomic, so nothing was partially applied). Surfaced for a
      // manual stock adjustment. (Hardening: transactional unit of work.)
      this.logger.error(
        `Falha ao creditar estoque da compra ${idPurchase}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }

    return finalized;
  }
}
