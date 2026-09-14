import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getDataSourceToken } from "@nestjs/typeorm";
import { In, type DataSource } from "typeorm";
import { AppModule } from "@/app.module";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";
import {
  PRODUCTION_ORDER_REPOSITORY,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";
import {
  InventoryLedgerService,
  type RegisterMovementInput,
} from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import { StockMovementEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-movement.entity";
import { StockItemEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-item.entity";

// One-off admin tool: wipes the stock ledger and rebuilds it from scratch by
// replaying every finalized purchase and completed production order, in
// real chronological order, through the same InventoryLedgerService the app
// already uses in production. Quantities and costs are NOT recalculated —
// they are read straight from the frozen values already stored on each
// purchase item (baseQuantity/effectiveUnitCost) and production order item
// (unitCostAtConsumption/lineCost) and order (outputUnitCost), so the
// rebuilt ledger matches exactly what those already-committed documents say.
//
// Existing sales (SAIDA_VENDA) are intentionally NOT replayed — by design,
// per the decision to have sales re-entered/corrected manually afterwards.
// That means the rebuilt stock will read HIGHER than physical reality until
// sales are re-applied. Existing manual adjustments (AJUSTE_POSITIVO,
// AJUSTE_NEGATIVO, PERDA) are also not replayed and are reported as a
// warning before anything is touched.
//
// Defaults to a dry run that only prints the plan. Pass --apply to actually
// wipe and rewrite the ledger. Pass --store=<idStore> to scope to one store.
//
// Usage (from backend-amoremio):
//   npx ts-node -r tsconfig-paths/register src/scripts/rebuild-inventory-from-history.script.ts
//   npx ts-node -r tsconfig-paths/register src/scripts/rebuild-inventory-from-history.script.ts --apply
//   npx ts-node -r tsconfig-paths/register src/scripts/rebuild-inventory-from-history.script.ts --store=<idStore> --apply

const PURCHASE_SOURCE = "PURCHASE";
const PRODUCTION_SOURCE = "PRODUCTION_ORDER";

const APPLY = process.argv.includes("--apply");
const STORE_FILTER = process.argv
  .find((arg) => arg.startsWith("--store="))
  ?.split("=")[1];

const LIST_ALL_LIMIT = 1_000_000;

type ReplayEvent =
  | { kind: "purchase"; date: Date; tiebreaker: Date; purchase: PurchaseView }
  | {
      kind: "production";
      date: Date;
      tiebreaker: Date;
      order: ProductionOrderView;
    };

function purchaseMovements(purchase: PurchaseView): RegisterMovementInput[] {
  return purchase.items.map((item) => ({
    idStore: purchase.idStore,
    idProduct: item.idProduct,
    type: StockMovementType.ENTRADA_COMPRA,
    quantity: item.baseQuantity,
    unitCost: item.effectiveUnitCost,
    sourceType: PURCHASE_SOURCE,
    sourceId: purchase.idPurchase,
    note: `Compra ${purchase.idPurchase}`,
    createdByUserId: purchase.createdByUserId,
    occurredAt: purchase.purchaseDate,
  }));
}

function productionMovements(
  order: ProductionOrderView,
): RegisterMovementInput[] {
  return [
    ...order.items.map((item) => ({
      idStore: order.idStore,
      idProduct: item.idProduct,
      type: StockMovementType.SAIDA_PRODUCAO,
      quantity: item.quantity,
      sourceType: PRODUCTION_SOURCE,
      sourceId: order.idProductionOrder,
      note: `Produção ${order.idProductionOrder}`,
      createdByUserId: order.createdByUserId,
      occurredAt: order.productionDate,
    })),
    {
      idStore: order.idStore,
      idProduct: order.idOutputProduct,
      type: StockMovementType.ENTRADA_PRODUCAO,
      quantity: order.actualOutputQuantity,
      unitCost: order.outputUnitCost,
      sourceType: PRODUCTION_SOURCE,
      sourceId: order.idProductionOrder,
      note: `Produção ${order.idProductionOrder}`,
      createdByUserId: order.createdByUserId,
      occurredAt: order.productionDate,
    },
  ];
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });

  try {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    const storeRepository = app.get<StoreRepositoryPort>(STORE_REPOSITORY);
    const purchaseRepository =
      app.get<PurchaseRepositoryPort>(PURCHASE_REPOSITORY);
    const productionRepository = app.get<ProductionOrderRepositoryPort>(
      PRODUCTION_ORDER_REPOSITORY,
    );
    const inventoryLedgerService = app.get(InventoryLedgerService);

    const allStores = await storeRepository.listAll();
    const stores = STORE_FILTER
      ? allStores.filter((store) => store.idStore === STORE_FILTER)
      : allStores;

    if (STORE_FILTER && stores.length === 0) {
      console.error(`Loja ${STORE_FILTER} não encontrada.`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `\n${APPLY ? "APLICANDO (o estoque será reescrito)" : "SIMULAÇÃO (dry-run, nada será alterado)"} — ${stores.length} loja(s).\n`,
    );

    let grandTotalMovements = 0;

    for (const store of stores) {
      console.log(`\n=== Loja: ${store.name} (${store.idStore}) ===`);

      const movementRepository = dataSource.getRepository(StockMovementEntity);

      const strayCount = await movementRepository.count({
        where: {
          idStore: store.idStore,
          type: In([
            StockMovementType.AJUSTE_POSITIVO,
            StockMovementType.AJUSTE_NEGATIVO,
            StockMovementType.PERDA,
          ]),
        },
      });
      if (strayCount > 0) {
        console.warn(
          `  ATENÇÃO: ${strayCount} movimentação(ões) manual(is) (ajuste/perda) existentes NÃO entram no replay e serão perdidas.`,
        );
      }

      const saleCount = await movementRepository.count({
        where: { idStore: store.idStore, type: StockMovementType.SAIDA_VENDA },
      });
      if (saleCount > 0) {
        console.warn(
          `  ATENÇÃO: ${saleCount} baixa(s) de venda existentes NÃO entram no replay — o estoque final ficará maior que o real até as vendas serem reapontadas.`,
        );
      }

      const { records: purchases } = await purchaseRepository.listByStore(
        store.idStore,
        { status: PurchaseStatus.FINALIZADA, limit: LIST_ALL_LIMIT },
      );
      const { records: productions } =
        await productionRepository.listOrdersByStore(store.idStore, {
          status: ProductionOrderStatus.CONCLUIDA,
          limit: LIST_ALL_LIMIT,
        });

      const events: ReplayEvent[] = [
        ...purchases.map(
          (purchase): ReplayEvent => ({
            kind: "purchase",
            date: purchase.purchaseDate,
            tiebreaker: purchase.finalizedAt ?? purchase.createdAt,
            purchase,
          }),
        ),
        ...productions.map(
          (order): ReplayEvent => ({
            kind: "production",
            date: order.productionDate,
            tiebreaker: order.concludedAt ?? order.createdAt,
            order,
          }),
        ),
      ].sort((a, b) => {
        const byDate = a.date.getTime() - b.date.getTime();
        if (byDate !== 0) return byDate;
        return a.tiebreaker.getTime() - b.tiebreaker.getTime();
      });

      console.log(
        `  ${purchases.length} compra(s) finalizada(s) + ${productions.length} produção(ões) concluída(s) = ${events.length} evento(s) no replay.`,
      );

      if (events.length === 0) {
        continue;
      }

      if (APPLY) {
        await dataSource.transaction(async (manager) => {
          await manager.delete(StockMovementEntity, { idStore: store.idStore });
          await manager.delete(StockItemEntity, { idStore: store.idStore });
        });
      }

      for (const event of events) {
        const movements =
          event.kind === "purchase"
            ? purchaseMovements(event.purchase)
            : productionMovements(event.order);

        if (APPLY) {
          await inventoryLedgerService.registerMovements(movements);
        }
        grandTotalMovements += movements.length;
      }

      if (APPLY) {
        const finalStock = await dataSource
          .getRepository(StockItemEntity)
          .find({ where: { idStore: store.idStore } });
        console.log(
          `  Estoque reconstruído: ${finalStock.length} produto(s) com saldo.`,
        );
      }
    }

    console.log(
      `\nTotal de movimentações ${APPLY ? "aplicadas" : "planejadas"}: ${grandTotalMovements}`,
    );
    if (!APPLY) {
      console.log(
        "\nNenhuma alteração foi feita no banco. Rode de novo com --apply para executar de verdade.\n",
      );
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
