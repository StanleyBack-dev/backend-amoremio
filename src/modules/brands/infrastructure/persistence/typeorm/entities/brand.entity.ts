import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_brands")
@Unique("UQ_brand_store_name", ["idStore", "name"])
export class BrandEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_brands" })
  idBrand!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
