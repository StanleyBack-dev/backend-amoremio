import type { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";
import { UPSTASH_REDIS_CLIENT } from "./upstash-redis.token";

export const UpstashRedisProvider: Provider = {
  provide: UPSTASH_REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Redis | undefined => {
    const url = configService.get<string>("UPSTASH_REDIS_REST_URL");
    const token = configService.get<string>("UPSTASH_REDIS_REST_TOKEN");

    if (!url || !token) {
      return undefined;
    }

    return new Redis({ url, token });
  },
};
