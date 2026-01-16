import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json, readJson } from "./_lib/http";
import { randomToken, sha256Hex } from "./_lib/crypto";
import { requireAuth } from "./_lib/auth";
import { sendEmail } from "./_lib/email";

type Body = { email: string; role: string; sendEmail?: boolean };

const INVITE_TTL_DAYS = parseInt(process.env.INVITE_TTL_DAYS || "7", 10);
const APP_BASE_URL = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");

const LIMIT_USER_PER_HOUR = parseInt(process.env.INVITE_LIMIT_PER_USER_PER_HOUR || "20", 10);
const LIMIT_ORG_PER_DAY = parseInt(process.env.INVITE_LIMIT_PER_ORG_PER_DAY || "200", 10);
const LIMIT_EMAIL_PER_DAY = parseInt(process.env.INVITE_LIMIT_PER_EMAIL_PER_DAY || "5", 10);

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function audit(orgId: string, actorUserId: string | null, action: string, meta: any) {
  await q(
    `insert into audit_log(org_id, actor_user_id, action, meta)
     values($1,$2,$3,$4::jsonb)`,
    [orgId, actorUserId, action, JSON.stringify(meta || {})]
  );
}

async function enforceRateLimits(orgId: string, actorUserId: string, email: string) {
  const perUserHour = await q(
    `select count(*)::int as n
       from invites
      where org_id = $1
        and created_by = $2
        and created_at > now() - interval '1 hour'`,
    [orgId, actorUserId]
  );

  if ((perUserHour.rows?.[0]?.n ?? 0) >= LIMIT_USER_PER_HOUR) {
    throw new Error(`Rate limit: too many invites sent by this user (max ${LIMIT_USER_PER_HOUR}/hour).`);
  }

  const perOrgDay = await q(
    `select count(*)::int as n
       from invites
      where org_id = $1
        and created_at > now() - interval '24 hours'`,
    [orgId]
  );

  if ((perOrgDay.rows?.[0]?.n ?? 0) >= LIMIT_ORG_PER_DAY) {
    throw new Error(`Rate limit: too many invites for this org (max ${LIMIT_ORG_PER_DAY}/day).`);
  }

  const perEmailDay = await q(
    `select count(*)::int as n
       from invites
      where org_id = $1
        and lower(email) = lower($2)
        and created_at > now() - interval '24 hours'`,
    [orgId, email]
  );

  if ((perEmailDay.rows?.[0]?.n ?? 0) >= LIMIT_EMAIL_PER_DAY) {
    throw new Error(`Rate limit: too many invites for this email (max ${LIMIT_EMAIL_PER_DAY}/day).`);
  }
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const actor = await requireAuth(event);
    if (actor.role !== "admin") return json(403, { error: "Forbidden" });

    const body = readJson<Body>(event);
    const emailNorm = String(body.email || "").toLowerCase().trim();
    const roleNorm = String(body.role || "").trim() || "user";
    const shouldSendEmail = body.sendEmail !== false;

    if (!emailNorm || !isEmail(emailNorm)) return json(400, { error: "Invalid email" });
    if (!APP_BASE_URL) return json(500, { error: "Missing APP_BASE_URL" });

    await enforceRateLimits(actor.orgId, actor.userId, emailNorm);

    // Revoke any existing active invite for this org+email
    await q(
      `update invites
         set revoked_at = now()
       where org_id = $1 and lower(email) = lower($2)
         and used_at is null and revoked_at is null`,
      [actor.orgId, emailNorm]
    );

    const token = randomToken(32);
    const tokenHash = sha256Hex(token);
    const expires = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await q(
      `insert into invites(org_id, email, role, token_hash, created_by, expires_at)
       values ($1,$2,$3,$4,$5,$6)`,
      [actor.orgId, emailNorm, roleNorm, tokenHash, actor.userId, expires.toISOString()]
    );

    const inviteLink = `${APP_BASE_URL}/accept-invite?token=${encodeURIComponent(token)}`;

    if (shouldSendEmail) {
      const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;">
          <h2>You’ve been invited</h2>
          <p>You’ve been invited to join <b>HeartF Logistics</b>.</p>
          <p>
            <a href="${inviteLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;">
              Accept invite
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;">This link expires on ${expires.toISOString()}.</p>
        </div>
      `;

      await sendEmail({
        to: emailNorm,
        subject: "Your invite to HeartF Logistics",
        html,
      });
    }

    await audit(actor.orgId, actor.userId, "invite.create", {
      email: emailNorm,
      role: roleNorm,
      sentEmail: shouldSendEmail,
      expiresAt: expires.toISOString(),
    });

    return json(200, { ok: true, inviteLink });
  } catch (e: any) {
    const msg = String(e?.message || e);
    return json(500, { error: "Server error", detail: msg });
  }
};
