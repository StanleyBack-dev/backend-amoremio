import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type SupplierProps = {
  idStore: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  instagram?: string | null;
  document?: string | null;
  notes?: string | null;
  status?: boolean;
  createdByUserId: string;
};

export type SupplierPrimitive = {
  idStore: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  document: string | null;
  notes: string | null;
  status: boolean;
  createdByUserId: string;
};

function text(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function optionalText(value: string | undefined | null): string | null {
  const trimmed = text(value);
  return trimmed || null;
}

// Instagram is stored as a bare handle (no leading "@", no URL).
function normalizeInstagram(value: string | undefined | null): string | null {
  const trimmed = text(value).replace(/^@+/, "");
  const handle = trimmed.replace(
    /^https?:\/\/(www\.)?instagram\.com\//i,
    "",
  );
  return handle.replace(/\/+$/, "") || null;
}

export class Supplier {
  private constructor(private readonly props: SupplierPrimitive) {}

  static create(props: SupplierProps): Supplier {
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

    return new Supplier({
      idStore: props.idStore,
      name,
      phone: optionalText(props.phone),
      email: optionalText(props.email),
      address: optionalText(props.address),
      instagram: normalizeInstagram(props.instagram),
      document: optionalText(props.document),
      notes: optionalText(props.notes),
      status: props.status ?? true,
      createdByUserId: props.createdByUserId,
    });
  }

  toPrimitive(): SupplierPrimitive {
    return this.props;
  }
}
