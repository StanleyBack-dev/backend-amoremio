import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_suppliers")
@Unique("UQ_supplier_store_name", ["idStore", "name"])
export class SupplierEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_suppliers" })
  idSupplier!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 40, nullable: true })
  phone?: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  email?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address?: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  instagram?: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  document?: string | null;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
