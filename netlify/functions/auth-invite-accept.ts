import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json, readJson, setCookieHeader } from "./_lib/http";
import { hashPassword, randomToken, sha256Hex } from "./_lib/crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "";
const TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "14", 10);

type Body = { token: string; password: string; firstName: string; lastName: string };

async function audit(orgId: string, actorUserId: string | null, action: string, meta: any) {
  await q(
    `insert into audit_log(org_id, actor_user_id, action, meta)
     values($1,$2,$3,$4::jsonb)`,
    [orgId, actorUserId, action, JSON.stringify(meta || {})]
  );
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
    if (!COOKIE_NAME) return json(500, { error: "AUTH_COOKIE_NAME not configured" });

    const { token, password, firstName, lastName } = readJson<Body>(event);
    const tokenNorm = String(token || "").trim();
    const pw = String(password || "");
    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();

    if (!tokenNorm) return json(400, { error: "Missing token" });
    if (pw.length < 8) return json(400, { error: "Password must be at least 8 characters" });

    const tokenHash = sha256Hex(tokenNorm);

    const invRes = await q(
      `select id, org_id, email, role, expires_at, used_at, revoked_at
         from invites
        where token_hash = $1
        limit 1`,
      [tokenHash]
    );

    if (invRes.rowCount !== 1) return json(400, { error: "Invalid invite" });

    const inv = invRes.rows[0];
    if (inv.revoked_at) return json(400, { error: "Invite revoked" });
    if (inv.used_at) return json(400, { error: "Invite already used" });
    if (new Date(inv.expires_at).getTime() <= Date.now()) return json(400, { error: "Invite expired" });

    const passwordHash = await hashPassword(pw);

    const userRes = await q(
      `insert into users(org_id, email, first_name, last_name, role, password_hash, is_active)
       values($1,$2,$3,$4,$5,$6,true)
       on conflict (email) do update set
         org_id = excluded.org_id,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         role = excluded.role,
         password_hash = excluded.password_hash,
         is_active = true
       returning id, org_id, role, email, first_name, last_name, is_active`,
      [inv.org_id, inv.email, fn, ln, inv.role, passwordHash]
    );

    const u = userRes.rows[0];
    if (!u?.is_active) return json(403, { error: "Account disabled" });

    await q(`update invites set used_at = now() where id = $1`, [inv.id]);

    const sessionToken = randomToken(32);
    const sessionHash = sha256Hex(sessionToken);
    const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

    await q(
      `insert into sessions(user_id, org_id, token_hash, expires_at)
       values($1,$2,$3,$4)`,
      [u.id, u.org_id, sessionHash, expires.toISOString()]
    );

    await audit(inv.org_id, u.id, "invite.accept", {
      inviteId: inv.id,
      email: inv.email,
      role: inv.role,
    });

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
  } catch (e: any) {
    return json(500, { error: "Server error", detail: String(e?.message || e) });
  }
};
