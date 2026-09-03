import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

// The "ficha técnica" of a finished good: how much it yields and which inputs
// it consumes. A definition only — editing a recipe never touches stock.
@Entity("tb_recipes")
@Unique("UQ_recipe_store_output", ["idStore", "idOutputProduct"])
export class RecipeEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_recipes" })
  idRecipe!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ name: "idtb_output_product", type: "uuid" })
  idOutputProduct!: string;

  @Column({ name: "output_product_name", length: 160 })
  outputProductName!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({
    name: "yield_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
    default: 0,
  })
  yieldQuantity!: string;

  @Column({ name: "yield_unit", length: 40 })
  yieldUnit!: string;

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

  @Column({ default: true })
  status!: boolean;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
