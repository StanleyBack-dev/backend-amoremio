import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

export interface AdjustStockCommand {
  idStore: string;
  idProduct: string;
  type:
    | StockMovementType.AJUSTE_POSITIVO
    | StockMovementType.AJUSTE_NEGATIVO
    | StockMovementType.PERDA;
  quantity: number;
  unitCost?: number;
  note?: string;
}

const ALLOWED_TYPES = new Set<StockMovementType>([
  StockMovementType.AJUSTE_POSITIVO,
  StockMovementType.AJUSTE_NEGATIVO,
  StockMovementType.PERDA,
]);

@Injectable()
export class AdjustStockUseCase {
  constructor(
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async execute(userId: string, command: AdjustStockCommand): Promise<void> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.ADJUST_INVENTORY,
    );

    if (!ALLOWED_TYPES.has(command.type)) {
      throw AppException.from(APP_ERRORS.inventory.invalidMovement, undefined);
    }

    await this.inventoryLedgerService.registerMovement({
      idStore: command.idStore,
      idProduct: command.idProduct,
      type: command.type,
      quantity: command.quantity,
      unitCost: command.unitCost,
      sourceType: "MANUAL_ADJUSTMENT",
      note: command.note ?? null,
      createdByUserId: userId,
    });
  }
}
