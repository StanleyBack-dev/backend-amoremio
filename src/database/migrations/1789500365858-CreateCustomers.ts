import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomers1789500365858 implements MigrationInterface {
  name = "CreateCustomers1789500365858";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tb_customers" ("idtb_customers" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "name" character varying(160) NOT NULL, "phone" character varying(40), "email" character varying(160), "address" character varying(255), "notes" text, "status" boolean NOT NULL DEFAULT true, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_customer_store_phone" UNIQUE ("idtb_stores", "phone"), CONSTRAINT "PK_customers" PRIMARY KEY ("idtb_customers"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_store" ON "tb_customers" ("idtb_stores") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_sales_orders" ADD "idtb_customers" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sales_orders_customer" ON "tb_sales_orders" ("idtb_customers") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sales_orders_customer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_sales_orders" DROP COLUMN "idtb_customers"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_customers_store"`);
    await queryRunner.query(`DROP TABLE "tb_customers"`);
  }
}
