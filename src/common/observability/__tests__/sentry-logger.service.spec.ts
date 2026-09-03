import * as Sentry from "@sentry/nestjs";
import { SentryLoggerService } from "../sentry-logger.service";

jest.mock("@sentry/nestjs", () => ({
  captureMessage: jest.fn(),
}));

describe("SentryLoggerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards error() to Sentry as an error-level message with an inferred category", () => {
    const logger = new SentryLoggerService();

    logger.error(
      "Falha de rede ao chamar a Asaas",
      "AsaasPaymentGatewayProvider",
    );

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Falha de rede ao chamar a Asaas",
      {
        level: "error",
        tags: {
          category: "external-gateway",
          context: "AsaasPaymentGatewayProvider",
        },
      },
    );
  });

  it("forwards warn() to Sentry as a warning-level message", () => {
    const logger = new SentryLoggerService();

    logger.warn("Upstash não configurado", "RateLimiterService");

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Upstash não configurado",
      {
        level: "warning",
        tags: { category: "network", context: "RateLimiterService" },
      },
    );
  });

  it("falls back to the unknown category when no context is present", () => {
    const logger = new SentryLoggerService();

    logger.error("something broke");

    expect(Sentry.captureMessage).toHaveBeenCalledWith("something broke", {
      level: "error",
      tags: { category: "unknown", context: "unknown" },
    });
  });
});
