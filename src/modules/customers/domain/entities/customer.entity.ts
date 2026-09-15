import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type CustomerProps = {
  idStore: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: boolean;
  createdByUserId: string;
};

export type CustomerPrimitive = {
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: boolean;
  createdByUserId: string;
};

function text(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function optionalText(value: string | undefined | null): string | null {
  return text(value) || null;
}

// Phone is stored as digits only (with country code, if present) — the same
// shape as tb_stores.whatsapp. This is what makes dedupe by phone reliable:
// "(11) 91234-5678", "11912345678" and "+55 11 91234-5678" all collapse to
// the same key, unlike name matching.
export function normalizePhone(
  value: string | undefined | null,
): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || null;
}

export class Customer {
  private constructor(private readonly props: CustomerPrimitive) {}

  static create(props: CustomerProps): Customer {
    const name = text(props.name);
    if (!name) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "name",
      });
    }
    if (!props.idStore) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "idStore",
      });
    }
    if (!props.createdByUserId) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "createdByUserId",
      });
    }

    return new Customer({
      idStore: props.idStore,
      name,
      phone: normalizePhone(props.phone),
      email: optionalText(props.email)?.toLowerCase() ?? null,
      address: optionalText(props.address),
      notes: optionalText(props.notes),
      status: props.status ?? true,
      createdByUserId: props.createdByUserId,
    });
  }

  toPrimitive(): CustomerPrimitive {
    return this.props;
  }
}
