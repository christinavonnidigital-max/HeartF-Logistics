import type { Handler } from "@netlify/functions";
import { json, readJson } from "./_lib/http";
import { q } from "./_lib/db";
import { sha256Hex, hashPassword } from "./_lib/crypto";

type Body = {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const body = readJson<Body>(event);
  const tokenHash = sha256Hex(body.token);
  const email = body.email.toLowerCase().trim();

  const inv = await q<{ org_id: string; role: string; expires_at: string; accepted_at: string | null }>(
    `select org_id, role, expires_at, accepted_at from invites where token_hash = $1 and email = $2 limit 1`,
    [tokenHash, email]
  );

  if (inv.rowCount !== 1) return json(400, { error: "Invalid invite" });
  const row = inv.rows[0];
  if (row.accepted_at) return json(400, { error: "Invite already used" });
  if (new Date(row.expires_at).getTime() < Date.now()) return json(400, { error: "Invite expired" });

  const pwHash = await hashPassword(body.password);

  const userRes = await q<{ id: string }>(
    `
    insert into users(org_id, email, first_name, last_name, role, password_hash)
    values ($1,$2,$3,$4,$5,$6)
    returning id
  `,
    [row.org_id, email, body.firstName.trim(), body.lastName.trim(), row.role, pwHash]
  );

  await q(`update invites set accepted_at = now() where token_hash = $1`, [tokenHash]);

  return json(200, { ok: true, userId: userRes.rows[0].id });
};
