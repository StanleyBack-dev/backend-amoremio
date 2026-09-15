/// <reference types="node" />
import { Client } from "pg";

// One-off admin tool: seeds a single "system" user (group ADMIN_MASTER, no
// usable password — it never logs in) used as createdByUserId for anything
// the channel-orders webhook pipeline creates automatically. ADMIN_MASTER
// bypasses per-store membership checks entirely (see
// StoreAuthorizationService.resolveContext), so this one row works across
// every store without needing a tb_store_memberships row per store.
//
// Idempotent: re-running finds the existing row by email and just prints
// its id instead of creating a duplicate.
//
// Usage (from backend-amoremio, with DB_* env vars set for the target DB):
//   npx ts-node -r tsconfig-paths/register src/scripts/seed-system-user.script.ts
//
// After it prints an id, set SYSTEM_USER_ID to that value in the target
// environment (Vercel project env vars / .env.development) — the
// channel-orders module refuses to promote any order until that's set.

const SYSTEM_USER_EMAIL = "integracao-canais@sistema.interno";
const SYSTEM_USER_NAME = "Integração de Canais (sistema)";

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
    const existing = await client.query<{ idtb_users: string }>(
      `SELECT "idtb_users" FROM tb_users WHERE email = $1`,
      [SYSTEM_USER_EMAIL],
    );
    if (existing.rows.length > 0) {
      console.log(
        `Usuário de sistema já existe: ${existing.rows[0].idtb_users}`,
      );
      return;
    }

    const inserted = await client.query<{ idtb_users: string }>(
      `INSERT INTO tb_users (name, email, status, "group")
       VALUES ($1, $2, true, 'ADMIN_MASTER')
       RETURNING "idtb_users"`,
      [SYSTEM_USER_NAME, SYSTEM_USER_EMAIL],
    );
    console.log(
      `Usuário de sistema criado: ${inserted.rows[0].idtb_users}\n` +
        `Defina SYSTEM_USER_ID=${inserted.rows[0].idtb_users} no ambiente.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
