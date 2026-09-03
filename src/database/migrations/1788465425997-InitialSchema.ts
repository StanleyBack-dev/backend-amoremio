import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1788465425997 implements MigrationInterface {
  name = "InitialSchema1788465425997";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "tb_stores" ("idtb_stores" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "legal_name" character varying(160), "cnpj" character varying(14), "whatsapp" character varying(20), "email" character varying(160), "instagram" character varying(80), "ifood_url" character varying(300), "food99_url" character varying(300), "status" boolean NOT NULL DEFAULT true, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cbfc61561869f03a4744b5ad279" PRIMARY KEY ("idtb_stores"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_users_group_enum" AS ENUM('USER', 'ADMIN', 'ADMIN_MASTER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_users" ("idtb_users" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "url_avatar" character varying, "status" boolean NOT NULL DEFAULT true, "group" "public"."tb_users_group_enum" NOT NULL DEFAULT 'USER', "inactivated_at" TIMESTAMP WITH TIME ZONE, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_142ce3112f446974f1c96a5d3ff" UNIQUE ("email"), CONSTRAINT "PK_584c46109e65c8471a151d97829" PRIMARY KEY ("idtb_users"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_suppliers" ("idtb_suppliers" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "name" character varying(160) NOT NULL, "phone" character varying(40), "email" character varying(160), "address" character varying(255), "instagram" character varying(80), "document" character varying(40), "notes" text, "status" boolean NOT NULL DEFAULT true, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_supplier_store_name" UNIQUE ("idtb_stores", "name"), CONSTRAINT "PK_c606069ea57588b586e0023da8a" PRIMARY KEY ("idtb_suppliers"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f528ec1a1e112d34fbf99f5567" ON "tb_suppliers" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_store_memberships_role_enum" AS ENUM('DONO', 'GERENTE', 'FUNCIONARIO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_store_memberships" ("idtb_store_memberships" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "idtb_users" uuid NOT NULL, "role" "public"."tb_store_memberships_role_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_store_membership_store_user" UNIQUE ("idtb_stores", "idtb_users"), CONSTRAINT "PK_27aab3cb4c41ecb6243af209a19" PRIMARY KEY ("idtb_store_memberships"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31e5d547562300297bb04fc0e3" ON "tb_store_memberships" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6d5621a73113a7d2f66c1a30a" ON "tb_store_memberships" ("idtb_users") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_sessions" ("idtb_sessions" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_users" uuid NOT NULL, "refresh_token" character varying NOT NULL, "ip_address" character varying, "user_agent" character varying, "session_active" boolean NOT NULL DEFAULT true, "refresh_token_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "last_used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_38eed448826e418a2c9c3fffd61" UNIQUE ("refresh_token"), CONSTRAINT "PK_e6fa6f6460e76547621f6a013bf" PRIMARY KEY ("idtb_sessions"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6572595082612eca75a844c243" ON "tb_sessions" ("idtb_users") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_sales_orders_status_enum" AS ENUM('ABERTA', 'CONFIRMADA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_sales_orders_sales_channel_enum" AS ENUM('BALCAO', 'IFOOD', 'RAPPI', 'FOOD_99', 'UBER_EATS', 'AIQFOME', 'WHATSAPP', 'TELEFONE', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_sales_orders_discount_mode_enum" AS ENUM('VALOR', 'PERCENTUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_sales_orders" ("idtb_sales_orders" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "customer_name" character varying(160), "order_date" date NOT NULL, "status" "public"."tb_sales_orders_status_enum" NOT NULL DEFAULT 'ABERTA', "sales_channel" "public"."tb_sales_orders_sales_channel_enum" NOT NULL DEFAULT 'BALCAO', "commission_percent" numeric(5,2) NOT NULL DEFAULT '0', "commission_amount" numeric(12,2) NOT NULL DEFAULT '0', "net_total" numeric(12,2) NOT NULL DEFAULT '0', "discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_mode" "public"."tb_sales_orders_discount_mode_enum" NOT NULL DEFAULT 'VALOR', "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "items_subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_by_user_id" uuid NOT NULL, "confirmed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f807cd5eb20a2682d6449bf95c9" PRIMARY KEY ("idtb_sales_orders"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04be43eb0018493fdb53d5b81f" ON "tb_sales_orders" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_sales_order_items_product_kind_enum" AS ENUM('INSUMO', 'PRODUTO_FINAL', 'REVENDA', 'INTERMEDIARIO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_sales_order_items" ("idtb_sales_order_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_sales_orders" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "product_kind" "public"."tb_sales_order_items_product_kind_enum" NOT NULL DEFAULT 'REVENDA', "quantity" numeric(14,3) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e10cb1f35b640dbb51324fbafba" PRIMARY KEY ("idtb_sales_order_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_74ae6df01711c7868f166672ca" ON "tb_sales_order_items" ("idtb_sales_orders") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_purchases_status_enum" AS ENUM('RASCUNHO', 'FINALIZADA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_purchases_discount_mode_enum" AS ENUM('VALOR', 'PERCENTUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_purchases" ("idtb_purchases" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "supplier_name" character varying(160), "purchase_date" date NOT NULL, "status" "public"."tb_purchases_status_enum" NOT NULL DEFAULT 'RASCUNHO', "freight_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_mode" "public"."tb_purchases_discount_mode_enum" NOT NULL DEFAULT 'VALOR', "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "items_subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_by_user_id" uuid NOT NULL, "finalized_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1472e1ef6011df7d5e55fbac9aa" PRIMARY KEY ("idtb_purchases"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_791a8c9b336d58f989aa6951a0" ON "tb_purchases" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_purchase_items" ("idtb_purchase_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_purchases" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "purchased_quantity" numeric(14,3) NOT NULL, "purchased_unit" character varying(40) NOT NULL, "conversion_factor" numeric(14,4) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL, "base_quantity" numeric(14,4) NOT NULL DEFAULT '0', "effective_unit_cost" numeric(16,6) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8e51566d06bf190cff5fefccb7f" PRIMARY KEY ("idtb_purchase_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_453d1b8fb90a040659d8e0183d" ON "tb_purchase_items" ("idtb_purchases") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_recipes" ("idtb_recipes" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "idtb_output_product" uuid NOT NULL, "output_product_name" character varying(160) NOT NULL, "name" character varying(160) NOT NULL, "yield_quantity" numeric(14,3) NOT NULL DEFAULT '0', "yield_unit" character varying(40) NOT NULL, "labor_cost" numeric(12,2) NOT NULL DEFAULT '0', "overhead_cost" numeric(12,2) NOT NULL DEFAULT '0', "status" boolean NOT NULL DEFAULT true, "notes" text, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_recipe_store_output" UNIQUE ("idtb_stores", "idtb_output_product"), CONSTRAINT "PK_f450c1a6f006b91608ee7255f05" PRIMARY KEY ("idtb_recipes"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a25b105b49741afa8c50b50e42" ON "tb_recipes" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_recipe_items" ("idtb_recipe_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_recipes" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit" character varying(40) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_54a4f0f72bf52a1d10f26d5006f" PRIMARY KEY ("idtb_recipe_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_225b8243c9553fd83c53ace235" ON "tb_recipe_items" ("idtb_recipes") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_production_orders_status_enum" AS ENUM('RASCUNHO', 'CONCLUIDA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_production_orders" ("idtb_production_orders" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "idtb_recipes" uuid NOT NULL, "recipe_name" character varying(160) NOT NULL, "idtb_output_product" uuid NOT NULL, "output_product_name" character varying(160) NOT NULL, "production_date" date NOT NULL, "status" "public"."tb_production_orders_status_enum" NOT NULL DEFAULT 'RASCUNHO', "batches" numeric(14,3) NOT NULL DEFAULT '1', "planned_output_quantity" numeric(14,3) NOT NULL DEFAULT '0', "actual_output_quantity" numeric(14,3) NOT NULL DEFAULT '0', "labor_cost" numeric(12,2) NOT NULL DEFAULT '0', "overhead_cost" numeric(12,2) NOT NULL DEFAULT '0', "inputs_cost" numeric(14,4) NOT NULL DEFAULT '0', "total_cost" numeric(14,4) NOT NULL DEFAULT '0', "output_unit_cost" numeric(14,4) NOT NULL DEFAULT '0', "notes" text, "created_by_user_id" uuid NOT NULL, "concluded_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_471fe23c6aed3ddc543a64ff2af" PRIMARY KEY ("idtb_production_orders"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05d5551ef65286d3a75d9a26b2" ON "tb_production_orders" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_production_order_items" ("idtb_production_order_items" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_production_orders" uuid NOT NULL, "idtb_products" uuid NOT NULL, "product_name" character varying(160) NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit" character varying(40) NOT NULL, "unit_cost_at_consumption" numeric(16,6) NOT NULL DEFAULT '0', "line_cost" numeric(14,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_328e257a9512908161e98b4aecf" PRIMARY KEY ("idtb_production_order_items"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f185e497c778f7bf15679d9ea4" ON "tb_production_order_items" ("idtb_production_orders") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_stock_movements_type_enum" AS ENUM('ENTRADA_COMPRA', 'SAIDA_VENDA', 'SAIDA_PRODUCAO', 'ENTRADA_PRODUCAO', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'PERDA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_stock_movements" ("idtb_stock_movements" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "idtb_products" uuid NOT NULL, "type" "public"."tb_stock_movements_type_enum" NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_cost" numeric(16,6) NOT NULL, "resulting_quantity" numeric(14,3) NOT NULL, "resulting_average_cost" numeric(16,6) NOT NULL, "source_type" character varying(40), "source_id" uuid, "note" character varying(255), "created_by_user_id" uuid NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_97263989e699f12306ff2715a0e" PRIMARY KEY ("idtb_stock_movements"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bf6e3398d6c4089a47ab0ec9c" ON "tb_stock_movements" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deb97303a52b1c1829d9a29dee" ON "tb_stock_movements" ("idtb_products") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_products_kind_enum" AS ENUM('INSUMO', 'PRODUTO_FINAL', 'REVENDA', 'INTERMEDIARIO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_products_unit_enum" AS ENUM('UN', 'KG', 'G', 'L', 'ML', 'CX', 'FARDO', 'PACOTE', 'DUZIA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_products_packaging_unit_enum" AS ENUM('UNIDADE', 'PACOTE', 'CAIXA', 'FARDO', 'SACO', 'GARRAFA', 'LATA', 'POTE', 'DUZIA', 'BANDEJA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_products" ("idtb_products" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "name" character varying(160) NOT NULL, "sku" character varying(60), "description" text, "brand" character varying(120), "kind" "public"."tb_products_kind_enum" NOT NULL DEFAULT 'INSUMO', "unit" "public"."tb_products_unit_enum" NOT NULL, "packaging_unit" "public"."tb_products_packaging_unit_enum" NOT NULL DEFAULT 'UNIDADE', "pack_size" numeric(14,3) NOT NULL DEFAULT '1', "sale_price" numeric(12,2), "status" boolean NOT NULL DEFAULT true, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_product_store_sku" UNIQUE ("idtb_stores", "sku"), CONSTRAINT "UQ_product_store_name_brand" UNIQUE ("idtb_stores", "name", "brand"), CONSTRAINT "PK_ff7ec72eb5b919ca7dbae2860cb" PRIMARY KEY ("idtb_products"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba6fa668aa60ee70b3fcdd7875" ON "tb_products" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_product_store_name_no_brand" ON "tb_products" ("idtb_stores", "name") WHERE "brand" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_stock_items" ("idtb_products" uuid NOT NULL, "idtb_stores" uuid NOT NULL, "quantity_on_hand" numeric(14,3) NOT NULL DEFAULT '0', "average_cost" numeric(16,6) NOT NULL DEFAULT '0', "reorder_point" numeric(14,3), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2700f8aa9103adddf29a6cba350" PRIMARY KEY ("idtb_products"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0a5b5841c298635b61c372255" ON "tb_stock_items" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_terms_acceptances" ("idtb_terms_acceptances" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_users" uuid NOT NULL, "terms_version" character varying NOT NULL, "ip_address" character varying, "user_agent" character varying, "accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_90a494ef3a99c587eab3738337a" PRIMARY KEY ("idtb_terms_acceptances"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72c9861b1ed8309ef1119ae04a" ON "tb_terms_acceptances" ("idtb_users") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_brands" ("idtb_brands" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_stores" uuid NOT NULL, "name" character varying(120) NOT NULL, "status" boolean NOT NULL DEFAULT true, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_brand_store_name" UNIQUE ("idtb_stores", "name"), CONSTRAINT "PK_ac9d866c2819467966b3b54611a" PRIMARY KEY ("idtb_brands"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a5ca6041e54e4390884e70021" ON "tb_brands" ("idtb_stores") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_user_page_access_page_key_enum" AS ENUM('DASHBOARD', 'DEBTS', 'DEBTS_STATEMENT', 'INCOMES', 'PAYMENTS', 'INCOME_RECEIPTS', 'CREDIT_CARDS', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_user_page_access" ("idtb_user_page_access" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_users" uuid NOT NULL, "page_key" "public"."tb_user_page_access_page_key_enum" NOT NULL, "allowed" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a688d9705e91693087e8fdfd864" PRIMARY KEY ("idtb_user_page_access"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53b48f387facb93eecfce45ffc" ON "tb_user_page_access" ("idtb_users", "page_key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tb_auth_verification_codes_purpose_enum" AS ENUM('PASSWORD_RECOVERY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_auth_verification_codes" ("idtb_auth_verification_codes" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_users" uuid NOT NULL, "purpose" "public"."tb_auth_verification_codes_purpose_enum" NOT NULL, "target_email" character varying NOT NULL, "code_hash" character varying NOT NULL, "attempt_count" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '5', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "verified_at" TIMESTAMP WITH TIME ZONE, "reset_token" character varying, "reset_token_expires_at" TIMESTAMP WITH TIME ZONE, "consumed_at" TIMESTAMP WITH TIME ZONE, "invalidated_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b7ecff340e03ce363bac895addb" PRIMARY KEY ("idtb_auth_verification_codes"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c65d60359cefe290bff1e2b418" ON "tb_auth_verification_codes" ("target_email", "purpose") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dadd84238ad3808cfcfe1cafd" ON "tb_auth_verification_codes" ("idtb_users", "purpose") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tb_auth_credentials" ("idtb_auth_credentials" uuid NOT NULL DEFAULT uuid_generate_v4(), "idtb_users" uuid NOT NULL, "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "must_change_password" boolean NOT NULL DEFAULT true, "onboarding_tour_completed" boolean NOT NULL DEFAULT false, "terms_accepted_at" TIMESTAMP WITH TIME ZONE, "terms_accepted_version" character varying, "temporary_password_created_at" TIMESTAMP WITH TIME ZONE, "password_changed_at" TIMESTAMP WITH TIME ZONE, "last_login_at" TIMESTAMP WITH TIME ZONE, "failed_login_attempts" integer NOT NULL DEFAULT '0', "lock_until" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a073fdeaf89bc09ed6994317f10" UNIQUE ("idtb_users"), CONSTRAINT "UQ_80f743f0fa650689c46435942c7" UNIQUE ("username"), CONSTRAINT "REL_a073fdeaf89bc09ed6994317f1" UNIQUE ("idtb_users"), CONSTRAINT "PK_d238112c3da8c49af82df0b128d" PRIMARY KEY ("idtb_auth_credentials"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a073fdeaf89bc09ed6994317f1" ON "tb_auth_credentials" ("idtb_users") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_sessions" ADD CONSTRAINT "FK_6572595082612eca75a844c243d" FOREIGN KEY ("idtb_users") REFERENCES "tb_users"("idtb_users") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_user_page_access" ADD CONSTRAINT "FK_f5ff692447d58d77d232dbe7918" FOREIGN KEY ("idtb_users") REFERENCES "tb_users"("idtb_users") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_auth_verification_codes" ADD CONSTRAINT "FK_1e88226ca4813c057a25ab6e9c0" FOREIGN KEY ("idtb_users") REFERENCES "tb_users"("idtb_users") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" ADD CONSTRAINT "FK_a073fdeaf89bc09ed6994317f10" FOREIGN KEY ("idtb_users") REFERENCES "tb_users"("idtb_users") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" DROP CONSTRAINT "FK_a073fdeaf89bc09ed6994317f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_auth_verification_codes" DROP CONSTRAINT "FK_1e88226ca4813c057a25ab6e9c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_user_page_access" DROP CONSTRAINT "FK_f5ff692447d58d77d232dbe7918"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_sessions" DROP CONSTRAINT "FK_6572595082612eca75a844c243d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a073fdeaf89bc09ed6994317f1"`,
    );
    await queryRunner.query(`DROP TABLE "tb_auth_credentials"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8dadd84238ad3808cfcfe1cafd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c65d60359cefe290bff1e2b418"`,
    );
    await queryRunner.query(`DROP TABLE "tb_auth_verification_codes"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_auth_verification_codes_purpose_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_53b48f387facb93eecfce45ffc"`,
    );
    await queryRunner.query(`DROP TABLE "tb_user_page_access"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_user_page_access_page_key_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a5ca6041e54e4390884e70021"`,
    );
    await queryRunner.query(`DROP TABLE "tb_brands"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72c9861b1ed8309ef1119ae04a"`,
    );
    await queryRunner.query(`DROP TABLE "tb_terms_acceptances"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0a5b5841c298635b61c372255"`,
    );
    await queryRunner.query(`DROP TABLE "tb_stock_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_product_store_name_no_brand"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba6fa668aa60ee70b3fcdd7875"`,
    );
    await queryRunner.query(`DROP TABLE "tb_products"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_products_packaging_unit_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tb_products_unit_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tb_products_kind_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_deb97303a52b1c1829d9a29dee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8bf6e3398d6c4089a47ab0ec9c"`,
    );
    await queryRunner.query(`DROP TABLE "tb_stock_movements"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_stock_movements_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f185e497c778f7bf15679d9ea4"`,
    );
    await queryRunner.query(`DROP TABLE "tb_production_order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05d5551ef65286d3a75d9a26b2"`,
    );
    await queryRunner.query(`DROP TABLE "tb_production_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_production_orders_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_225b8243c9553fd83c53ace235"`,
    );
    await queryRunner.query(`DROP TABLE "tb_recipe_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a25b105b49741afa8c50b50e42"`,
    );
    await queryRunner.query(`DROP TABLE "tb_recipes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_453d1b8fb90a040659d8e0183d"`,
    );
    await queryRunner.query(`DROP TABLE "tb_purchase_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_791a8c9b336d58f989aa6951a0"`,
    );
    await queryRunner.query(`DROP TABLE "tb_purchases"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_purchases_discount_mode_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tb_purchases_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_74ae6df01711c7868f166672ca"`,
    );
    await queryRunner.query(`DROP TABLE "tb_sales_order_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_sales_order_items_product_kind_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04be43eb0018493fdb53d5b81f"`,
    );
    await queryRunner.query(`DROP TABLE "tb_sales_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_sales_orders_discount_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tb_sales_orders_sales_channel_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tb_sales_orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6572595082612eca75a844c243"`,
    );
    await queryRunner.query(`DROP TABLE "tb_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6d5621a73113a7d2f66c1a30a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_31e5d547562300297bb04fc0e3"`,
    );
    await queryRunner.query(`DROP TABLE "tb_store_memberships"`);
    await queryRunner.query(
      `DROP TYPE "public"."tb_store_memberships_role_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f528ec1a1e112d34fbf99f5567"`,
    );
    await queryRunner.query(`DROP TABLE "tb_suppliers"`);
    await queryRunner.query(`DROP TABLE "tb_users"`);
    await queryRunner.query(`DROP TYPE "public"."tb_users_group_enum"`);
    await queryRunner.query(`DROP TABLE "tb_stores"`);
  }
}
