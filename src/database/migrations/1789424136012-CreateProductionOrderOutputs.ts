import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductionOrderOutputs1789424136012 implements MigrationInterface {
  name = "CreateProductionOrderOutputs1789424136012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tb_production_order_outputs" ("idtb_production_order_outputs" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_production_orders" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_cost" numeric(16,6) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_production_order_output_product" UNIQUE ("idtb_production_orders", "idtb_products"), CONSTRAINT "PK_production_order_outputs" PRIMARY KEY ("idtb_production_order_outputs"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_production_order_outputs_order" ON "tb_production_order_outputs" ("idtb_production_orders") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_production_order_output_extras" ("idtb_production_order_output_extras" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_production_order_outputs" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_cost_at_consumption" numeric(16,6) NOT NULL DEFAULT '0', "line_cost" numeric(14,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_production_order_output_extra_product" UNIQUE ("idtb_production_order_outputs", "idtb_products"), CONSTRAINT "PK_production_order_output_extras" PRIMARY KEY ("idtb_production_order_output_extras"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_production_order_output_extras_output" ON "tb_production_order_output_extras" ("idtb_production_order_outputs") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_production_order_output_extras_output"`,
    );
    await queryRunner.query(`DROP TABLE "tb_production_order_output_extras"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_production_order_outputs_order"`,
    );
    await queryRunner.query(`DROP TABLE "tb_production_order_outputs"`);
  }
}
