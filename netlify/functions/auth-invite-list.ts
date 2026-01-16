import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json } from "./_lib/http";
import { requireAuth } from "./_lib/auth";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const actor = await requireAuth(event);
    if (actor.role !== "admin") return json(403, { error: "Forbidden" });

    const res = await q(
      `select id, email, role, created_at, expires_at, used_at, revoked_at
         from invites
        where org_id = $1
        order by created_at desc
        limit 200`,
      [actor.orgId]
    );

    return json(200, { ok: true, invites: res.rows });
  } catch (e: any) {
    return json(500, { error: "Server error", detail: String(e?.message || e) });
  }
};
