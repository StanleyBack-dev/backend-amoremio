import { ConsoleLogger } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

// Groups noisy per-class Logger contexts (e.g. "AsaasPaymentGatewayProvider")
// into the small set of categories the Sentry dashboard filters on.
const CATEGORY_BY_CONTEXT_KEYWORD: Array<{
  keywords: string[];
  category: string;
}> = [
  {
    keywords: ["asaas", "payment", "gateway", "mail", "brevo"],
    category: "external-gateway",
  },
  { keywords: ["database", "typeorm", "repository"], category: "database" },
  { keywords: ["ratelimit", "upstash", "redis"], category: "network" },
];

function inferCategory(context?: string): string {
  if (!context) return "unknown";

  const normalized = context.toLowerCase();
  const match = CATEGORY_BY_CONTEXT_KEYWORD.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.category ?? "unknown";
}

// Registered app-wide via app.useLogger(...) in serverless.ts/main.ts.
// Extending ConsoleLogger (rather than only implementing LoggerService) is
// what makes every existing `new Logger(ClassName.name)` instance across
// the codebase delegate through here automatically — no per-file changes
// needed to get Sentry visibility on the error/warn logging that already
// exists.
export class SentryLoggerService extends ConsoleLogger {
  error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);
    this.reportToSentry("error", message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams);
    this.reportToSentry("warning", message, optionalParams);
  }

  private reportToSentry(
    level: "error" | "warning",
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const context = optionalParams.find(
      (param): param is string => typeof param === "string",
    );

    Sentry.captureMessage(
      typeof message === "string" ? message : JSON.stringify(message),
      {
        level,
        tags: {
          category: inferCategory(context),
          context: context ?? "unknown",
        },
      },
    );
  }
}
