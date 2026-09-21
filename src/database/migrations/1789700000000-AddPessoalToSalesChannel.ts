import { MigrationInterface, QueryRunner } from "typeorm";

// SalesChannel.PESSOAL (purchases the store owners make for themselves) was
// added to the enum, so every Postgres enum built from it needs the new value.
const ENUMS = [
  "tb_sales_orders_sales_channel_enum",
  "tb_channel_events_channel_enum",
  "tb_channel_product_mappings_channel_enum",
  "tb_channel_store_links_channel_enum",
];

export class AddPessoalToSalesChannel1789700000000 implements MigrationInterface {
  name = "AddPessoalToSalesChannel1789700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      await queryRunner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'PESSOAL' BEFORE 'OUTRO'`,
      );
    }
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; leaving it in place is harmless.
  }
}
