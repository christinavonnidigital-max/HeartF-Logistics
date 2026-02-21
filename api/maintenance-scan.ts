import { db, schema } from "../db";
import { sql, lte } from "drizzle-orm";

const DEFAULT_LEAD_DAYS = 7;

export default async function handler(request: Request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const leadDays = Number(process.env.MAINTENANCE_LEAD_DAYS || DEFAULT_LEAD_DAYS);
    const targetDate = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);

    const dueVehicles = await db.query.vehicles.findMany({
      where: (fields, { and, isNotNull, lte }) =>
        and(isNotNull(fields.nextServiceDueDate), lte(fields.nextServiceDueDate, targetDate)),
    });

    const notifications = await Promise.all(
      dueVehicles.map((v) =>
        db.insert(schema.notifications).values({
          type: "maintenance.due",
          entityId: v.id,
          recipientEmail: process.env.MAINTENANCE_ALERT_EMAIL || "",
          status: "queued",
          payload: {
            vehicle: v.registrationNumber,
            due_date: v.nextServiceDueDate,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({ ok: true, queued: dueVehicles.length, leadDays }),
      { headers }
    );
  } catch (error) {
    console.error("maintenance scan error", error);
    return new Response(JSON.stringify({ error: "scan_failed" }), { status: 500, headers });
  }
}
