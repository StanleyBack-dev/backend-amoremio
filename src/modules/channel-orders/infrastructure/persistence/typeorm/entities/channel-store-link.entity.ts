import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";

// Resolves an inbound webhook's platform-side shop id (99Food's
// app_shop_id, iFood's merchantId, ...) back to our idtb_stores. Set once
// per store/channel via src/scripts/link-channel-store.script.ts — there's
// no UI for this yet, it's a one-time setup step done when the store's
// sandbox/production app is created on the platform's side.
@Entity("tb_channel_store_links")
@Unique("UQ_channel_store_link_channel_external_shop", [
  "channel",
  "externalShopId",
])
@Unique("UQ_channel_store_link_store_channel", ["idStore", "channel"])
export class ChannelStoreLinkEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_channel_store_links" })
  idChannelStoreLink!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  idStore!: string;

  @Column({ type: "enum", enum: SalesChannel })
  channel!: SalesChannel;

  @Column({ name: "external_shop_id", type: "varchar", length: 120 })
  externalShopId!: string;

  // Cached platform API token for this shop (99Food's /auth/authtoken/get)
  // — see NinetyNineFoodAuthService, which refetches once expired.
  @Column({ name: "auth_token", type: "text", nullable: true })
  authToken?: string | null;

  @Column({
    name: "auth_token_expires_at",
    type: "timestamptz",
    nullable: true,
  })
  authTokenExpiresAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
