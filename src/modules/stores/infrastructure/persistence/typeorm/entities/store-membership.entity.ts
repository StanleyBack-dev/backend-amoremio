import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@Entity("tb_store_memberships")
@Unique("UQ_store_membership_store_user", ["idStore", "idUsers"])
export class StoreMembershipEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_store_memberships" })
  idStoreMembership!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  @Index()
  idUsers!: string;

  @Column({ type: "enum", enum: StoreRole })
  role!: StoreRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
