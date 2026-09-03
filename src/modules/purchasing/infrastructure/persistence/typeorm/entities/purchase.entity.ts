import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

@Entity("tb_purchases")
export class PurchaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_purchases" })
  idPurchase!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({
    name: "supplier_name",
    type: "varchar",
    length: 160,
    nullable: true,
  })
  supplierName?: string | null;

  @Column({
    name: "purchase_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  purchaseDate!: Date;

  @Column({
    type: "enum",
    enum: PurchaseStatus,
    default: PurchaseStatus.RASCUNHO,
  })
  status!: PurchaseStatus;

  @Column({
    name: "freight_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  freightAmount!: string;

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
    enum: PurchaseDiscountMode,
    default: PurchaseDiscountMode.VALOR,
  })
  discountMode!: PurchaseDiscountMode;

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

  @Column({ name: "finalized_at", type: "timestamptz", nullable: true })
  finalizedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
