import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Entity("tb_auth_credentials")
export class AuthCredentialEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_auth_credentials" })
  idAuthCredentials!: string;

  @Column({ name: "idtb_users", type: "uuid", unique: true })
  @Index()
  idUsers!: string;

  @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "idtb_users" })
  user!: UserEntity;

  @Column({ unique: true })
  username!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ name: "must_change_password", default: true })
  mustChangePassword!: boolean;

  @Column({ name: "onboarding_tour_completed", default: false })
  onboardingTourCompleted!: boolean;

  @Column({ name: "terms_accepted_at", type: "timestamptz", nullable: true })
  termsAcceptedAt?: Date;

  // The exact CURRENT_TERMS_VERSION accepted — compared against the live
  // constant so a content update makes previously-accepted users re-accept,
  // without needing a join to tb_terms_acceptances on every guarded request.
  @Column({
    name: "terms_accepted_version",
    type: "varchar",
    nullable: true,
  })
  termsAcceptedVersion?: string | null;

  @Column({
    name: "temporary_password_created_at",
    type: "timestamptz",
    nullable: true,
  })
  temporaryPasswordCreatedAt?: Date;

  @Column({ name: "password_changed_at", type: "timestamptz", nullable: true })
  passwordChangedAt?: Date;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt?: Date;

  @Column({ name: "failed_login_attempts", type: "int", default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: "lock_until", type: "timestamptz", nullable: true })
  lockUntil?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
