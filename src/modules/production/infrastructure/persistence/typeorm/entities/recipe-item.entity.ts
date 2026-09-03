import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_recipe_items")
export class RecipeItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_recipe_items" })
  idRecipeItem!: string;

  @Column({ name: "idtb_recipes", type: "uuid" })
  @Index()
  idRecipe!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  // Amount consumed per one recipe yield (one "batch").
  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  // Snapshot of the input product's base (stock) unit.
  @Column({ length: 40 })
  unit!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
