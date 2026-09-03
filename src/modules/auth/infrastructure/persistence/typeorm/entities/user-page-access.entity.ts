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
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

@Entity("tb_user_page_access")
@Index(["idUsers", "pageKey"], { unique: true })
export class UserPageAccessEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_user_page_access" })
  idUserPageAccess!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "idtb_users" })
  user!: UserEntity;

  @Column({
    name: "page_key",
    type: "enum",
    enum: PageAccessKey,
  })
  pageKey!: PageAccessKey;

  @Column({ name: "allowed", type: "boolean" })
  allowed!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
