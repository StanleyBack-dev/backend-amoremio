import { MigrationInterface, QueryRunner } from "typeorm";

// SalesChannel.FAMILIA and SalesChannel.TRABALHO were added to the enum, so
// every Postgres enum built from it needs the new values.
const ENUMS = [
  "tb_sales_orders_sales_channel_enum",
  "tb_channel_events_channel_enum",
  "tb_channel_product_mappings_channel_enum",
  "tb_channel_store_links_channel_enum",
];

export class AddFamiliaTrabalhoToSalesChannel1789800000000 implements MigrationInterface {
  name = "AddFamiliaTrabalhoToSalesChannel1789800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      await queryRunner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'FAMILIA' BEFORE 'OUTRO'`,
      );
      await queryRunner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'TRABALHO' BEFORE 'OUTRO'`,
      );
    }
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; leaving it in place is harmless.
  }
}
