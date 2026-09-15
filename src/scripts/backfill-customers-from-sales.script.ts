/// <reference types="node" />
import { Client } from "pg";

// One-off admin tool: backfills tb_customers from the free-text
// customer_name already sitting on tb_sales_orders, then links each order
// back to the row it created via idtb_customers. Orders that already have
// idtb_customers set are left untouched, and a name that matches an
// existing customer (same store, same normalized name) is reused instead
// of creating a duplicate — safe to re-run.
//
// Names are grouped per store, case/whitespace-insensitively (trimmed,
// internal whitespace collapsed, lowercased) — "Anna Luiza" and "anna
// luiza" land on the same customer. Real spelling variants ("Ana" vs
// "Anna") are NOT merged; check the dry-run output for near-duplicates
// before applying.
//
// Backfilled customers get no phone/email (that was never captured on the
// sales order) — fill it in later from the Clientes page, which is also
// what makes future phone-based dedupe kick in for this customer.
//
// Defaults to a dry run (prints what would be created/linked, changes
// nothing). Pass --apply to write.
//
// Usage (from backend-amoremio, with DB_* env vars set for the target DB):
//   npx ts-node -r tsconfig-paths/register src/scripts/backfill-customers-from-sales.script.ts
//   npx ts-node -r tsconfig-paths/register src/scripts/backfill-customers-from-sales.script.ts --apply

const APPLY = process.argv.includes("--apply");

function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function normalizeKey(idStore: string, name: string): string {
  return `${idStore}::${normalizeName(name).toLowerCase()}`;
}

interface OrderRow {
  idtb_sales_orders: string;
  idtb_stores: string;
  customer_name: string;
  created_by_user_id: string;
}

interface CustomerRow {
  idtb_customers: string;
  idtb_stores: string;
  name: string;
}

interface CustomerGroup {
  idStore: string;
  name: string;
  createdByUserId: string;
  orderIds: string[];
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  try {
    console.log(
      `\n${APPLY ? "APLICANDO (clientes serão criados e vendas vinculadas)" : "SIMULAÇÃO (dry-run, nada será alterado)"}\n`,
    );

    const { rows: orders } = await client.query<OrderRow>(
      `SELECT "idtb_sales_orders", "idtb_stores", customer_name, created_by_user_id
       FROM tb_sales_orders
       WHERE "idtb_customers" IS NULL
         AND customer_name IS NOT NULL
         AND trim(customer_name) <> ''
       ORDER BY "idtb_stores", created_at ASC`,
    );

    if (orders.length === 0) {
      console.log(
        "Nenhum pedido sem cliente vinculado encontrado. Nada a fazer.\n",
      );
      return;
    }

    const { rows: existingCustomers } = await client.query<CustomerRow>(
      `SELECT "idtb_customers", "idtb_stores", name FROM tb_customers`,
    );
    const existingByKey = new Map<string, CustomerRow>();
    for (const c of existingCustomers) {
      existingByKey.set(normalizeKey(c.idtb_stores, c.name), c);
    }

    // Group orders per store + normalized name — first order seen for a
    // name decides the display casing and the customer's createdByUserId.
    const groups = new Map<string, CustomerGroup>();
    for (const order of orders) {
      const key = normalizeKey(order.idtb_stores, order.customer_name);
      let group = groups.get(key);
      if (!group) {
        group = {
          idStore: order.idtb_stores,
          name: normalizeName(order.customer_name),
          createdByUserId: order.created_by_user_id,
          orderIds: [],
        };
        groups.set(key, group);
      }
      group.orderIds.push(order.idtb_sales_orders);
    }

    let toCreate = 0;
    let toReuse = 0;
    console.log(`Pedidos sem cliente vinculado: ${orders.length}`);
    console.log(
      `Nomes distintos (ignorando maiúsculas/espaços): ${groups.size}\n`,
    );
    for (const [key, group] of groups) {
      const existing = existingByKey.get(key);
      if (existing) {
        toReuse++;
        console.log(
          `  [existente] "${group.name}" -> ${group.orderIds.length} pedido(s)`,
        );
      } else {
        toCreate++;
        console.log(
          `  [novo]      "${group.name}" -> ${group.orderIds.length} pedido(s)`,
        );
      }
    }
    console.log(
      `\nResumo: ${toCreate} cliente(s) novo(s), ${toReuse} cliente(s) já existente(s) reaproveitado(s).\n`,
    );

    if (!APPLY) {
      console.log(
        "Nenhuma alteração foi feita. Rode de novo com --apply para executar de verdade.\n",
      );
      return;
    }

    // Inserts the customer if `key` isn't in existingByKey yet, otherwise
    // reuses it — either way returns a definite id, and records whether a
    // new row was created so the caller can tally it.
    async function resolveCustomerId(
      key: string,
      group: CustomerGroup,
    ): Promise<{ idCustomer: string; created: boolean }> {
      const existing = existingByKey.get(key);
      if (existing) {
        return { idCustomer: existing.idtb_customers, created: false };
      }
      const insert = await client.query<{ idtb_customers: string }>(
        `INSERT INTO tb_customers ("idtb_stores", name, status, created_by_user_id)
         VALUES ($1, $2, true, $3)
         RETURNING "idtb_customers"`,
        [group.idStore, group.name, group.createdByUserId],
      );
      const insertedRow = insert.rows[0];
      if (!insertedRow) {
        throw new Error(`INSERT RETURNING deu vazio para "${group.name}"`);
      }
      existingByKey.set(key, {
        idtb_customers: insertedRow.idtb_customers,
        idtb_stores: group.idStore,
        name: group.name,
      });
      return { idCustomer: insertedRow.idtb_customers, created: true };
    }

    await client.query("BEGIN");
    let created = 0;
    let linked = 0;
    for (const [key, group] of groups) {
      const { idCustomer, created: wasCreated } = await resolveCustomerId(
        key,
        group,
      );
      if (wasCreated) created++;
      const update = await client.query(
        `UPDATE tb_sales_orders SET "idtb_customers" = $1 WHERE "idtb_sales_orders" = ANY($2)`,
        [idCustomer, group.orderIds],
      );
      linked += update.rowCount ?? 0;
    }
    await client.query("COMMIT");
    console.log(
      `Concluído: ${created} cliente(s) criado(s), ${linked} pedido(s) vinculado(s).\n`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
