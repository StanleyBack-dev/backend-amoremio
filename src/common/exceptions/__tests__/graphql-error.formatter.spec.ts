import { HttpException, HttpStatus } from "@nestjs/common";
import { GraphQLError } from "graphql";
import * as Sentry from "@sentry/nestjs";
import { formatGraphqlError } from "../graphql-error.formatter";

jest.mock("@sentry/nestjs", () => ({
  captureException: jest.fn(),
}));

function graphqlErrorWrapping(originalError: unknown): GraphQLError {
  return new GraphQLError("wrapped message", {
    originalError: originalError as Error,
  });
}

describe("formatGraphqlError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not report a 4xx AppException/HttpException to Sentry", () => {
    const httpException = new HttpException(
      { code: "BILLING_ALREADY_SUBSCRIBED", message: "Já é assinante." },
      HttpStatus.CONFLICT,
    );
    const error = graphqlErrorWrapping(httpException);

    formatGraphqlError(error, error);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports a 5xx HttpException to Sentry with an inferred category tag", () => {
    const httpException = new HttpException(
      { code: "BILLING_GATEWAY_REQUEST_FAILED", message: "Falha no gateway." },
      HttpStatus.BAD_GATEWAY,
    );
    const error = graphqlErrorWrapping(httpException);

    formatGraphqlError(error, error);

    expect(Sentry.captureException).toHaveBeenCalledWith(httpException, {
      tags: { category: "external-gateway" },
    });
  });

  it("reports an unexpected (non-HttpException) error to Sentry under the graphql category", () => {
    const unexpected = new Error("boom");
    const error = graphqlErrorWrapping(unexpected);

    formatGraphqlError(error, error);

    expect(Sentry.captureException).toHaveBeenCalledWith(unexpected, {
      tags: { category: "graphql" },
    });
  });

  it("returns a sanitized, generic message for unexpected errors", () => {
    const unexpected = new Error("boom");
    const error = graphqlErrorWrapping(unexpected);

    const result = formatGraphqlError(error, error);

    expect(result.extensions?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(result.extensions?.statusCode).toBe(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
