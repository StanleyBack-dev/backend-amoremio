import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("tb_terms_acceptances")
export class TermsAcceptanceEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_terms_acceptances" })
  idTermsAcceptances!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  @Index()
  idUsers!: string;

  @Column({ name: "terms_version" })
  termsVersion!: string;

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @Column({ name: "accepted_at", type: "timestamptz" })
  acceptedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
