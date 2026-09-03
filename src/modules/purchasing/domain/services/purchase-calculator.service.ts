import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export interface PurchaseCalcItemInput {
  // Stable key so the caller can match results back to its items.
  ref: string;
  // Amount bought, in the purchase unit (e.g. 3 "fardos").
  purchasedQuantity: number;
  // How many base (stock) units one purchased unit yields (e.g. 1 fardo = 12).
  conversionFactor: number;
  // Price paid per purchased unit.
  unitPrice: number;
}

export interface PurchaseCalcInput {
  items: PurchaseCalcItemInput[];
  freightAmount: number;
  discountAmount: number;
}

export interface PurchaseCalcItemResult {
  ref: string;
  lineTotal: number;
  // Quantity that will be credited to stock, in base units.
  baseQuantity: number;
  // Share of freight minus discount apportioned to this line, by weight.
  apportionedAdjustment: number;
  effectiveLineCost: number;
  // Cost per base unit that stock entry uses.
  effectiveUnitCost: number;
}

export interface PurchaseCalcResult {
  itemsSubtotal: number;
  freightAmount: number;
  discountAmount: number;
  total: number;
  items: PurchaseCalcItemResult[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// Per-base-unit cost: a kg of sugar at R$ 4,35 is R$ 0,00435 per gram, so
// this needs more than cents of resolution.
function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

// Pure calculation shared by the "live" totals the client shows and the
// authoritative recompute done when a purchase is finalized. Freight and
// discount are apportioned across the lines proportionally to each line's
// total, with the last line absorbing the rounding remainder so the parts
// always sum back to the whole.
export class PurchaseCalculatorService {
  static calculate(input: PurchaseCalcInput): PurchaseCalcResult {
    const freightAmount = round2(Math.max(input.freightAmount || 0, 0));
    const discountAmount = round2(Math.max(input.discountAmount || 0, 0));

    const lineTotals = input.items.map((item) => {
      if (item.purchasedQuantity <= 0) {
        throw AppException.from(
          APP_ERRORS.purchasing.invalidItemQuantity,
          undefined,
        );
      }
      if (item.conversionFactor <= 0) {
        throw AppException.from(
          APP_ERRORS.purchasing.invalidConversionFactor,
          undefined,
        );
      }
      if (item.unitPrice < 0) {
        throw AppException.from(
          APP_ERRORS.purchasing.invalidItemPrice,
          undefined,
        );
      }
      return round2(item.purchasedQuantity * item.unitPrice);
    });

    const itemsSubtotal = round2(
      lineTotals.reduce((sum, value) => sum + value, 0),
    );

    if (discountAmount > itemsSubtotal + freightAmount) {
      throw AppException.from(
        APP_ERRORS.purchasing.discountTooLarge,
        undefined,
      );
    }

    const netAdjustment = round2(freightAmount - discountAmount);
    const total = round2(itemsSubtotal + netAdjustment);

    let apportionedSoFar = 0;
    const items: PurchaseCalcItemResult[] = input.items.map((item, index) => {
      const lineTotal = lineTotals[index];
      const isLast = index === input.items.length - 1;

      const apportionedAdjustment = isLast
        ? round2(netAdjustment - apportionedSoFar)
        : round2(
            itemsSubtotal > 0
              ? netAdjustment * (lineTotal / itemsSubtotal)
              : netAdjustment / input.items.length,
          );
      apportionedSoFar = round2(apportionedSoFar + apportionedAdjustment);

      const effectiveLineCost = round2(lineTotal + apportionedAdjustment);
      const baseQuantity = round4(
        item.purchasedQuantity * item.conversionFactor,
      );
      const effectiveUnitCost =
        baseQuantity > 0 ? round6(effectiveLineCost / baseQuantity) : 0;

      return {
        ref: item.ref,
        lineTotal,
        baseQuantity,
        apportionedAdjustment,
        effectiveLineCost,
        effectiveUnitCost,
      };
    });

    return {
      itemsSubtotal,
      freightAmount,
      discountAmount,
      total,
      items,
    };
  }
}
