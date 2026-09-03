import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type StoreContact = {
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  ifoodUrl?: string | null;
  food99Url?: string | null;
};

export type StoreProps = StoreContact & {
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  createdByUserId: string;
};

const CNPJ_DIGITS = 14;

function normalizeName(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function optionalText(value: string | undefined | null): string | null {
  return normalizeName(value) || null;
}

// WhatsApp is stored as digits only (with country code, if present).
function normalizeWhatsapp(value: string | undefined | null): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || null;
}

function normalizeEmail(value: string | undefined | null): string | null {
  return normalizeName(value).toLowerCase() || null;
}

// Instagram is stored as a bare handle (no leading "@", no URL).
function normalizeInstagram(value: string | undefined | null): string | null {
  const handle = normalizeName(value)
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  return handle || null;
}

export type NormalizedStoreContact = {
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  ifoodUrl: string | null;
  food99Url: string | null;
};

export function normalizeStoreContact(
  contact: StoreContact,
): NormalizedStoreContact {
  return {
    whatsapp: normalizeWhatsapp(contact.whatsapp),
    email: normalizeEmail(contact.email),
    instagram: normalizeInstagram(contact.instagram),
    ifoodUrl: optionalText(contact.ifoodUrl),
    food99Url: optionalText(contact.food99Url),
  };
}

// Per-field normalizers for the partial-update use case (only the fields the
// caller actually sent get touched).
export const storeContactNormalizers = {
  whatsapp: normalizeWhatsapp,
  email: normalizeEmail,
  instagram: normalizeInstagram,
  ifoodUrl: optionalText,
  food99Url: optionalText,
} as const;

function normalizeCnpj(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) {
    return null;
  }

  if (digits.length !== CNPJ_DIGITS) {
    throw AppException.from(APP_ERRORS.stores.invalidCnpj, undefined);
  }

  return digits;
}

export class Store {
  private constructor(private readonly props: Required<StoreProps>) {}

  static create(props: StoreProps): Store {
    const name = normalizeName(props.name);
    if (!name) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "name",
      });
    }

    if (!props.createdByUserId) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "createdByUserId",
      });
    }

    return new Store({
      name,
      legalName: normalizeName(props.legalName) || null,
      cnpj: normalizeCnpj(props.cnpj),
      createdByUserId: props.createdByUserId,
      ...normalizeStoreContact(props),
    });
  }

  toPrimitive(): Required<StoreProps> {
    return this.props;
  }
}

// Reusable validation for the partial-update use cases, which do not rebuild
// the whole aggregate.
export function assertValidStoreName(name: string | undefined | null): string {
  const normalized = normalizeName(name);
  if (!normalized) {
    throw AppException.from(APP_ERRORS.validation.missingField, {
      field: "name",
    });
  }
  return normalized;
}

export function normalizeOptionalCnpj(
  value: string | undefined | null,
): string | null {
  return normalizeCnpj(value);
}
