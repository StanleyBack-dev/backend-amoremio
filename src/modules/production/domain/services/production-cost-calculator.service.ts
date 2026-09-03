import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export interface ProductionCostItemInput {
  // Stable key so the caller can match results back to its items.
  ref: string;
  // Amount of the input consumed, in the product's base (stock) unit.
  quantity: number;
  // The input's average cost per base unit at the moment it is consumed.
  unitCost: number;
}

export interface ProductionCostInput {
  items: ProductionCostItemInput[];
  // Extra costs folded into the finished good, per the whole order.
  laborCost: number;
  overheadCost: number;
  // How much of the finished good actually came out of this run.
  outputQuantity: number;
}

export interface ProductionCostItemResult {
  ref: string;
  lineCost: number;
}

export interface ProductionCostResult {
  inputsCost: number;
  totalCost: number;
  // Cost per unit that the finished-good stock entry uses.
  outputUnitCost: number;
  items: ProductionCostItemResult[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// Pure calculation shared by the "live" preview the client shows and the
// authoritative recompute done when a production order is completed. The
// ingredient cost plus labour and overhead is spread over the quantity that
// actually came out — a lower-than-planned yield simply raises the unit cost.
export class ProductionCostCalculatorService {
  static calculate(input: ProductionCostInput): ProductionCostResult {
    if (input.outputQuantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }

    const laborCost = round2(Math.max(input.laborCost || 0, 0));
    const overheadCost = round2(Math.max(input.overheadCost || 0, 0));

    const items: ProductionCostItemResult[] = input.items.map((item) => {
      if (item.quantity <= 0) {
        throw AppException.from(
          APP_ERRORS.production.invalidQuantity,
          undefined,
        );
      }
      return {
        ref: item.ref,
        lineCost: round4(item.quantity * Math.max(item.unitCost, 0)),
      };
    });

    const inputsCost = round4(
      items.reduce((sum, item) => sum + item.lineCost, 0),
    );
    const totalCost = round4(inputsCost + laborCost + overheadCost);
    const outputUnitCost = round4(totalCost / input.outputQuantity);

    return { inputsCost, totalCost, outputUnitCost, items };
  }
}
