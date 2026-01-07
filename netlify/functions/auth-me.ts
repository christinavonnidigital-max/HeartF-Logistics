import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";
import { requireAuth } from "./_lib/auth";

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    return json(200, { ok: true, user: a });
  } catch {
    return json(200, { ok: true, user: null });
  }
};
