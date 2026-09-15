import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_channel_event_items")
export class ChannelEventItemEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_channel_event_items" })
  idChannelEventItem!: string;

  @Column({ name: "idtb_channel_events", type: "uuid" })
  @Index()
  idChannelEvent!: string;

  @Column({ name: "external_product_id", type: "varchar", length: 120 })
  externalProductId!: string;

  @Column({ name: "external_product_name", length: 160 })
  externalProductName!: string;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  @Column({ name: "unit_price", type: "numeric", precision: 12, scale: 2 })
  unitPrice!: string;

  // Filled in once a tb_channel_product_mappings row resolves this
  // external_product_id — null means this item is still blocking its event.
  @Column({ name: "idtb_products", type: "uuid", nullable: true })
  idProduct?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
