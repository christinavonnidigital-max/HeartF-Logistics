import type { HandlerEvent } from "@netlify/functions";
import { q } from "./db";
import { getCookies } from "./http";
import { sha256Hex } from "./crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "";

export type Authed = {
  userId: string;
  orgId: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function requireAuth(event: HandlerEvent): Promise<Authed> {
  const cookies = getCookies(event);
  const token = cookies[COOKIE_NAME];
  if (!token) throw new Error("UNAUTHENTICATED");

  const tokenHash = sha256Hex(token);

  const res = await q<{
    user_id: string;
    org_id: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string;
  }>(
    `
    select s.user_id, s.org_id, u.role, u.email, u.first_name, u.last_name
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = $1
      and s.revoked_at is null
      and s.expires_at > now()
      and u.is_active = true
    limit 1
  `,
    [tokenHash]
  );

  if (res.rowCount !== 1) throw new Error("UNAUTHENTICATED");

  const row = res.rows[0];
  return {
    userId: row.user_id,
    orgId: row.org_id,
    role: row.role,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

export function requireRole(authed: Authed, roles: string[]) {
  if (!roles.includes(authed.role)) throw new Error("FORBIDDEN");
}
