import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@Entity("tb_users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_users" })
  idUsers!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "url_avatar", nullable: true })
  urlAvatar?: string;

  @Column({ default: true })
  status!: boolean;

  @Column({
    type: "enum",
    enum: UserGroup,
    default: UserGroup.USER,
  })
  group!: UserGroup;

  @Column({ name: "inactivated_at", type: "timestamptz", nullable: true })
  inactivatedAt?: Date | null;

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
