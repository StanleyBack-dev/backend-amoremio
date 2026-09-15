import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";

// The "dictionary" that lets an incoming platform order resolve its line
// items to real products — one row per external menu item, per store.
@Entity("tb_channel_product_mappings")
@Unique("UQ_channel_mapping_store_channel_external_product", [
  "idStore",
  "channel",
  "externalProductId",
])
export class ChannelProductMappingEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_channel_product_mappings" })
  idChannelProductMapping!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ type: "enum", enum: SalesChannel })
  channel!: SalesChannel;

  @Column({ name: "external_product_id", type: "varchar", length: 120 })
  externalProductId!: string;

  @Column({ name: "external_product_name", length: 160 })
  externalProductName!: string;

  @Column({ name: "idtb_products", type: "uuid", nullable: true })
  idProduct?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
