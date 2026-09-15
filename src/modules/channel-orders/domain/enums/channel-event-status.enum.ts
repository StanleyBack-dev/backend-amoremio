// Lifecycle of one inbound platform order (see IngestChannelOrderUseCase).
export enum ChannelEventStatus {
  // At least one line item has no mapping to an internal product yet — the
  // order is held here, not yet a Venda.
  PENDING_MAPPING = "PENDING_MAPPING",
  // Every item resolved to a product; a SalesOrder (ABERTA) was created.
  IMPORTED = "IMPORTED",
  // Something unexpected broke while importing (not a mapping gap).
  FAILED = "FAILED",
}
