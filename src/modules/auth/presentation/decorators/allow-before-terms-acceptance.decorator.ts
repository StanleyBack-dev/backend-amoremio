import { SetMetadata } from "@nestjs/common";

export const ALLOW_BEFORE_TERMS_ACCEPTANCE_KEY = "allowBeforeTermsAcceptance";
export const AllowBeforeTermsAcceptance = () =>
  SetMetadata(ALLOW_BEFORE_TERMS_ACCEPTANCE_KEY, true);
