import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";

@Entity("tb_sales_order_items")
export class SalesOrderItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_sales_order_items" })
  idSalesOrderItem!: string;

  @Column({ name: "idtb_sales_orders", type: "uuid" })
  @Index()
  idSalesOrder!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  idProduct!: string;

  @Column({ name: "product_name", length: 160 })
  productName!: string;

  // Snapshot of the product's kind at the time it was added to the order, so
  // confirming the sale can decide whether to move stock even if the product
  // is later reclassified.
  @Column({
    name: "product_kind",
    type: "enum",
    enum: ProductKind,
    default: ProductKind.REVENDA,
  })
  productKind!: ProductKind;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  @Column({ name: "unit_price", type: "numeric", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "line_total", type: "numeric", precision: 12, scale: 2 })
  lineTotal!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
