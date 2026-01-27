import type { Handler } from "@netlify/functions";
import { json, readJson } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";
import { randomToken, sha256Hex } from "./_lib/crypto";

type Body = { email: string; role: "admin" | "ops_manager" | "dispatcher" | "finance" | "customer" };

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);

    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
    requireRole(a, ["admin"]);

    const body = readJson<Body>(event);
    const email = (body.email || "").toLowerCase().trim();
    const role = body.role;

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json(400, { error: "Valid email is required" });
    }
    if (!role || !["admin", "ops_manager", "dispatcher", "finance", "customer"].includes(role)) {
      return json(400, { error: "Invalid role" });
    }

    const token = randomToken(24);
    const tokenHash = sha256Hex(token);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await q(
      `
      insert into invites(org_id, email, role, token_hash, invited_by, expires_at)
      values ($1,$2,$3,$4,$5,$6)
      on conflict (org_id, email)
      do update set role = excluded.role, token_hash = excluded.token_hash, expires_at = excluded.expires_at, invited_by = excluded.invited_by, accepted_at = null
    `,
      [a.orgId, email, role, tokenHash, a.userId, expires.toISOString()]
    );

    const originHeader = event.headers.origin || event.headers.Origin || "";
    const baseUrl = process.env.URL || originHeader || "";
    const inviteLink = `${baseUrl}/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

    return json(200, { ok: true, inviteLink, expiresAt: expires.toISOString() });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error", detail: msg });
  }
};
