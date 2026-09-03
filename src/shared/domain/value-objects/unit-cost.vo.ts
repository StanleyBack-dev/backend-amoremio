import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

// Cost per base unit (per gram, per ml, per unit). Unlike Money — which is
// reais/centavos — a unit cost can be a small fraction of a cent: 1 kg of
// sugar at R$ 4,35 is R$ 0,00435 per gram. Kept at 6 decimals (millionths of
// a real) so the weighted average survives arithmetic without collapsing to
// R$ 0,00.
const SCALE = 1_000_000;

export class UnitCost {
  private constructor(private readonly micro: number) {}

  static fromNumber(value: number): UnitCost {
    if (!Number.isFinite(value) || value < 0) {
      throw AppException.from(APP_ERRORS.shared.invalidMoney, undefined);
    }
    return new UnitCost(Math.round(value * SCALE));
  }

  static zero(): UnitCost {
    return new UnitCost(0);
  }

  toNumber(): number {
    return this.micro / SCALE;
  }

  isZero(): boolean {
    return this.micro === 0;
  }
}
