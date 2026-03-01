import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 1,
});

const USER_ROLE_BASE = ["admin", "ops_manager", "dispatcher", "finance", "customer", "driver", "marketing", "pending"];
let columnsPromise: Promise<Set<string>> | null = null;
let roleEnsurePromise: Promise<void> | null = null;
let defaultOrgIdPromise: Promise<string | null> | null = null;

const camelToSnake = (value: string) =>
  value.replace(/([A-Z])/g, "_$1").replace(/__/g, "_").toLowerCase();

const escapeIdentifier = (identifier: string) => `"${String(identifier).replace(/"/g, '""')}"`;
const escapeSqlLiteral = (value: string) => `'${String(value).replace(/'/g, "''")}'`;

async function getUserColumns() {
  if (columnsPromise) return columnsPromise;
  columnsPromise = (async () => {
    const { rows } = await pool.query(
      `select column_name
       from information_schema.columns
       where table_schema='public' and table_name='users'`
    );
    return new Set((rows || []).map((r: any) => String(r.column_name)));
  })();
  return columnsPromise;
}

async function getDefaultOrgId() {
  if (defaultOrgIdPromise) return defaultOrgIdPromise;
  defaultOrgIdPromise = (async () => {
    try {
      const { rows } = await pool.query(`select id from orgs order by created_at asc limit 1`);
      return rows?.[0]?.id ? String(rows[0].id) : null;
    } catch {
      return null;
    }
  })();
  return defaultOrgIdPromise;
}

async function ensureUserRoleSupport() {
  if (roleEnsurePromise) return roleEnsurePromise;
  roleEnsurePromise = (async () => {
    try {
      await pool.query(`alter type user_role add value if not exists 'pending'`);
    } catch (error: any) {
      const msg = String(error?.message || error || "").toLowerCase();
      if (!msg.includes('type "user_role" does not exist')) {
        console.warn("Unable to ensure user_role enum pending value:", error);
      }
    }

    try {
      const { rows } = await pool.query(`select distinct role::text as role from users where role is not null`);
      const allowed = new Set(USER_ROLE_BASE);
      for (const row of rows || []) {
        if (row?.role) allowed.add(String(row.role));
      }
      const literals = Array.from(allowed).map(escapeSqlLiteral).join(", ");
      await pool.query(`alter table users drop constraint if exists users_role_check`);
      await pool.query(
        `alter table users add constraint users_role_check check ((role::text = any (array[${literals}])))`
      );
    } catch (error) {
      console.warn("Unable to ensure users role check constraint:", error);
    }
  })();
  return roleEnsurePromise;
}

function normalizeIdValue(id: string | null) {
  if (!id) return null;
  const raw = String(id).trim();
  const numeric = Number(raw);
  if (raw && Number.isFinite(numeric) && !Number.isNaN(numeric)) return numeric;
  return raw;
}

async function normalizePayload(payload: any) {
  const columns = await getUserColumns();
  const mapped: Record<string, any> = {};
  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      if (columns.has(key)) {
        mapped[key] = value;
        continue;
      }
      const snake = camelToSnake(key);
      if (columns.has(snake)) mapped[snake] = value;
    }
  }

  if (typeof mapped.email === "string") mapped.email = mapped.email.toLowerCase().trim();
  if (columns.has("role") && !mapped.role) mapped.role = "pending";
  if (columns.has("org_id") && !mapped.org_id) {
    const orgId = await getDefaultOrgId();
    if (orgId) mapped.org_id = orgId;
  }
  if (columns.has("password_hash") && !mapped.password_hash) {
    mapped.password_hash = "__neon_auth_managed__";
  }

  delete mapped.id;
  return mapped;
}

export default async function handler(request: Request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    if (request.method === "POST" || request.method === "PUT") {
      await ensureUserRoleSupport();
    }

    const url = new URL(request.url);
    const idValue = normalizeIdValue(url.searchParams.get("id"));
    const email = String(url.searchParams.get("email") || "").toLowerCase().trim();

    if (request.method === "GET") {
      if (idValue != null) {
        const { rows } = await pool.query(`select * from users where id=$1`, [idValue]);
        return new Response(JSON.stringify(rows?.[0] || null), { headers });
      }
      if (email) {
        const { rows } = await pool.query(`select * from users where lower(email)=$1 limit 1`, [email]);
        return new Response(JSON.stringify(rows?.[0] || null), { headers });
      }
      const { rows } = await pool.query(`select * from users order by created_at desc`);
      return new Response(JSON.stringify(rows || []), { headers });
    }

    if (request.method === "POST") {
      const data = await normalizePayload(await request.json());
      const keys = Object.keys(data);
      if (!keys.length) {
        return new Response(JSON.stringify({ error: "no_fields" }), { status: 400, headers });
      }
      const values = keys.map((k) => data[k]);
      const columnsSql = keys.map(escapeIdentifier).join(", ");
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
      try {
        const { rows } = await pool.query(
          `insert into users (${columnsSql}) values (${placeholders}) returning *`,
          values
        );
        return new Response(JSON.stringify(rows?.[0] || null), { status: 201, headers });
      } catch (error: any) {
        if (error?.code === "23505" && data.email) {
          const emailNorm = String(data.email).toLowerCase().trim();
          const hasOrg = (await getUserColumns()).has("org_id") && !!data.org_id;
          const query = hasOrg
            ? `select * from users where org_id=$1 and lower(email)=$2 limit 1`
            : `select * from users where lower(email)=$1 limit 1`;
          const params = hasOrg ? [data.org_id, emailNorm] : [emailNorm];
          const existing = await pool.query(query, params);
          if (existing.rows?.[0]) {
            return new Response(JSON.stringify(existing.rows[0]), { status: 200, headers });
          }
        }
        throw error;
      }
    }

    if (request.method === "PUT") {
      if (idValue == null) {
        return new Response(JSON.stringify({ error: "ID required" }), { status: 400, headers });
      }
      const data = await normalizePayload(await request.json());
      if ((await getUserColumns()).has("updated_at") && data.updated_at === undefined) {
        data.updated_at = new Date().toISOString();
      }
      const keys = Object.keys(data);
      if (!keys.length) {
        return new Response(JSON.stringify({ error: "no_fields" }), { status: 400, headers });
      }
      const setSql = keys.map((k, idx) => `${escapeIdentifier(k)}=$${idx + 1}`).join(", ");
      const values = keys.map((k) => data[k]);
      values.push(idValue);
      const { rows } = await pool.query(
        `update users set ${setSql} where id=$${keys.length + 1} returning *`,
        values
      );
      return new Response(JSON.stringify(rows?.[0] || null), { headers });
    }

    if (request.method === "DELETE") {
      if (idValue == null) {
        return new Response(JSON.stringify({ error: "ID required" }), { status: 400, headers });
      }
      await pool.query(`delete from users where id=$1`, [idValue]);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500, headers });
  }
}
