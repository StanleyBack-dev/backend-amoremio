import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { RateLimitTier } from "@/common/rate-limit/rate-limit-tier.enum";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { GqlExecutionContext } from "@nestjs/graphql";

jest.mock("@nestjs/graphql", () => {
  const actual = jest.requireActual("@nestjs/graphql");
  return {
    ...actual,
    GqlExecutionContext: { create: jest.fn() },
  };
});

function buildExecutionContext(type: "http" | "graphql") {
  return {
    getType: () => type,
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

function mockGqlContext(input: {
  req?: unknown;
  operation?: "query" | "mutation";
  args?: Record<string, unknown>;
}) {
  (GqlExecutionContext.create as jest.Mock).mockReturnValue({
    getContext: () => ({ req: input.req }),
    getInfo: () => ({ operation: { operation: input.operation } }),
    getArgs: () => input.args ?? {},
  });
}

function buildDeps(overrides?: {
  explicitTier?: RateLimitTier;
  consumeResult?: { allowed: boolean; retryAfterSeconds?: number };
}) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(overrides?.explicitTier),
  };
  const rateLimiterService = {
    consume: jest
      .fn()
      .mockResolvedValue(overrides?.consumeResult ?? { allowed: true }),
  };

  return { reflector, rateLimiterService };
}

const fakeRequest = {
  headers: { "x-forwarded-for": "203.0.113.9" },
  socket: { remoteAddress: "127.0.0.1" },
};

describe("RateLimitGuard", () => {
  it("allows plain HTTP requests through without consuming any limiter", async () => {
    const { reflector, rateLimiterService } = buildDeps();
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    const result = await guard.canActivate(buildExecutionContext("http"));

    expect(result).toBe(true);
    expect(rateLimiterService.consume).not.toHaveBeenCalled();
  });

  it("defaults to the QUERY tier for GraphQL query operations", async () => {
    mockGqlContext({ req: fakeRequest, operation: "query" });
    const { reflector, rateLimiterService } = buildDeps();
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    await guard.canActivate(buildExecutionContext("graphql"));

    expect(rateLimiterService.consume).toHaveBeenCalledWith(
      RateLimitTier.QUERY,
      "ip:203.0.113.9",
    );
  });

  it("defaults to the MUTATION tier for GraphQL mutation operations", async () => {
    mockGqlContext({ req: fakeRequest, operation: "mutation" });
    const { reflector, rateLimiterService } = buildDeps();
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    await guard.canActivate(buildExecutionContext("graphql"));

    expect(rateLimiterService.consume).toHaveBeenCalledWith(
      RateLimitTier.MUTATION,
      "ip:203.0.113.9",
    );
  });

  it("honors an explicit @RateLimit() tier over the operation-type default", async () => {
    mockGqlContext({ req: fakeRequest, operation: "query" });
    const { reflector, rateLimiterService } = buildDeps({
      explicitTier: RateLimitTier.AUTH,
    });
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    await guard.canActivate(buildExecutionContext("graphql"));

    expect(rateLimiterService.consume).toHaveBeenCalledWith(
      RateLimitTier.AUTH,
      "ip:203.0.113.9",
    );
  });

  it("also checks the target email for the PASSWORD_RECOVERY tier", async () => {
    mockGqlContext({
      req: fakeRequest,
      operation: "mutation",
      args: { input: { email: "  Victim@Example.com " } },
    });
    const { reflector, rateLimiterService } = buildDeps({
      explicitTier: RateLimitTier.PASSWORD_RECOVERY,
    });
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    await guard.canActivate(buildExecutionContext("graphql"));

    expect(rateLimiterService.consume).toHaveBeenCalledWith(
      RateLimitTier.PASSWORD_RECOVERY,
      "ip:203.0.113.9",
    );
    expect(rateLimiterService.consume).toHaveBeenCalledWith(
      RateLimitTier.PASSWORD_RECOVERY,
      "email:victim@example.com",
    );
    expect(rateLimiterService.consume).toHaveBeenCalledTimes(2);
  });

  it("does not perform a second check when no email is present in a non-recovery tier", async () => {
    mockGqlContext({
      req: fakeRequest,
      operation: "mutation",
      args: { input: { email: "user@example.com" } },
    });
    const { reflector, rateLimiterService } = buildDeps({
      explicitTier: RateLimitTier.MUTATION,
    });
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    await guard.canActivate(buildExecutionContext("graphql"));

    expect(rateLimiterService.consume).toHaveBeenCalledTimes(1);
  });

  it("throws a 429 AppException when the limiter reports the request as blocked", async () => {
    mockGqlContext({ req: fakeRequest, operation: "query" });
    const { reflector, rateLimiterService } = buildDeps({
      consumeResult: { allowed: false, retryAfterSeconds: 30 },
    });
    const guard = new RateLimitGuard(
      reflector as never,
      rateLimiterService as never,
    );

    const error = await guard
      .canActivate(buildExecutionContext("graphql"))
      .catch((e) => e);

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({
      response: { code: APP_ERRORS.rateLimit.tooManyRequests.code },
    });
  });
});
