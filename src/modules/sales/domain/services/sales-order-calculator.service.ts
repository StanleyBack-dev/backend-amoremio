import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export interface SalesCalcItemInput {
  ref: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesCalcResult {
  itemsSubtotal: number;
  discountAmount: number;
  total: number;
  // Platform commission (marketplace fee) taken off the order total.
  commissionPercent: number;
  commissionAmount: number;
  // What the store actually keeps: total minus commission.
  netTotal: number;
  lines: { ref: string; lineTotal: number }[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Straightforward for now: line total is quantity * price, and the order
// total is the subtotal minus a flat order-level discount. Unit conversion
// does not apply on the way out — a sale is always in the product's base
// unit.
export class SalesOrderCalculatorService {
  static calculate(
    items: SalesCalcItemInput[],
    discountAmount: number,
    commissionPercent = 0,
  ): SalesCalcResult {
    const lines = items.map((item) => {
      if (item.quantity <= 0) {
        throw AppException.from(
          APP_ERRORS.sales.invalidItemQuantity,
          undefined,
        );
      }
      if (item.unitPrice < 0) {
        throw AppException.from(APP_ERRORS.sales.invalidItemPrice, undefined);
      }
      return {
        ref: item.ref,
        lineTotal: round2(item.quantity * item.unitPrice),
      };
    });

    const itemsSubtotal = round2(
      lines.reduce((sum, line) => sum + line.lineTotal, 0),
    );
    const discount = round2(Math.max(discountAmount || 0, 0));

    if (discount > itemsSubtotal) {
      throw AppException.from(APP_ERRORS.sales.discountTooLarge, undefined);
    }

    const total = round2(itemsSubtotal - discount);
    const pct = Math.min(Math.max(commissionPercent || 0, 0), 100);
    const commissionAmount = round2((total * pct) / 100);

    return {
      itemsSubtotal,
      discountAmount: discount,
      total,
      commissionPercent: pct,
      commissionAmount,
      netTotal: round2(total - commissionAmount),
      lines,
    };
  }
}
