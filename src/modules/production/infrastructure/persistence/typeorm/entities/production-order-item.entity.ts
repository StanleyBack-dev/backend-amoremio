import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

// Snapshot of one input the production order consumes. Generated from the
// recipe when the order is created and regenerated if the batch count changes
// while the order is still a draft.
@Entity("tb_production_order_items")
export class ProductionOrderItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_production_order_items" })
  idProductionOrderItem!: string;

  @Column({ name: "idtb_production_orders", type: "uuid" })
  @Index()
  idProductionOrder!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  @Column({ length: 40 })
  unit!: string;

  // Frozen when the order is completed: the input's average cost then.
  // 6 decimals — cheap-by-weight inputs cost fractions of a cent per gram.
  @Column({
    name: "unit_cost_at_consumption",
    type: "numeric",
    precision: 16,
    scale: 6,
    default: 0,
  })
  unitCostAtConsumption!: string;

  @Column({
    name: "line_cost",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  lineCost!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
