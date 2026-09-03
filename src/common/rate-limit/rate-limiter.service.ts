import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { RateLimitTier } from "./rate-limit-tier.enum";
import { UPSTASH_REDIS_CLIENT } from "./upstash-redis.token";

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

interface TierEnvKeys {
  windowKey: string;
  maxKey: string;
  defaultWindowSeconds: number;
  defaultMax: number;
}

const TIER_ENV_KEYS: Record<RateLimitTier, TierEnvKeys> = {
  [RateLimitTier.AUTH]: {
    windowKey: "RATE_LIMIT_AUTH_WINDOW_SECONDS",
    maxKey: "RATE_LIMIT_AUTH_MAX",
    defaultWindowSeconds: 60,
    defaultMax: 10,
  },
  [RateLimitTier.PASSWORD_RECOVERY]: {
    windowKey: "RATE_LIMIT_PASSWORD_RECOVERY_WINDOW_SECONDS",
    maxKey: "RATE_LIMIT_PASSWORD_RECOVERY_MAX",
    defaultWindowSeconds: 900,
    defaultMax: 5,
  },
  [RateLimitTier.MUTATION]: {
    windowKey: "RATE_LIMIT_MUTATION_WINDOW_SECONDS",
    maxKey: "RATE_LIMIT_MUTATION_MAX",
    defaultWindowSeconds: 60,
    defaultMax: 60,
  },
  [RateLimitTier.QUERY]: {
    windowKey: "RATE_LIMIT_QUERY_WINDOW_SECONDS",
    maxKey: "RATE_LIMIT_QUERY_MAX",
    defaultWindowSeconds: 60,
    defaultMax: 120,
  },
};

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly limiters = new Map<RateLimitTier, Ratelimit>();
  private hasWarnedMissingConfig = false;

  constructor(
    @Optional()
    @Inject(UPSTASH_REDIS_CLIENT)
    private readonly redis: Redis | undefined,
    private readonly configService: ConfigService,
  ) {
    if (this.redis) {
      for (const tier of Object.values(RateLimitTier)) {
        this.limiters.set(tier, this.buildLimiter(this.redis, tier));
      }
    }
  }

  async consume(
    tier: RateLimitTier,
    identity: string,
  ): Promise<RateLimitCheckResult> {
    const limiter = this.limiters.get(tier);

    if (!limiter) {
      this.warnMissingConfigOnce();
      return { allowed: true };
    }

    let result: { success: boolean; reset: number };

    try {
      result = await limiter.limit(identity);
    } catch (error) {
      // Redis is configured but unreachable (outage, timeout, DNS...). This
      // guard runs on every GraphQL operation, so letting this exception
      // propagate would turn a Redis blip into a full app outage — every
      // request failing with a 500, for everyone, until Upstash recovers.
      // Fail open instead: an unavailable rate limiter should degrade the
      // app's abuse protection, not its availability.
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha ao consultar o rate limiter (Upstash) — permitindo a requisição: ${message}`,
      );
      return { allowed: true };
    }

    if (result.success) {
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        0,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
    };
  }

  private buildLimiter(redis: Redis, tier: RateLimitTier): Ratelimit {
    const { windowKey, maxKey, defaultWindowSeconds, defaultMax } =
      TIER_ENV_KEYS[tier];

    const windowSeconds = this.configService.get<number>(
      windowKey,
      defaultWindowSeconds,
    );
    const max = this.configService.get<number>(maxKey, defaultMax);

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      // "api" distinguishes this from the BFF's own rate limiter, which
      // shares the same Upstash account/prefix convention but must track
      // its own independent counters — otherwise a normal request passing
      // through both layers would silently consume the same budget twice,
      // halving the effective limit nobody configured for.
      prefix: `amoremio:ratelimit:api:${tier}`,
      analytics: false,
    });
  }

  private warnMissingConfigOnce(): void {
    if (this.hasWarnedMissingConfig) {
      return;
    }

    this.hasWarnedMissingConfig = true;
    this.logger.warn(
      "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados — rate limiting está desabilitado (fail-open).",
    );
  }
}
