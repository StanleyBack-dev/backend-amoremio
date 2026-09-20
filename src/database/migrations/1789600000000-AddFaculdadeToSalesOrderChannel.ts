import { MigrationInterface, QueryRunner } from "typeorm";

// SalesChannel.FACULDADE was added to the enum after the initial schema, so
// tb_sales_orders.sales_channel rejected it (the channel-orders tables already
// include it).
export class AddFaculdadeToSalesOrderChannel1789600000000 implements MigrationInterface {
  name = "AddFaculdadeToSalesOrderChannel1789600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tb_sales_orders_sales_channel_enum" ADD VALUE IF NOT EXISTS 'FACULDADE' BEFORE 'OUTRO'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; leaving it in place is harmless.
  }
}
