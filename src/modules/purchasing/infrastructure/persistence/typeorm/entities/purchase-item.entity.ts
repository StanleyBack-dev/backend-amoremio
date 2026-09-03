import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_purchase_items")
export class PurchaseItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_purchase_items" })
  idPurchaseItem!: string;

  @Column({ name: "idtb_purchases", type: "uuid" })
  @Index()
  idPurchase!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  @Column({
    name: "purchased_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
  })
  purchasedQuantity!: string;

  @Column({ name: "purchased_unit", length: 40 })
  purchasedUnit!: string;

  @Column({
    name: "conversion_factor",
    type: "numeric",
    precision: 14,
    scale: 4,
  })
  conversionFactor!: string;

  @Column({ name: "unit_price", type: "numeric", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "line_total", type: "numeric", precision: 12, scale: 2 })
  lineTotal!: string;

  // Frozen when the purchase is finalized.
  @Column({
    name: "base_quantity",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  baseQuantity!: string;

  // 6 decimals — per-base-unit cost of cheap-by-weight inputs (feeds the
  // stock ledger).
  @Column({
    name: "effective_unit_cost",
    type: "numeric",
    precision: 16,
    scale: 6,
    default: 0,
  })
  effectiveUnitCost!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
