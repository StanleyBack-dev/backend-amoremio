import { HttpStatus } from "@nestjs/common";

export const internalErrors = {
  invalidCronToken: {
    code: "INTERNAL_INVALID_CRON_TOKEN",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token de execução inválido.",
  },
} as const;
