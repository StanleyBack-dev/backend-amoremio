import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

@Entity("tb_products")
// A brand disambiguates same-named products: the (store, name, brand) triple
// must be unique. Products without a brand fall back to a store-wide unique
// name, enforced by the partial index below.
@Unique("UQ_product_store_name_brand", ["idStore", "name", "brand"])
@Index("UQ_product_store_name_no_brand", ["idStore", "name"], {
  unique: true,
  where: '"brand" IS NULL',
})
@Unique("UQ_product_store_sku", ["idStore", "sku"])
export class ProductEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_products" })
  idProduct!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 60, nullable: true })
  sku?: string | null;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  brand?: string | null;

  @Column({ type: "enum", enum: ProductKind, default: ProductKind.INSUMO })
  kind!: ProductKind;

  @Column({ type: "enum", enum: UnitOfMeasure })
  unit!: UnitOfMeasure;

  // How the product is counted as whole physical items when buying.
  @Column({
    name: "packaging_unit",
    type: "enum",
    enum: PackagingUnit,
    default: PackagingUnit.UNIDADE,
  })
  packagingUnit!: PackagingUnit;

  // How many `unit` are contained in one `packagingUnit` (e.g. 1 saco = 5 KG).
  @Column({
    name: "pack_size",
    type: "numeric",
    precision: 14,
    scale: 3,
    default: 1,
  })
  packSize!: string;

  @Column({
    name: "sale_price",
    type: "numeric",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salePrice?: string | null;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
