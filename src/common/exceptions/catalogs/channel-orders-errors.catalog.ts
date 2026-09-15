import { HttpStatus } from "@nestjs/common";

export const channelOrdersErrors = {
  eventNotFound: {
    code: "CHANNEL_ORDERS_EVENT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Pedido de canal não encontrado.",
  },
} as const;
