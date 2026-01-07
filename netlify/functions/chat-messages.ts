import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth } from "./_lib/auth";

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const threadId = event.queryStringParameters?.threadId;
    if (!threadId) return json(400, { error: "Missing threadId" });

    const own = await q(
      `select 1 from chat_threads where id = $1 and org_id = $2 and user_id = $3 limit 1`,
      [threadId, a.orgId, a.userId]
    );
    if (own.rowCount !== 1) return json(403, { error: "Forbidden" });

    const msgs = await q(
      `
      select id, role, content, meta, created_at
      from chat_messages
      where thread_id = $1 and org_id = $2
      order by created_at asc
      limit 200
      `,
      [threadId, a.orgId]
    );

    return json(200, { ok: true, messages: msgs.rows });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    return json(500, { error: "Server error" });
  }
};
