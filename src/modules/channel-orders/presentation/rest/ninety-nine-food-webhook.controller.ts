import { Controller, Inject, Logger, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import jsonBig from "json-bigint";
import { Public } from "@/common/decorators/public.decorator";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { IngestChannelOrderUseCase } from "@/modules/channel-orders/application/use-cases/ingest-channel-order.use-case";
import { NinetyNineFoodApiClient } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-api.client";
import { NinetyNineFoodAuthService } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-auth.service";
import { normalizeNinetyNineFoodOrder } from "@/modules/channel-orders/infrastructure/ninety-nine-food/normalize-ninety-nine-food-order";
import type { NinetyNineFoodWebhookEnvelope } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-webhook.types";
import { verifyNinetyNineFoodSignature } from "@/modules/channel-orders/infrastructure/ninety-nine-food/verify-ninety-nine-food-signature";

const jsonBigParser = jsonBig({ storeAsString: true });

// The only event Fase 1.1 acts on — see the discussion in the plan for why:
// orderNew fires on customer payment, orderConfirm fires once the merchant
// accepts (via 99Food's own B-App panel, in our current setup), and we
// want the Venda created at accept-time, not payment-time.
const HANDLED_EVENT_TYPE = "orderConfirm";

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

function ack(res: Response, errno = 0, errmsg = "ok") {
  res.status(200).json({ errno, errmsg });
}

// 99Food webhook receiver. Every response must be the {errno, errmsg} JSON
// envelope their docs specify — HTTP status alone does not tell 99Food
// whether to retry, only errno does (a non-zero errno makes them redeliver
// for a while). Signature failures are the one case that gets a real 401
// instead: no amount of retrying fixes a bad signature.
@Controller("webhooks/99food")
export class NinetyNineFoodWebhookController {
  private readonly logger = new Logger(NinetyNineFoodWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly ingestChannelOrderUseCase: IngestChannelOrderUseCase,
    private readonly authService: NinetyNineFoodAuthService,
    private readonly apiClient: NinetyNineFoodApiClient,
  ) {}

  @Public()
  @Post("orders")
  async handleOrderWebhook(
    @Req() req: RequestWithRawBody,
    @Res() res: Response,
  ): Promise<void> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      // Should never happen — main.ts always attaches it — but a webhook
      // that can't be verified must not be processed either way.
      this.logger.error("Webhook 99Food sem rawBody capturado.");
      res.status(500).json({ errno: 1, errmsg: "internal error" });
      return;
    }

    const appSecret = this.configService.get<string>("FOOD99_APP_SECRET");
    if (!appSecret) {
      this.logger.error("FOOD99_APP_SECRET não configurado.");
      res.status(500).json({ errno: 1, errmsg: "internal error" });
      return;
    }

    const signatureValid = verifyNinetyNineFoodSignature(
      rawBody,
      req.header("didi-header-sign"),
      appSecret,
    );
    if (!signatureValid) {
      this.logger.warn("Webhook 99Food com assinatura inválida — rejeitado.");
      res.status(401).json({ errno: 1, errmsg: "invalid signature" });
      return;
    }

    const envelope = jsonBigParser.parse(
      rawBody.toString("utf-8"),
    ) as NinetyNineFoodWebhookEnvelope;

    if (envelope.type !== HANDLED_EVENT_TYPE) {
      // Every other event type (orderNew, orderCancel, orderReady...) is
      // acknowledged and ignored in Fase 1.1 — só ingestão on accept.
      ack(res);
      return;
    }

    const idStore =
      await this.channelOrderRepository.findStoreIdByExternalShopId(
        SalesChannel.FOOD_99,
        envelope.app_shop_id,
      );
    if (!idStore) {
      this.logger.error(
        `Webhook 99Food de app_shop_id=${envelope.app_shop_id} sem loja vinculada (rode link-channel-store.script.ts).`,
      );
      ack(res, 1, "shop not linked");
      return;
    }

    try {
      const authToken = await this.authService.getValidAuthToken(idStore);
      const orderDetail = await this.apiClient.getOrderDetail(
        authToken,
        envelope.data.order_id,
      );
      const order = normalizeNinetyNineFoodOrder(orderDetail, idStore);
      const result = await this.ingestChannelOrderUseCase.execute(order);
      this.logger.log(
        `Pedido 99Food #${envelope.data.order_id}: ${result.outcome}.`,
      );
      ack(res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "erro desconhecido";
      this.logger.error(
        `Falha processando orderConfirm 99Food #${envelope.data.order_id}: ${message}`,
      );
      ack(res, 1, "processing error");
    }
  }
}
