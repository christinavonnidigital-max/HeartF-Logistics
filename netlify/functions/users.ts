import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);

    if (event.httpMethod === "GET") {
      requireRole(a, ["admin", "ops_manager"]);

      const res = await q(
        `
        select id, email, first_name, last_name, role, is_active, created_at
        from users
        where org_id = $1
        order by created_at desc
      `,
        [a.orgId]
      );

      return json(200, { ok: true, users: res.rows });
    }

    if (event.httpMethod === "DELETE") {
      requireRole(a, ["admin"]);
      const id = event.queryStringParameters?.id;
      if (!id) return json(400, { error: "Missing id" });

      await q(`delete from users where id = $1 and org_id = $2`, [id, a.orgId]);
      return json(200, { ok: true });
    }

    return json(405, { error: "Method not allowed" });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};
