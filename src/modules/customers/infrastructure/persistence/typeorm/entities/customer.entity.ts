import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_customers")
// Phone is the dedupe key (name alone is too easy to type two ways for the
// same person) — enforced only when a phone is actually on file.
@Unique("UQ_customer_store_phone", ["idStore", "phone"])
export class CustomerEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_customers" })
  idCustomer!: string;

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
