import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jsonBig from "json-bigint";
import type { NinetyNineFoodOrderData } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-webhook.types";

// json-bigint keeps big integers (order_id, item ids) as JS BigInt/strings
// instead of silently losing precision through JSON.parse — 99Food's ids
// are 64-bit and standard JSON parsing corrupts them (see the docs' own
// warning, repeated on every endpoint page).
const jsonBigParser = jsonBig({ storeAsString: true });

const BASE_URL = "https://openapi.99food.com/v1";

export interface NinetyNineFoodAuthTokenResult {
  authToken: string;
  // Unix seconds, as returned by the API.
  tokenExpirationTime: number;
}

// Thin wrapper for the two 99Food endpoints Fase 1.1 needs. No retry/backoff
// logic here on purpose — NinetyNineFoodAuthService and the webhook
// controller decide what to do when a call fails (e.g. a webhook retry from
// 99Food itself is usually the simplest recovery path).
@Injectable()
export class NinetyNineFoodApiClient {
  private readonly logger = new Logger(NinetyNineFoodApiClient.name);

  constructor(private readonly configService: ConfigService) {}

  private credentials(): { appId: string; appSecret: string } {
    const appId = this.configService.get<string>("FOOD99_APP_ID");
    const appSecret = this.configService.get<string>("FOOD99_APP_SECRET");
    if (!appId || !appSecret) {
      throw new Error(
        "FOOD99_APP_ID/FOOD99_APP_SECRET não configurados — obtenha-os em Gerenciamento de aplicativo no portal da 99Food.",
      );
    }
    return { appId, appSecret };
  }

  async getAuthToken(
    externalShopId: string,
  ): Promise<NinetyNineFoodAuthTokenResult> {
    const { appId, appSecret } = this.credentials();
    const params = new URLSearchParams({
      app_id: appId,
      app_secret: appSecret,
      app_shop_id: externalShopId,
    });

    const response = await fetch(`${BASE_URL}/auth/authtoken/get?${params}`);
    const body = jsonBigParser.parse(await response.text()) as {
      errno: number;
      errmsg: string;
      data?: { auth_token: string; token_expiration_time: number };
    };

    if (body.errno !== 0 || !body.data) {
      throw new Error(
        `99Food auth/authtoken/get falhou (errno ${body.errno}): ${body.errmsg}`,
      );
    }

    return {
      authToken: body.data.auth_token,
      tokenExpirationTime: body.data.token_expiration_time,
    };
  }

  async getOrderDetail(
    authToken: string,
    orderId: string,
  ): Promise<NinetyNineFoodOrderData> {
    const params = new URLSearchParams({
      auth_token: authToken,
      order_id: orderId,
    });

    const response = await fetch(`${BASE_URL}/order/order/detail?${params}`);
    const body = jsonBigParser.parse(await response.text()) as {
      errno: number;
      errmsg: string;
      data?: NinetyNineFoodOrderData;
    };

    if (body.errno !== 0 || !body.data) {
      this.logger.error(
        `99Food order/order/detail falhou pra order_id=${orderId} (errno ${body.errno}): ${body.errmsg}`,
      );
      throw new Error(
        `99Food order/order/detail falhou (errno ${body.errno}): ${body.errmsg}`,
      );
    }

    return body.data;
  }
}
