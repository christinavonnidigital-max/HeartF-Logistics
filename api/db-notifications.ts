import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";

export default async function handler(request: Request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit") || 50);

    if (request.method === "GET") {
      if (id) {
        const notification = await db.query.notifications.findFirst({
          where: eq(schema.notifications.id, parseInt(id)),
        });
        return new Response(JSON.stringify(notification), { headers });
      }
      const list = await db.query.notifications.findMany({
        where: status ? eq(schema.notifications.status, status) : undefined,
        limit,
        orderBy: desc(schema.notifications.createdAt),
      });
      return new Response(JSON.stringify(list), { headers });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const [notification] = await db.insert(schema.notifications).values(body).returning();
      return new Response(JSON.stringify(notification), { status: 201, headers });
    }

    if (request.method === "PUT") {
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required" }), { status: 400, headers });
      }
      const body = await request.json();
      const [notification] = await db
        .update(schema.notifications)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(schema.notifications.id, parseInt(id)))
        .returning();
      return new Response(JSON.stringify(notification), { headers });
    }

    if (request.method === "DELETE") {
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required" }), { status: 400, headers });
      }
      await db.delete(schema.notifications).where(eq(schema.notifications.id, parseInt(id)));
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500, headers });
  }
}
