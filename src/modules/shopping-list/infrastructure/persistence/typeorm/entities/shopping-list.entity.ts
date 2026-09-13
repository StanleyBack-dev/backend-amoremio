import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

@Entity("tb_shopping_lists")
export class ShoppingListEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_shopping_lists" })
  idShoppingList!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  name?: string | null;

  @Column({
    type: "enum",
    enum: ShoppingListStatus,
    default: ShoppingListStatus.ABERTA,
  })
  status!: ShoppingListStatus;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  // Set once the list is converted — points at the purchase draft it created.
  // Plain uuid column, no FK constraint: this module only reads Purchasing
  // through its use-cases, never its tables.
  @Column({ name: "converted_to_purchase_id", type: "uuid", nullable: true })
  convertedToPurchaseId?: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @Column({ name: "converted_at", type: "timestamptz", nullable: true })
  convertedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
