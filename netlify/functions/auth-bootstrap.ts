import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { json, readJson } from "./_lib/http";
import { hashPassword } from "./_lib/crypto";

type Body = {
  orgName: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const body = readJson<Body>(event);

  const existing = await q(`select count(*)::int as c from users`);
  if (existing.rows[0].c > 0) return json(409, { error: "Already bootstrapped" });

  const orgRes = await q<{ id: string }>(
    `insert into orgs(name) values($1) returning id`,
    [body.orgName.trim()]
  );

  const orgId = orgRes.rows[0].id;
  const pwHash = await hashPassword(body.password);

  const userRes = await q(
    `
    insert into users(org_id, email, first_name, last_name, role, password_hash)
    values ($1,$2,$3,$4,'admin',$5)
    returning id
  `,
    [orgId, body.email.toLowerCase().trim(), body.firstName.trim(), body.lastName.trim(), pwHash]
  );

  return json(200, { ok: true, orgId, userId: userRes.rows[0].id });
};
