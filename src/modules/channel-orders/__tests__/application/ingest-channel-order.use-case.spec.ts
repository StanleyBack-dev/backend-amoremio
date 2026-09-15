import { IngestChannelOrderUseCase } from "@/modules/channel-orders/application/use-cases/ingest-channel-order.use-case";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";
import { ChannelEventStatus } from "@/modules/channel-orders/domain/enums/channel-event-status.enum";

const baseOrder: ChannelOrder = {
  idStore: "store-1",
  channel: "FOOD_99" as never,
  externalOrderId: "ext-1",
  customerName: "Anna Luiza",
  customerPhone: "11912345678",
  items: [
    {
      externalProductId: "sku-1",
      externalProductName: "Batidinha Maracujá",
      quantity: 1,
      unitPrice: 20,
    },
  ],
  rawPayload: { any: "payload" },
};

function build() {
  const channelOrderRepository = {
    findEventByExternalOrderId: jest.fn().mockResolvedValue(null),
    createEvent: jest.fn(),
    markEventImported: jest.fn().mockResolvedValue(undefined),
    markEventFailed: jest.fn().mockResolvedValue(undefined),
  };
  const promotionService = {
    promote: jest.fn().mockResolvedValue("sales-order-1"),
  };

  return {
    useCase: new IngestChannelOrderUseCase(
      channelOrderRepository as never,
      promotionService as never,
    ),
    channelOrderRepository,
    promotionService,
  };
}

function eventWith(items: { idProduct: string | null }[]) {
  return {
    idChannelEvent: "event-1",
    idStore: "store-1",
    channel: "FOOD_99",
    externalOrderId: "ext-1",
    status: ChannelEventStatus.PENDING_MAPPING,
    customerName: "Anna Luiza",
    customerPhone: "11912345678",
    notes: null,
    idSalesOrder: null,
    errorDetail: null,
    createdAt: new Date(),
    items: items.map((i, index) => ({
      idChannelEventItem: `item-${index}`,
      externalProductId: "sku-1",
      externalProductName: "Batidinha Maracujá",
      quantity: 1,
      unitPrice: 20,
      idProduct: i.idProduct,
    })),
  };
}

describe("IngestChannelOrderUseCase", () => {
  it("returns DUPLICATE without creating anything when the external order id was already seen", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    channelOrderRepository.findEventByExternalOrderId.mockResolvedValue({
      idChannelEvent: "event-existing",
    });

    const result = await useCase.execute(baseOrder);

    expect(result).toEqual({
      outcome: "DUPLICATE",
      idChannelEvent: "event-existing",
    });
    expect(channelOrderRepository.createEvent).not.toHaveBeenCalled();
    expect(promotionService.promote).not.toHaveBeenCalled();
  });

  it("parks the event PENDING_MAPPING and does not promote when an item has no product mapping", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    channelOrderRepository.createEvent.mockResolvedValue(
      eventWith([{ idProduct: null }]),
    );

    const result = await useCase.execute(baseOrder);

    expect(result).toEqual({
      outcome: "PENDING_MAPPING",
      idChannelEvent: "event-1",
    });
    expect(promotionService.promote).not.toHaveBeenCalled();
  });

  it("promotes to a Venda immediately when every item is already mapped", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    const event = eventWith([{ idProduct: "product-1" }]);
    channelOrderRepository.createEvent.mockResolvedValue(event);

    const result = await useCase.execute(baseOrder);

    expect(promotionService.promote).toHaveBeenCalledWith(event);
    expect(result).toEqual({
      outcome: "IMPORTED",
      idChannelEvent: "event-1",
      idSalesOrder: "sales-order-1",
    });
  });

  it("marks the event FAILED and rethrows when promotion blows up", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    channelOrderRepository.createEvent.mockResolvedValue(
      eventWith([{ idProduct: "product-1" }]),
    );
    promotionService.promote.mockRejectedValue(new Error("boom"));

    await expect(useCase.execute(baseOrder)).rejects.toThrow("boom");
    expect(channelOrderRepository.markEventFailed).toHaveBeenCalledWith(
      "event-1",
      "boom",
    );
  });
});
