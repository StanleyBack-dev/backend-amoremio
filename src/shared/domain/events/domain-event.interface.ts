export interface DomainEvent<TPayload = unknown> {
  readonly eventName: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}
