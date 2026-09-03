import { HttpException, HttpStatus } from "@nestjs/common";
import type { GraphQLFormattedError } from "graphql";
import { GraphQLError } from "graphql";
import * as Sentry from "@sentry/nestjs";
import { sanitizeSensitiveData } from "../security/sanitize-sensitive-data";

const CATEGORY_BY_CODE_KEYWORD: Array<{
  keywords: string[];
  category: string;
}> = [
  {
    keywords: ["gateway", "asaas", "mail", "payment"],
    category: "external-gateway",
  },
  { keywords: ["database", "db_"], category: "database" },
  {
    keywords: ["timeout", "network", "econnrefused", "unreachable"],
    category: "network",
  },
];

function inferCategory(code: string): string {
  const normalized = code.toLowerCase();
  const match = CATEGORY_BY_CODE_KEYWORD.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.category ?? "graphql";
}

type ExceptionBody = {
  code?: string;
  details?: unknown;
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

function normalizeHttpException(exception: HttpException) {
  const response = exception.getResponse() as string | ExceptionBody;
  const body = typeof response === "string" ? { message: response } : response;
  const rawMessage = body.message;

  return {
    code: body.code ?? "HTTP_EXCEPTION",
    details: sanitizeSensitiveData(body.details ?? null),
    message: Array.isArray(rawMessage)
      ? sanitizeSensitiveData(rawMessage.join(", "))
      : sanitizeSensitiveData(rawMessage ?? "Erro na requisição."),
    statusCode: body.statusCode ?? exception.getStatus(),
  };
}

export function formatGraphqlError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError =
    error instanceof GraphQLError ? error.originalError : undefined;

  if (originalError instanceof HttpException) {
    const normalized = normalizeHttpException(originalError);

    // Only >=500 is an actual bug/infra failure worth alerting on — 4xx
    // AppExceptions (validation, "already subscribed", etc.) are expected
    // business flow, not something to burn the error quota reporting.
    if (normalized.statusCode >= 500) {
      Sentry.captureException(originalError, {
        tags: { category: inferCategory(normalized.code) },
      });
    }

    return {
      message: normalized.message,
      extensions: {
        code: normalized.code,
        details: normalized.details,
        statusCode: normalized.statusCode,
      },
    };
  }

  Sentry.captureException(originalError ?? error, {
    tags: { category: "graphql" },
  });

  return {
    message: sanitizeSensitiveData(formattedError.message),
    extensions: {
      code:
        typeof formattedError.extensions?.code === "string"
          ? formattedError.extensions.code
          : "INTERNAL_SERVER_ERROR",
      details: null,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    },
  };
}
