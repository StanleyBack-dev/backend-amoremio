import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurchasedToShoppingListItem1789326137807 implements MigrationInterface {
  name = "AddPurchasedToShoppingListItem1789326137807";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_shopping_list_items" ADD "purchased" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_shopping_list_items" DROP COLUMN "purchased"`,
    );
  }
}
