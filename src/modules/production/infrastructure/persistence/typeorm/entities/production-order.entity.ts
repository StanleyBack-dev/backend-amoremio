import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

@Entity("tb_production_orders")
export class ProductionOrderEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_production_orders" })
  idProductionOrder!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ name: "idtb_recipes", type: "uuid" })
  idRecipe!: string;

  @Column({ name: "recipe_name", length: 160 })
  recipeName!: string;

  @Column({ name: "idtb_output_product", type: "uuid" })
  idOutputProduct!: string;

  @Column({ name: "output_product_name", length: 160 })
  outputProductName!: string;

  @Column({
    name: "production_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  productionDate!: Date;

  @Column({
    type: "enum",
    enum: ProductionOrderStatus,
    default: ProductionOrderStatus.RASCUNHO,
  })
  status!: ProductionOrderStatus;

  @Column({ type: "numeric", precision: 14, scale: 3, default: 1 })
  batches!: string;

  @Column({
    name: "planned_output_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
    default: 0,
  })
  plannedOutputQuantity!: string;

  @Column({
    name: "actual_output_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
    default: 0,
  })
  actualOutputQuantity!: string;

  @Column({
    name: "labor_cost",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  laborCost!: string;

  @Column({
    name: "overhead_cost",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  overheadCost!: string;

  // Frozen when the order is completed.
  @Column({
    name: "inputs_cost",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  inputsCost!: string;

  @Column({
    name: "total_cost",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  totalCost!: string;

  @Column({
    name: "output_unit_cost",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  outputUnitCost!: string;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @Column({ name: "concluded_at", type: "timestamptz", nullable: true })
  concludedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
