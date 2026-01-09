import type { Handler } from "@netlify/functions";
import { json, clearCookieHeader, getCookies } from "./_lib/http";
import { q } from "./_lib/db";
import { sha256Hex } from "./_lib/crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const cookies = getCookies(event);
  const token = cookies[COOKIE_NAME];
  if (token) {
    await q(`update sessions set revoked_at = now() where token_hash = $1`, [sha256Hex(token)]);
  }
  return json(200, { ok: true }, clearCookieHeader(COOKIE_NAME));
};
