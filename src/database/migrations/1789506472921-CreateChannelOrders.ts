import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChannelOrders1789506472921 implements MigrationInterface {
  name = "CreateChannelOrders1789506472921";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tb_channel_events_channel_enum" AS ENUM('BALCAO', 'IFOOD', 'RAPPI', 'FOOD_99', 'UBER_EATS', 'AIQFOME', 'WHATSAPP', 'TELEFONE', 'FACULDADE', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_channel_events_status_enum" AS ENUM('PENDING_MAPPING', 'IMPORTED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_channel_events" ("idtb_channel_events" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "channel" "public"."tb_channel_events_channel_enum" NOT NULL, "external_order_id" character varying(120) NOT NULL, "customer_name" character varying(160) NOT NULL, "customer_phone" character varying(40), "notes" text, "raw_payload" jsonb NOT NULL, "status" "public"."tb_channel_events_status_enum" NOT NULL DEFAULT 'PENDING_MAPPING', "idtb_sales_orders" uuid, "error_detail" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_channel_event_store_channel_external_order" UNIQUE ("idtb_stores", "channel", "external_order_id"), CONSTRAINT "PK_channel_events" PRIMARY KEY ("idtb_channel_events"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_events_store" ON "tb_channel_events" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_events_status" ON "tb_channel_events" ("status") `,
    );

    await queryRunner.query(
      `CREATE TABLE "tb_channel_event_items" ("idtb_channel_event_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_channel_events" uuid NOT NULL, "external_product_id" character varying(120) NOT NULL, "external_product_name" character varying(160) NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "idtb_products" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_channel_event_items" PRIMARY KEY ("idtb_channel_event_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_event_items_event" ON "tb_channel_event_items" ("idtb_channel_events") `,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."tb_channel_product_mappings_channel_enum" AS ENUM('BALCAO', 'IFOOD', 'RAPPI', 'FOOD_99', 'UBER_EATS', 'AIQFOME', 'WHATSAPP', 'TELEFONE', 'FACULDADE', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_channel_product_mappings" ("idtb_channel_product_mappings" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "channel" "public"."tb_channel_product_mappings_channel_enum" NOT NULL, "external_product_id" character varying(120) NOT NULL, "external_product_name" character varying(160) NOT NULL, "idtb_products" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_channel_mapping_store_channel_external_product" UNIQUE ("idtb_stores", "channel", "external_product_id"), CONSTRAINT "PK_channel_product_mappings" PRIMARY KEY ("idtb_channel_product_mappings"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_product_mappings_store" ON "tb_channel_product_mappings" ("idtb_stores") `,
    );

    // Resolves an inbound webhook's platform-side shop id (e.g. 99Food's
    // app_shop_id) back to our idtb_stores — set once per store/channel via
    // src/scripts/link-channel-store.script.ts, not through any UI yet.
    await queryRunner.query(
      `CREATE TYPE "public"."tb_channel_store_links_channel_enum" AS ENUM('BALCAO', 'IFOOD', 'RAPPI', 'FOOD_99', 'UBER_EATS', 'AIQFOME', 'WHATSAPP', 'TELEFONE', 'FACULDADE', 'OUTRO')`,
    );
    // auth_token/auth_token_expires_at cache the platform's per-shop API
    // token (99Food's /auth/authtoken/get) — fetched lazily and refetched
    // once expired, see NinetyNineFoodAuthService.
    await queryRunner.query(
      `CREATE TABLE "tb_channel_store_links" ("idtb_channel_store_links" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "channel" "public"."tb_channel_store_links_channel_enum" NOT NULL, "external_shop_id" character varying(120) NOT NULL, "auth_token" text, "auth_token_expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_channel_store_link_channel_external_shop" UNIQUE ("channel", "external_shop_id"), CONSTRAINT "UQ_channel_store_link_store_channel" UNIQUE ("idtb_stores", "channel"), CONSTRAINT "PK_channel_store_links" PRIMARY KEY ("idtb_channel_store_links"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tb_channel_store_links"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_channel_store_links_channel_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_channel_product_mappings_store"`,
    );
    await queryRunner.query(`DROP TABLE "tb_channel_product_mappings"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_channel_product_mappings_channel_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_channel_event_items_event"`,
    );
    await queryRunner.query(`DROP TABLE "tb_channel_event_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_channel_events_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_channel_events_store"`);
    await queryRunner.query(`DROP TABLE "tb_channel_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_channel_events_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tb_channel_events_channel_enum"`,
    );
  }
}
