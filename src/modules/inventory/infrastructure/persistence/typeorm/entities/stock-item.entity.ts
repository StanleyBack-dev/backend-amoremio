import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

// One row per product that has ever had a stock movement. The product id is
// the primary key — a product's stock is a singleton snapshot kept in sync
// by the ledger.
@Entity("tb_stock_items")
export class StockItemEntity {
  @PrimaryColumn({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({
    name: "quantity_on_hand",
    type: "numeric",
    precision: 14,
    scale: 3,
    default: 0,
  })
  quantityOnHand!: string;

  @Column({
    name: "average_cost",
    type: "numeric",
    precision: 16,
    scale: 6,
    default: 0,
  })
  averageCost!: string;

  @Column({
    name: "reorder_point",
    type: "numeric",
    precision: 14,
    scale: 3,
    nullable: true,
  })
  reorderPoint?: string | null;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
