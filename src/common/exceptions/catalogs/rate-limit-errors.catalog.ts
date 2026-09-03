import { HttpStatus } from "@nestjs/common";
import type { RateLimitExceededParams } from "./catalog-params.type";

export const rateLimitErrors = {
  tooManyRequests: {
    code: "RATE_LIMIT_EXCEEDED",
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: ({ retryAfterSeconds }: RateLimitExceededParams) =>
      retryAfterSeconds
        ? `Muitas requisições. Tente novamente em ${retryAfterSeconds} segundos.`
        : "Muitas requisições. Tente novamente em instantes.",
  },
} as const;
