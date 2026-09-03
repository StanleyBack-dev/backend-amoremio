import { RateLimiterService } from "@/common/rate-limit/rate-limiter.service";
import { RateLimitTier } from "@/common/rate-limit/rate-limit-tier.enum";

const limitMock = jest.fn();

jest.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    limit(...args: unknown[]) {
      return limitMock(...args);
    }
  }

  return {
    Ratelimit: Object.assign(MockRatelimit, {
      slidingWindow: jest.fn((max: number, window: string) => ({
        max,
        window,
      })),
    }),
  };
});

function buildConfigService(overrides: Record<string, number> = {}) {
  return {
    get: jest.fn(
      (key: string, fallback?: number) => overrides[key] ?? fallback,
    ),
  };
}

describe("RateLimiterService", () => {
  beforeEach(() => {
    limitMock.mockReset();
  });

  it("fails open (allows) when no Redis client is configured", async () => {
    const service = new RateLimiterService(
      undefined,
      buildConfigService() as never,
    );

    const result = await service.consume(RateLimitTier.AUTH, "ip:1.2.3.4");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("allows the request when the underlying limiter reports success", async () => {
    limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
    const service = new RateLimiterService(
      {} as never,
      buildConfigService() as never,
    );

    const result = await service.consume(RateLimitTier.AUTH, "ip:1.2.3.4");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).toHaveBeenCalledWith("ip:1.2.3.4");
  });

  it("blocks the request and reports retryAfterSeconds when the limit is exceeded", async () => {
    const reset = Date.now() + 42_000;
    limitMock.mockResolvedValue({ success: false, reset });
    const service = new RateLimiterService(
      {} as never,
      buildConfigService() as never,
    );

    const result = await service.consume(RateLimitTier.AUTH, "ip:1.2.3.4");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(42);
  });

  it("fails open when Redis is configured but unreachable mid-request", async () => {
    limitMock.mockRejectedValue(new Error("ECONNRESET"));
    const service = new RateLimiterService(
      {} as never,
      buildConfigService() as never,
    );

    const result = await service.consume(RateLimitTier.AUTH, "ip:1.2.3.4");

    expect(result).toEqual({ allowed: true });
  });

  it("keys each tier under its own limiter instance", async () => {
    limitMock.mockResolvedValue({ success: true, reset: Date.now() + 1000 });
    const service = new RateLimiterService(
      {} as never,
      buildConfigService() as never,
    );

    await service.consume(RateLimitTier.AUTH, "ip:1.2.3.4");
    await service.consume(RateLimitTier.QUERY, "ip:1.2.3.4");

    expect(limitMock).toHaveBeenCalledTimes(2);
  });
});
