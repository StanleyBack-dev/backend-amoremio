import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { extractClientIp } from "@/common/utils/extract-client-ip.util";
import { RATE_LIMIT_TIER_KEY } from "@/common/rate-limit/rate-limit-tier.decorator";
import { RateLimitTier } from "@/common/rate-limit/rate-limit-tier.enum";
import { RateLimiterService } from "@/common/rate-limit/rate-limiter.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType<"http" | "graphql">() !== "graphql") {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext()?.req as Request | undefined;

    if (!request) {
      return true;
    }

    const tier = this.resolveTier(context, gqlContext);
    const ip = extractClientIp(request) ?? "unknown";

    await this.enforce(tier, `ip:${ip}`);

    if (tier === RateLimitTier.PASSWORD_RECOVERY) {
      const email = this.extractEmail(gqlContext);
      if (email) {
        await this.enforce(tier, `email:${email.trim().toLowerCase()}`);
      }
    }

    return true;
  }

  private resolveTier(
    context: ExecutionContext,
    gqlContext: GqlExecutionContext,
  ): RateLimitTier {
    const explicitTier = this.reflector.getAllAndOverride<
      RateLimitTier | undefined
    >(RATE_LIMIT_TIER_KEY, [context.getHandler(), context.getClass()]);

    if (explicitTier) {
      return explicitTier;
    }

    const operation = gqlContext.getInfo()?.operation?.operation;
    return operation === "mutation"
      ? RateLimitTier.MUTATION
      : RateLimitTier.QUERY;
  }

  private extractEmail(gqlContext: GqlExecutionContext): string | undefined {
    const args = gqlContext.getArgs<Record<string, unknown>>();
    const input = args?.input as Record<string, unknown> | undefined;

    const email = input?.email ?? args?.email;
    return typeof email === "string" ? email : undefined;
  }

  private async enforce(tier: RateLimitTier, identity: string): Promise<void> {
    const result = await this.rateLimiterService.consume(tier, identity);

    if (!result.allowed) {
      throw AppException.from(APP_ERRORS.rateLimit.tooManyRequests, {
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
  }
}
