import { Controller, Inject, Logger, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { IngestChannelOrderUseCase } from "@/modules/channel-orders/application/use-cases/ingest-channel-order.use-case";
import { IfoodApiClient } from "@/modules/channel-orders/infrastructure/ifood/ifood-api.client";
import { IfoodAuthService } from "@/modules/channel-orders/infrastructure/ifood/ifood-auth.service";
import { normalizeIfoodOrder } from "@/modules/channel-orders/infrastructure/ifood/normalize-ifood-order";
import type { IfoodWebhookEvent } from "@/modules/channel-orders/infrastructure/ifood/ifood-webhook.types";
import { verifyIfoodSignature } from "@/modules/channel-orders/infrastructure/ifood/verify-ifood-signature";

// The only event Fase 2 acts on — mirrors the 99Food orderConfirm decision:
// PLACED (code PLC) fires on customer payment, CONFIRMED (code CFM) fires
// once the merchant accepts, and we want the Venda created at accept-time.
const HANDLED_FULL_CODE = "CONFIRMED";

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

// iFood webhook receiver. Unlike 99Food's {errno, errmsg} body envelope,
// iFood is plain HTTP status: 202 Accepted within 5s means "received", any
// other status (or a slow response) makes iFood treat delivery as failed
// and retry. Signature failures get 401 — no amount of retrying fixes a
// bad signature, and their homologation process explicitly tests this.
@Controller("webhooks/ifood")
export class IfoodWebhookController {
  private readonly logger = new Logger(IfoodWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly ingestChannelOrderUseCase: IngestChannelOrderUseCase,
    private readonly authService: IfoodAuthService,
    private readonly apiClient: IfoodApiClient,
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
      this.logger.error("Webhook iFood sem rawBody capturado.");
      res.status(500).send();
      return;
    }

    const clientSecret = this.configService.get<string>("IFOOD_CLIENT_SECRET");
    if (!clientSecret) {
      this.logger.error("IFOOD_CLIENT_SECRET não configurado.");
      res.status(500).send();
      return;
    }

    const signatureValid = verifyIfoodSignature(
      rawBody,
      req.header("x-ifood-signature"),
      clientSecret,
    );
    if (!signatureValid) {
      this.logger.warn("Webhook iFood com assinatura inválida — rejeitado.");
      res.status(401).send();
      return;
    }

    const event = JSON.parse(rawBody.toString("utf-8")) as IfoodWebhookEvent;

    if (event.fullCode !== HANDLED_FULL_CODE) {
      // Every other event (PLACED, CANCELLED, READY_TO_PICKUP...) is
      // acknowledged and ignored in Fase 2 — só ingestão on accept. Still
      // must respond fast: iFood's presença mechanism treats any 202 here
      // as "app online".
      res.status(202).send();
      return;
    }

    const idStore =
      await this.channelOrderRepository.findStoreIdByExternalShopId(
        SalesChannel.IFOOD,
        event.merchantId,
      );
    if (!idStore) {
      this.logger.error(
        `Webhook iFood de merchantId=${event.merchantId} sem loja vinculada (rode link-channel-store.script.ts).`,
      );
      res.status(202).send();
      return;
    }

    try {
      const accessToken = await this.authService.getValidAuthToken(idStore);
      const orderDetail = await this.apiClient.getOrderDetail(
        accessToken,
        event.orderId,
      );
      const order = normalizeIfoodOrder(orderDetail, idStore);
      const result = await this.ingestChannelOrderUseCase.execute(order);
      this.logger.log(`Pedido iFood #${event.orderId}: ${result.outcome}.`);
      res.status(202).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "erro desconhecido";
      this.logger.error(
        `Falha processando CONFIRMED iFood #${event.orderId}: ${message}`,
      );
      // 500 here (instead of an acking 202) is deliberate, unlike the
      // shop-not-linked case above: this is a transient processing failure
      // where an iFood retry is actually useful.
      res.status(500).send();
    }
  }
}
