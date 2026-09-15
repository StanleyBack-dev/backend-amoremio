import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { IfoodOrderDetail } from "@/modules/channel-orders/infrastructure/ifood/ifood-webhook.types";

const BASE_URL = "https://merchant-api.ifood.com.br";

export interface IfoodAuthTokenResult {
  accessToken: string;
  // Seconds, as returned by the API (21600 = 6h, iFood's default).
  expiresIn: number;
}

// Thin wrapper for the two iFood endpoints Fase 2 needs. Mirrors
// NinetyNineFoodApiClient: no retry/backoff here, IfoodAuthService and the
// webhook controller decide what to do when a call fails.
@Injectable()
export class IfoodApiClient {
  private readonly logger = new Logger(IfoodApiClient.name);

  constructor(private readonly configService: ConfigService) {}

  private credentials(): { clientId: string; clientSecret: string } {
    const clientId = this.configService.get<string>("IFOOD_CLIENT_ID");
    const clientSecret = this.configService.get<string>("IFOOD_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new Error(
        "IFOOD_CLIENT_ID/IFOOD_CLIENT_SECRET não configurados — obtenha-os em Meus Apps → [seu app] → Credenciais no Developer Portal da iFood.",
      );
    }
    return { clientId, clientSecret };
  }

  // Client-credentials flow for centralized apps (developer.ifood.com.br →
  // Authentication → Fluxo para aplicativos centralizados). Not per-store —
  // one token authenticates this app for every merchant it's linked to.
  async getAuthToken(): Promise<IfoodAuthTokenResult> {
    const { clientId, clientSecret } = this.credentials();
    const body = new URLSearchParams({
      grantType: "client_credentials",
      clientId,
      clientSecret,
    });

    const response = await fetch(
      `${BASE_URL}/authentication/v1.0/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `iFood authentication/v1.0/oauth/token falhou (${response.status}): ${text}`,
      );
    }

    const data = (await response.json()) as {
      accessToken: string;
      expiresIn: number;
    };
    return { accessToken: data.accessToken, expiresIn: data.expiresIn };
  }

  async getOrderDetail(
    accessToken: string,
    orderId: string,
  ): Promise<IfoodOrderDetail> {
    const response = await fetch(`${BASE_URL}/order/v1.0/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `iFood order/v1.0/orders/${orderId} falhou (${response.status}): ${text}`,
      );
      throw new Error(
        `iFood order/v1.0/orders/${orderId} falhou (${response.status}).`,
      );
    }

    return (await response.json()) as IfoodOrderDetail;
  }
}
