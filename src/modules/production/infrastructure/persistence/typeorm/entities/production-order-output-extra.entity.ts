import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

// An extra ingredient spent on one specific output line only (e.g. the
// scoop of Nutella that only the "com Nutella" bottles get), on top of the
// inputs shared by the whole production order. Debited from stock and
// costed the same way a regular production input is. The unique constraint
// backstops the application-level duplicate check in
// ProductionOrderCrudUseCases.addOutputExtra against a race between two
// concurrent adds of the same product to the same line.
@Entity("tb_production_order_output_extras")
@Unique("UQ_production_order_output_extra_product", [
  "idProductionOrderOutput",
  "idProduct",
])
export class ProductionOrderOutputExtraEntity {
  @PrimaryGeneratedColumn("uuid", {
    name: "idtb_production_order_output_extras",
  })
  idProductionOrderOutputExtra!: string;

  @Column({ name: "idtb_production_order_outputs", type: "uuid" })
  @Index()
  idProductionOrderOutput!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

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
