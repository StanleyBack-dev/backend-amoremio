import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_stores")
export class StoreEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_stores" })
  idStore!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ name: "legal_name", type: "varchar", length: 160, nullable: true })
  legalName?: string | null;

  @Column({ type: "varchar", length: 14, nullable: true })
  cnpj?: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  whatsapp?: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  email?: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  instagram?: string | null;

  @Column({ name: "ifood_url", type: "varchar", length: 300, nullable: true })
  ifoodUrl?: string | null;

  @Column({ name: "food99_url", type: "varchar", length: 300, nullable: true })
  food99Url?: string | null;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
