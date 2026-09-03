import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthVerificationPurpose } from "@/modules/auth/domain/enums/auth-verification-purpose.enum";

@Entity("tb_auth_verification_codes")
@Index(["idUsers", "purpose"])
@Index(["targetEmail", "purpose"])
export class AuthVerificationCodeEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_auth_verification_codes" })
  idAuthVerificationCodes!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "idtb_users" })
  user!: UserEntity;

  @Column({
    type: "enum",
    enum: AuthVerificationPurpose,
  })
  purpose!: AuthVerificationPurpose;

  @Column({ name: "target_email" })
  targetEmail!: string;

  @Column({ name: "code_hash" })
  codeHash!: string;

  @Column({ name: "attempt_count", type: "int", default: 0 })
  attemptCount!: number;

  @Column({ name: "max_attempts", type: "int", default: 5 })
  maxAttempts!: number;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "verified_at", type: "timestamptz", nullable: true })
  verifiedAt?: Date | null;

  @Column({ name: "reset_token", type: "varchar", nullable: true })
  resetToken?: string | null;

  @Column({
    name: "reset_token_expires_at",
    type: "timestamptz",
    nullable: true,
  })
  resetTokenExpiresAt?: Date | null;

  @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
  consumedAt?: Date | null;

  @Column({ name: "invalidated_at", type: "timestamptz", nullable: true })
  invalidatedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
