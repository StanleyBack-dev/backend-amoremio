import { MigrationInterface, QueryRunner } from "typeorm";

// One-off data fix: five confirmed WhatsApp orders were really purchases by the
// owners (PESSOAL) and by relatives (FAMILIA). Kept apart from the enum
// migration because Postgres cannot use a new enum value in the transaction
// that created it. Rows are matched on customer, date, total and current channel,
// so it is a no-op wherever they do not exist.
const RECLASSIFICATIONS = [
  {
    channel: "PESSOAL",
    customer: "Stanley Rodrigues",
    date: "2026-09-20",
    total: "20.00",
  },
  {
    channel: "PESSOAL",
    customer: "Sulamita Nunes",
    date: "2026-09-20",
    total: "15.00",
  },
  {
    channel: "FAMILIA",
    customer: "Joselma",
    date: "2026-09-13",
    total: "55.00",
  },
  {
    channel: "FAMILIA",
    customer: "Anna Luiza",
    date: "2026-09-13",
    total: "35.00",
  },
  {
    channel: "FAMILIA",
    customer: "Eliana",
    date: "2026-09-13",
    total: "35.00",
  },
];

export class ReclassifyWhatsappOrdersToPessoalFamilia1789800000001 implements MigrationInterface {
  name = "ReclassifyWhatsappOrdersToPessoalFamilia1789800000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const row of RECLASSIFICATIONS) {
      await queryRunner.query(
        `UPDATE "tb_sales_orders"
            SET "sales_channel" = $1
          WHERE "sales_channel" = 'WHATSAPP'
            AND "customer_name" = $2
            AND "order_date" = $3
            AND "net_total" = $4`,
        [row.channel, row.customer, row.date, row.total],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const row of RECLASSIFICATIONS) {
      await queryRunner.query(
        `UPDATE "tb_sales_orders"
            SET "sales_channel" = 'WHATSAPP'
          WHERE "sales_channel" = $1
            AND "customer_name" = $2
            AND "order_date" = $3
            AND "net_total" = $4`,
        [row.channel, row.customer, row.date, row.total],
      );
    }
  }
}
