import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Entity("tb_sessions")
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_sessions" })
  idUsersSessions!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "idtb_users" })
  user!: UserEntity;

  @Column({ name: "idtb_users", type: "uuid" })
  @Index()
  idUsers!: string;

  @Column({ name: "refresh_token", unique: true })
  refreshToken!: string;

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @Column({ name: "session_active", type: "boolean", default: true })
  sessionActive!: boolean;

  @Column({ name: "refresh_token_expires_at", type: "timestamptz" })
  refreshTokenExpiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt?: Date;

  @Column({ name: "last_used_at", type: "timestamptz", nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
