import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

// One finished-good line a production order actually yielded. A single
// batch can split into more than one of these (e.g. 3 plain + 3 with a
// mix-in), each priced from the batch's blended cost plus whatever extras
// (see ProductionOrderOutputExtraEntity) were spent on that specific line.
// The unique constraint backstops the application-level duplicate check in
// ProductionOrderCrudUseCases.addOutput against a race between two
// concurrent adds of the same product (e.g. a double-click).
@Entity("tb_production_order_outputs")
@Unique("UQ_production_order_output_product", [
  "idProductionOrder",
  "idProduct",
])
export class ProductionOrderOutputEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_production_order_outputs" })
  idProductionOrderOutput!: string;

  @Column({ name: "idtb_production_orders", type: "uuid" })
  @Index()
  idProductionOrder!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  // Effective unit cost credited to stock for this line: the batch's
  // blended cost per unit (shared inputs + labor + overhead, spread across
  // every unit produced) plus this line's own extras, divided by its
  // quantity. 6 decimals to match the other unit-cost columns.
  @Column({
    name: "unit_cost",
    type: "numeric",
    precision: 16,
    scale: 6,
    default: 0,
  })
  unitCost!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
