import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json, readJson } from "./_lib/http";
import { requireAuth } from "./_lib/auth";

type Body = { inviteId: string };

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

    const actor = await requireAuth(event);
    if (actor.role !== "admin") return json(403, { error: "Forbidden" });

    const { inviteId } = readJson<Body>(event);
    const id = String(inviteId || "").trim();
    if (!id) return json(400, { error: "Missing inviteId" });

    const res = await q(
      `update invites
          set revoked_at = now()
        where id = $1
          and org_id = $2
          and used_at is null
          and revoked_at is null
      returning id, email, role`,
      [id, actor.orgId]
    );

    await audit(actor.orgId, actor.userId, "invite.revoke", {
      inviteId: id,
      changed: res.rowCount === 1,
      email: res.rows?.[0]?.email,
      role: res.rows?.[0]?.role,
    });

    return json(200, { ok: true, changed: res.rowCount === 1 });
  } catch (e: any) {
    return json(500, { error: "Server error", detail: String(e?.message || e) });
  }
};
