import type { Handler } from "@netlify/functions";
import { json, readJson } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";

type Body = {
  searchId: string;
  resultIds: string[];
};

const allowedRoles = ["admin", "ops_manager", "dispatcher"];

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    requireRole(a, allowedRoles);
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const body = readJson<Body>(event);
    const { searchId, resultIds } = body;
    if (!searchId || !Array.isArray(resultIds) || resultIds.length === 0) {
      return json(400, { error: "Missing searchId or resultIds" });
    }

    const searchCheck = await q(`select 1 from lead_finder_searches where id = $1 and org_id = $2 limit 1`, [
      searchId,
      a.orgId,
    ]);
    if (searchCheck.rowCount !== 1) return json(404, { error: "Search not found" });

    const resResults = await q<{ id: string }>(
      `select id from lead_finder_results where search_id = $1 and org_id = $2 and id = any($3::uuid[])`,
      [searchId, a.orgId, resultIds]
    );
    const allowedIds = resResults.rows.map((r) => r.id);
    const toInsert = allowedIds.length;
    if (toInsert === 0) return json(400, { error: "No valid results to import" });

    for (const rid of allowedIds) {
      await q(
        `
        insert into lead_finder_imports(org_id, search_id, user_id, lead_id, result_id)
        values ($1,$2,$3,null,$4)
        on conflict do nothing
      `,
        [a.orgId, searchId, a.userId, rid]
      );
    }

    return json(200, { ok: true, imported: toInsert });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};
