export type CreateTermsAcceptancePayload = {
  idUsers: string;
  termsVersion: string;
  ipAddress?: string;
  userAgent?: string;
  acceptedAt: Date;
};

export type TermsAcceptanceView = {
  termsVersion: string;
  acceptedAt: Date;
};

export interface TermsAcceptanceRepositoryPort {
  create(payload: CreateTermsAcceptancePayload): Promise<void>;
  findLatestByUserId(idUsers: string): Promise<TermsAcceptanceView | null>;
}

export const TERMS_ACCEPTANCE_REPOSITORY = Symbol(
  "TERMS_ACCEPTANCE_REPOSITORY",
);
