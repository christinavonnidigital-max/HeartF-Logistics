import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json, readJson, setCookieHeader } from "./_lib/http";
import { randomToken, sha256Hex, verifyPassword } from "./_lib/crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "";
const TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "14", 10);

type Body = { email: string; password: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const { email, password } = readJson<Body>(event);
  const emailNorm = email.toLowerCase().trim();

  const res = await q<{
    id: string;
    org_id: string;
    password_hash: string;
    is_active: boolean;
  }>(
    `select id, org_id, password_hash, is_active from users where email = $1 limit 1`,
    [emailNorm]
  );

  if (res.rowCount !== 1) return json(401, { error: "Invalid credentials" });
  const u = res.rows[0];
  if (!u.is_active) return json(403, { error: "Account disabled" });

  const ok = await verifyPassword(password, u.password_hash);
  if (!ok) return json(401, { error: "Invalid credentials" });

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  await q(
    `insert into sessions(user_id, org_id, token_hash, expires_at) values($1,$2,$3,$4)`,
    [u.id, u.org_id, tokenHash, expires.toISOString()]
  );

  const secure = process.env.AUTH_COOKIE_SECURE === "true";

  return json(
    200,
    { ok: true },
    setCookieHeader(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      expires,
    })
  );
};
