import { MapChannelProductUseCase } from "@/modules/channel-orders/application/use-cases/map-channel-product.use-case";

function pendingEvent(id: string, items: { idProduct: string | null }[]) {
  return {
    idChannelEvent: id,
    idStore: "store-1",
    channel: "FOOD_99",
    externalOrderId: `ext-${id}`,
    status: "PENDING_MAPPING",
    customerName: "Cliente",
    customerPhone: null,
    notes: null,
    idSalesOrder: null,
    errorDetail: null,
    createdAt: new Date(),
    items: items.map((i, index) => ({
      idChannelEventItem: `${id}-item-${index}`,
      externalProductId: "sku-1",
      externalProductName: "Batidinha Maracujá",
      quantity: 1,
      unitPrice: 20,
      idProduct: i.idProduct,
    })),
  };
}

function build() {
  const channelOrderRepository = {
    upsertProductMapping: jest.fn().mockResolvedValue(undefined),
    listPendingEventsByExternalProduct: jest.fn().mockResolvedValue([]),
    markEventFailed: jest.fn().mockResolvedValue(undefined),
  };
  const promotionService = {
    promote: jest.fn().mockResolvedValue("sales-order-x"),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new MapChannelProductUseCase(
      channelOrderRepository as never,
      promotionService as never,
      auth as never,
    ),
    channelOrderRepository,
    promotionService,
    auth,
  };
}

const command = {
  idStore: "store-1",
  channel: "FOOD_99" as never,
  externalProductId: "sku-1",
  externalProductName: "Batidinha Maracujá",
  idProduct: "product-1",
};

describe("MapChannelProductUseCase", () => {
  it("checks REGISTER_SALE and saves the mapping", async () => {
    const { useCase, auth, channelOrderRepository } = build();

    await useCase.execute("user-1", command);

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "REGISTER_SALE",
    );
    expect(channelOrderRepository.upsertProductMapping).toHaveBeenCalledWith({
      idStore: "store-1",
      channel: "FOOD_99",
      externalProductId: "sku-1",
      externalProductName: "Batidinha Maracujá",
      idProduct: "product-1",
    });
  });

  it("promotes every pending event that is now fully mapped, and skips ones still blocked by another item", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    const ready = pendingEvent("e1", [{ idProduct: "product-1" }]);
    const stillBlocked = pendingEvent("e2", [
      { idProduct: "product-1" },
      { idProduct: null },
    ]);
    channelOrderRepository.listPendingEventsByExternalProduct.mockResolvedValue(
      [ready, stillBlocked],
    );

    const result = await useCase.execute("user-1", command);

    expect(promotionService.promote).toHaveBeenCalledTimes(1);
    expect(promotionService.promote).toHaveBeenCalledWith(ready);
    expect(result).toEqual({ promotedOrders: 1, failedOrders: 0 });
  });

  it("marks a pending event FAILED and keeps going when promotion throws", async () => {
    const { useCase, channelOrderRepository, promotionService } = build();
    const ready = pendingEvent("e1", [{ idProduct: "product-1" }]);
    channelOrderRepository.listPendingEventsByExternalProduct.mockResolvedValue(
      [ready],
    );
    promotionService.promote.mockRejectedValue(new Error("boom"));

    const result = await useCase.execute("user-1", command);

    expect(channelOrderRepository.markEventFailed).toHaveBeenCalledWith(
      "e1",
      "boom",
    );
    expect(result).toEqual({ promotedOrders: 0, failedOrders: 1 });
  });
});
