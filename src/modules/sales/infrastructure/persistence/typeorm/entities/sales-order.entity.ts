import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

@Entity("tb_sales_orders")
export class SalesOrderEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_sales_orders" })
  idSalesOrder!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({
    name: "customer_name",
    type: "varchar",
    length: 160,
    nullable: true,
  })
  customerName?: string | null;

  @Column({
    name: "order_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  orderDate!: Date;

  @Column({
    type: "enum",
    enum: SalesOrderStatus,
    default: SalesOrderStatus.ABERTA,
  })
  status!: SalesOrderStatus;

  @Column({
    name: "sales_channel",
    type: "enum",
    enum: SalesChannel,
    default: SalesChannel.BALCAO,
  })
  salesChannel!: SalesChannel;

  @Column({
    name: "commission_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercent!: string;

  @Column({
    name: "commission_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  commissionAmount!: string;

  @Column({
    name: "net_total",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  netTotal!: string;

  @Column({
    name: "discount_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount!: string;

  @Column({
    name: "discount_mode",
    type: "enum",
    enum: SalesDiscountMode,
    default: SalesDiscountMode.VALOR,
  })
  discountMode!: SalesDiscountMode;

  @Column({
    name: "discount_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercent!: string;

  @Column({
    name: "items_subtotal",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  itemsSubtotal!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  total!: string;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
  confirmedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
