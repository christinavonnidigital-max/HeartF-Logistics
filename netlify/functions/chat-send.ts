import type { Handler } from "@netlify/functions";
import { json, readJson } from "./_lib/http";
import { q } from "./_lib/db";
import { requireAuth } from "./_lib/auth";

type Body = {
  threadId: string;
  message: string;
  context?: {
    route?: string;
    module?: string;
    selectedEntity?: { type: string; id: string | number } | null;
  };
};

async function getThreadOwnership(orgId: string, userId: string, threadId: string) {
  const own = await q(
    `select 1 from chat_threads where id = $1 and org_id = $2 and user_id = $3 limit 1`,
    [threadId, orgId, userId]
  );
  return own.rowCount === 1;
}

// Placeholder model call. Swap with your provider.
async function callModel(args: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const lastUser = [...args.messages].reverse().find((m) => m.role === "user")?.content || "";
  return `Got it. Here’s what I understand:\n\n${lastUser}\n\nTell me what screen you are on and what you tried, and I’ll guide you step by step.`;
}

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const body = readJson<Body>(event);
    const threadId = body.threadId;
    const message = (body.message || "").trim();
    if (!threadId) return json(400, { error: "Missing threadId" });
    if (!message) return json(400, { error: "Message is empty" });

    const owned = await getThreadOwnership(a.orgId, a.userId, threadId);
    if (!owned) return json(403, { error: "Forbidden" });

    await q(
      `
      insert into chat_messages(org_id, thread_id, user_id, role, content, meta)
      values ($1,$2,$3,'user',$4,$5)
      `,
      [
        a.orgId,
        threadId,
        a.userId,
        message,
        JSON.stringify({ context: body.context || null }),
      ]
    );

    const history = await q<{ role: string; content: string }>(
      `
      select role, content
      from chat_messages
      where org_id = $1 and thread_id = $2
      order by created_at desc
      limit 24
      `,
      [a.orgId, threadId]
    );

    const messages = history.rows
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const ctx = body.context || {};
    const system = [
      "You are an in-app support agent for a logistics and CRM system.",
      "Be concise and practical. Ask only for missing details needed to resolve the issue.",
      "When the user is booking: collect pickup, delivery, date, cargo, refrigeration, customer, price.",
      "When troubleshooting: ask what they clicked, what they expected, what happened, any error text.",
      "",
      `User: ${a.firstName} ${a.lastName} (${a.email})`,
      `Role: ${a.role}`,
      `Current route: ${ctx.route || "unknown"}`,
      `Module: ${ctx.module || "unknown"}`,
      `Selected: ${ctx.selectedEntity ? `${ctx.selectedEntity.type}#${ctx.selectedEntity.id}` : "none"}`,
    ].join("\n");

    const reply = await callModel({ system, messages });

    await q(
      `
      insert into chat_messages(org_id, thread_id, user_id, role, content, meta)
      values ($1,$2,null,'assistant',$3,$4)
      `,
      [a.orgId, threadId, reply, JSON.stringify({ model: "placeholder" })]
    );

    await q(`update chat_threads set updated_at = now() where id = $1 and org_id = $2`, [
      threadId,
      a.orgId,
    ]);

    return json(200, { ok: true, reply });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    return json(500, { error: "Server error" });
  }
};
