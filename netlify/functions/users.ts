import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";

async function audit(
  orgId: string,
  actorUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: any
) {
  try {
    await q(
      `insert into audit_log(org_id, actor_user_id, action, target_type, target_id, meta)
       values ($1,$2,$3,$4,$5,$6)`,
      [orgId, actorUserId, action, targetType || null, targetId || null, meta ? JSON.stringify(meta) : null]
    );
  } catch {
    // Audit table may not exist yet; ignore failures.
  }
}

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

    if (event.httpMethod === "PATCH") {
      requireRole(a, ["admin"]);
      const body = event.body ? JSON.parse(event.body) : {};
      const id = body?.id;
      if (!id) return json(400, { error: "Missing id" });

      if (body?.role) {
        const role = String(body.role);
        await q(
          `update users set role = $1, updated_at = now() where id = $2 and org_id = $3`,
          [role, id, a.orgId]
        );
        await audit(a.orgId, a.userId, "user.role_updated", "user", id, { role });
        return json(200, { ok: true });
      }

      if (typeof body?.is_active === "boolean") {
        const isActive = Boolean(body.is_active);
        if (id === a.userId && !isActive) {
          return json(400, { error: "You cannot disable your own account." });
        }
        await q(
          `update users set is_active = $1, updated_at = now() where id = $2 and org_id = $3`,
          [isActive, id, a.orgId]
        );
        await audit(
          a.orgId,
          a.userId,
          isActive ? "user.enabled" : "user.disabled",
          "user",
          id,
          { is_active: isActive }
        );
        return json(200, { ok: true });
      }

      return json(400, { error: "Nothing to update" });
    }

    return json(405, { error: "Method not allowed" });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};
