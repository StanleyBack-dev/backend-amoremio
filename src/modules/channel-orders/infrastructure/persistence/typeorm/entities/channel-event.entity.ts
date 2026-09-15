import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { ChannelEventStatus } from "@/modules/channel-orders/domain/enums/channel-event-status.enum";

@Entity("tb_channel_events")
// external_order_id is the idempotency key — a platform retrying the same
// webhook delivery must resolve to the same row, never a duplicate Venda.
@Unique("UQ_channel_event_store_channel_external_order", [
  "idStore",
  "channel",
  "externalOrderId",
])
export class ChannelEventEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_channel_events" })
  idChannelEvent!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ type: "enum", enum: SalesChannel })
  channel!: SalesChannel;

  @Column({ name: "external_order_id", type: "varchar", length: 120 })
  externalOrderId!: string;

  @Column({ name: "customer_name", length: 160 })
  customerName!: string;

  @Column({
    name: "customer_phone",
    type: "varchar",
    length: 40,
    nullable: true,
  })
  customerPhone?: string | null;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ name: "raw_payload", type: "jsonb" })
  rawPayload!: unknown;

  @Column({
    type: "enum",
    enum: ChannelEventStatus,
    default: ChannelEventStatus.PENDING_MAPPING,
  })
  @Index()
  status!: ChannelEventStatus;

  @Column({ name: "idtb_sales_orders", type: "uuid", nullable: true })
  idSalesOrder?: string | null;

  @Column({ name: "error_detail", type: "text", nullable: true })
  errorDetail?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
