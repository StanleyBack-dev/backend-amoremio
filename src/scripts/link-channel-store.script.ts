/// <reference types="node" />
import { Client } from "pg";

// One-off admin tool: links a store to its shop id on a delivery platform
// (99Food's app_shop_id, iFood's merchantId, ...) — this is what lets an
// inbound webhook figure out which of our stores it belongs to. There's no
// UI for this yet since it's a one-time setup done when the store's
// sandbox/production app is created on the platform's side.
//
// Usage (from backend-amoremio, with DB_* env vars set for the target DB):
//   npx ts-node -r tsconfig-paths/register src/scripts/link-channel-store.script.ts <idStore> <channel> <externalShopId>
//
// Example:
//   npx ts-node -r tsconfig-paths/register src/scripts/link-channel-store.script.ts 7c0e2313-f737-4769-9d7a-3e50345a2bc4 FOOD_99 7093

const [idStore, channel, externalShopId] = process.argv.slice(2);

if (!idStore || !channel || !externalShopId) {
  console.error(
    "Uso: link-channel-store.script.ts <idStore> <channel> <externalShopId>",
  );
  process.exit(1);
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  try {
    const store = await client.query(
      `SELECT name FROM tb_stores WHERE "idtb_stores" = $1`,
      [idStore],
    );
    if (store.rows.length === 0) {
      throw new Error(`Loja ${idStore} não encontrada.`);
    }

    await client.query(
      `INSERT INTO tb_channel_store_links ("idtb_stores", channel, external_shop_id)
       VALUES ($1, $2, $3)
       ON CONFLICT ("idtb_stores", channel)
       DO UPDATE SET external_shop_id = EXCLUDED.external_shop_id`,
      [idStore, channel, externalShopId],
    );

    console.log(
      `Loja "${store.rows[0].name}" vinculada ao canal ${channel} (external_shop_id=${externalShopId}).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
