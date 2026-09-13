import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateShoppingList1789260720833 implements MigrationInterface {
  name = "CreateShoppingList1789260720833";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tb_shopping_list_items" ("idtb_shopping_list_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_shopping_lists" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "unit" character varying(10) NOT NULL, "desired_quantity" numeric(14,3) NOT NULL, "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de637ff3831fae199c224df668d" PRIMARY KEY ("idtb_shopping_list_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9b02f93f79537bee3a72260b5" ON "tb_shopping_list_items" ("idtb_shopping_lists") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_shopping_lists_status_enum" AS ENUM('ABERTA', 'CONVERTIDA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_shopping_lists" ("idtb_shopping_lists" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "name" character varying(160), "status" "public"."tb_shopping_lists_status_enum" NOT NULL DEFAULT 'ABERTA', "notes" text, "converted_to_purchase_id" uuid, "created_by_user_id" uuid NOT NULL, "converted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bd1c5cd47f1cfafc25ab2d7caee" PRIMARY KEY ("idtb_shopping_lists"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98bee2d835b35a16bfae2f53f4" ON "tb_shopping_lists" ("idtb_stores") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98bee2d835b35a16bfae2f53f4"`,
    );
    await queryRunner.query(`DROP TABLE "tb_shopping_lists"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_shopping_lists_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9b02f93f79537bee3a72260b5"`,
    );
    await queryRunner.query(`DROP TABLE "tb_shopping_list_items"`);
  }
}
