import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);

    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    requireRole(a, ["admin", "ops_manager"]);

    const limit = Math.max(1, Math.min(200, Number(event.queryStringParameters?.limit || "50")));

    const res = await q(
      `
      select
        al.id,
        al.action,
        al.target_type,
        al.target_id,
        al.meta,
        al.created_at,
        u.email as actor_email,
        u.first_name as actor_first_name,
        u.last_name as actor_last_name
      from audit_log al
      left join users u on u.id = al.actor_user_id
      where al.org_id = $1
      order by al.created_at desc
      limit $2
      `,
      [a.orgId, limit]
    );

    return json(200, { ok: true, entries: res.rows });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};
