import { SetMetadata } from "@nestjs/common";
import type { RateLimitTier } from "./rate-limit-tier.enum";

export const RATE_LIMIT_TIER_KEY = "rateLimitTier";
export const RateLimit = (tier: RateLimitTier) =>
  SetMetadata(RATE_LIMIT_TIER_KEY, tier);
