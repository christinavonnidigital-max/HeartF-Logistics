import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  try {
    await requireAuth(event);

    const [leads, customers] = await Promise.all([
      q("select * from app.crm_leads"),
      q("select * from app.crm_customers"),
    ]);

    return json(200, { ok: true, leads: leads.rows, customers: customers.rows });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { ok: false, error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { ok: false, error: "Forbidden" });
    return json(500, { ok: false, error: "Server error", detail: msg });
  }
};
