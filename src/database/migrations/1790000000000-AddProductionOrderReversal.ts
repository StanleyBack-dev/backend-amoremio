import { MigrationInterface, QueryRunner } from "typeorm";

// Reversal of a completed production order: a new ESTORNADA status with who /
// when / why, and the two ledger movement types that undo its stock entries.
export class AddProductionOrderReversal1790000000000 implements MigrationInterface {
  name = "AddProductionOrderReversal1790000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tb_production_orders_status_enum" ADD VALUE IF NOT EXISTS 'ESTORNADA' AFTER 'CONCLUIDA'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tb_stock_movements_type_enum" ADD VALUE IF NOT EXISTS 'ESTORNO_SAIDA_PRODUCAO' AFTER 'ENTRADA_PRODUCAO'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tb_stock_movements_type_enum" ADD VALUE IF NOT EXISTS 'ESTORNO_ENTRADA_PRODUCAO' AFTER 'ESTORNO_SAIDA_PRODUCAO'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" ADD COLUMN IF NOT EXISTS "reversed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" ADD COLUMN IF NOT EXISTS "reversed_by_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" ADD COLUMN IF NOT EXISTS "reversal_reason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" DROP COLUMN IF EXISTS "reversal_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" DROP COLUMN IF EXISTS "reversed_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_production_orders" DROP COLUMN IF EXISTS "reversed_at"`,
    );
    // Postgres cannot drop an enum value; leaving it in place is harmless.
  }
}
