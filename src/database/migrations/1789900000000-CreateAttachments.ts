import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttachments1789900000000 implements MigrationInterface {
  name = "CreateAttachments1789900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tb_attachments_owner_type_enum" AS ENUM('PRODUCT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_attachments_status_enum" AS ENUM('PENDING', 'READY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_attachments" ("idtb_attachments" uuid NOT NULL, "idtb_stores" uuid NOT NULL, "owner_type" "public"."tb_attachments_owner_type_enum" NOT NULL, "owner_id" uuid NOT NULL, "status" "public"."tb_attachments_status_enum" NOT NULL DEFAULT 'PENDING', "storage_key" character varying(512) NOT NULL, "thumbnail_key" character varying(512), "mime_type" character varying(64) NOT NULL, "size_bytes" integer NOT NULL, "width" integer, "height" integer, "checksum_sha256" character(64), "position" integer NOT NULL DEFAULT '0', "original_name" character varying(160) NOT NULL, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_34571b3a71394512ac51770ae9f" PRIMARY KEY ("idtb_attachments"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attachments_owner" ON "tb_attachments" ("idtb_stores", "owner_type", "owner_id", "position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attachments_status_created" ON "tb_attachments" ("status", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_attachments_status_created"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_attachments_owner"`);
    await queryRunner.query(`DROP TABLE "tb_attachments"`);
    await queryRunner.query(`DROP TYPE "public"."tb_attachments_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_attachments_owner_type_enum"`,
    );
  }
}
