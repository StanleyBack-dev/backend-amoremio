import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type BrandProps = {
  idStore: string;
  name: string;
  status?: boolean;
  createdByUserId: string;
};

export type BrandPrimitive = {
  idStore: string;
  name: string;
  status: boolean;
  createdByUserId: string;
};

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

export class Brand {
  private constructor(private readonly props: BrandPrimitive) {}

  static create(props: BrandProps): Brand {
    const name = normalizeText(props.name);
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

    return new Brand({
      idStore: props.idStore,
      name,
      status: props.status ?? true,
      createdByUserId: props.createdByUserId,
    });
  }

  toPrimitive(): BrandPrimitive {
    return this.props;
  }
}
