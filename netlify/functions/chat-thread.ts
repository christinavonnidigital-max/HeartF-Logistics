import type { Handler } from "@netlify/functions";
import { json, readJson } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth } from "./_lib/auth";

type Body = {
  title?: string;
};

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);

    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const body = event.body ? readJson<Body>(event) : {};
    const title = body.title?.trim() || "Support";

    const res = await q<{ id: string }>(
      `
      insert into chat_threads(org_id, user_id, title)
      values ($1, $2, $3)
      returning id
      `,
      [a.orgId, a.userId, title]
    );

    return json(200, { ok: true, threadId: res.rows[0].id });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    return json(500, { error: "Server error" });
  }
};
