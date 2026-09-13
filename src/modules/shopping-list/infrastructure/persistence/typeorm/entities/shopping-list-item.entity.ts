import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_shopping_list_items")
export class ShoppingListItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_shopping_list_items" })
  idShoppingListItem!: string;

  @Column({ name: "idtb_shopping_lists", type: "uuid" })
  @Index()
  idShoppingList!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  // Snapshot of the product's base unit at add-time — plain text, same as
  // Purchasing's `purchased_unit`, not the catalog enum column.
  @Column({ length: 10 })
  unit!: string;

  @Column({
    name: "desired_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
  })
  desiredQuantity!: string;

  @Column({ type: "text", nullable: true })
  note?: string | null;

  // Purely a checklist flag for the person shopping — ticked by hand from
  // the linked purchase's screen, independent of whether a matching purchase
  // item was actually added (conversion never auto-creates purchase items).
  @Column({ default: false })
  purchased!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
