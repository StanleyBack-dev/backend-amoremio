import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UnitCost } from "@/shared/domain/value-objects/unit-cost.vo";
import type { Quantity } from "@/shared/domain/value-objects/quantity.vo";
import {
  STOCK_INBOUND_TYPES,
  type StockMovementType,
} from "@/modules/inventory/domain/enums/stock-movement-type.enum";

export interface StockState {
  quantity: Quantity;
  averageCost: UnitCost;
}

export interface StockMovementInput {
  type: StockMovementType;
  quantity: Quantity;
  // Unit cost for inbound movements. Ignored for outbound movements (they
  // leave the average cost untouched). For a positive adjustment without a
  // known cost, pass the current average cost.
  unitCost: UnitCost;
}

export interface StockLedgerResult {
  quantity: Quantity;
  averageCost: UnitCost;
}

// Pure domain calculation: given the current stock state and a movement,
// returns the resulting state. Inbound movements recompute the weighted
// average cost; outbound movements only reduce quantity and never change
// the average. Outbound movements that would drop the quantity below zero
// are rejected — the caller must handle "not enough stock".
export class StockLedgerService {
  static apply(
    state: StockState,
    movement: StockMovementInput,
  ): StockLedgerResult {
    if (movement.quantity.isZero()) {
      throw AppException.from(APP_ERRORS.inventory.invalidMovement, undefined);
    }

    const isInbound = STOCK_INBOUND_TYPES.includes(movement.type);

    if (isInbound) {
      const currentValue =
        state.quantity.toNumber() * state.averageCost.toNumber();
      const incomingValue =
        movement.quantity.toNumber() * movement.unitCost.toNumber();
      const newQuantity = state.quantity.add(movement.quantity);
      const newAverage =
        newQuantity.toNumber() > 0
          ? UnitCost.fromNumber(
              (currentValue + incomingValue) / newQuantity.toNumber(),
            )
          : UnitCost.zero();

      return { quantity: newQuantity, averageCost: newAverage };
    }

    if (state.quantity.isLessThan(movement.quantity)) {
      throw AppException.from(
        APP_ERRORS.inventory.insufficientStock,
        undefined,
      );
    }

    return {
      quantity: state.quantity.subtract(movement.quantity),
      averageCost: state.averageCost,
    };
  }
}
