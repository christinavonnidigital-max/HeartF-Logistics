import type { Handler } from "@netlify/functions";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { q } from "./_lib/db";
import { json, setCookieHeader } from "./_lib/http";
import { hashPassword, randomToken, sha256Hex } from "./_lib/crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "";
const TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "14", 10);
const AUTH_URL = (process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL || "").replace(/\/+$/, "");
const JWKS_URL = AUTH_URL ? new URL(`${AUTH_URL}/.well-known/jwks.json`) : null;
const JWKS = JWKS_URL ? createRemoteJWKSet(JWKS_URL) : null;

type UserRow = {
  id: string;
  org_id: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

function splitName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!COOKIE_NAME) return json(500, { error: "AUTH_COOKIE_NAME not configured" });
  if (!JWKS) return json(500, { error: "NEON_AUTH_URL not configured" });

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Missing token" });

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return json(401, { error: "Missing token" });

  let payload: any;
  try {
    const verified = await jwtVerify(token, JWKS);
    payload = verified.payload;
  } catch {
    return json(401, { error: "Invalid token" });
  }

  const emailRaw =
    (typeof payload?.email === "string" && payload.email) ||
    (typeof payload?.user?.email === "string" && payload.user.email) ||
    "";

  const nameRaw =
    (typeof payload?.name === "string" && payload.name) ||
    (typeof payload?.user?.name === "string" && payload.user.name) ||
    "";

  const email = emailRaw.toLowerCase().trim();
  if (!email) return json(401, { error: "Missing email" });

  let userRes = await q<UserRow>(
    `select id, org_id, role, email, first_name, last_name, is_active
     from users
     where email = $1
     limit 1`,
    [email]
  );

  if (userRes.rowCount !== 1) {
    const orgRes = await q<{ id: string }>(
      `select id from orgs order by created_at asc limit 1`
    );

    let orgId = orgRes.rows[0]?.id;
    if (!orgId) {
      const orgName = process.env.DEFAULT_ORG_NAME || "Heartfledge Logistics";
      const created = await q<{ id: string }>(
        `insert into orgs(name) values($1) returning id`,
        [orgName]
      );
      orgId = created.rows[0]?.id;
    }

    const countRes = await q<{ c: number }>(
      `select count(*)::int as c from users where org_id = $1`,
      [orgId]
    );
    const role = (countRes.rows[0]?.c ?? 0) === 0 ? "admin" : "customer";
    const { firstName, lastName } = splitName(nameRaw);
    const passwordHash = await hashPassword(randomToken(32));

    const inserted = await q<UserRow>(
      `insert into users(org_id, email, first_name, last_name, role, password_hash)
       values ($1,$2,$3,$4,$5,$6)
       returning id, org_id, role, email, first_name, last_name, is_active`,
      [orgId, email, firstName, lastName, role, passwordHash]
    );
    userRes = inserted;
  }

  const u = userRes.rows[0];
  if (!u?.is_active) return json(403, { error: "Account disabled" });

  const sessionToken = randomToken(32);
  const tokenHash = sha256Hex(sessionToken);
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  await q(
    `insert into sessions(user_id, org_id, token_hash, expires_at)
     values($1,$2,$3,$4)`,
    [u.id, u.org_id, tokenHash, expires.toISOString()]
  );

  const secure = process.env.AUTH_COOKIE_SECURE === "true";

  return json(
    200,
    {
      ok: true,
      user: {
        userId: u.id,
        orgId: u.org_id,
        role: u.role,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
      },
    },
    setCookieHeader(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      expires,
    })
  );
};
