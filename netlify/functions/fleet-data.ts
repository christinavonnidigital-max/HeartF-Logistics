import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  try {
    await requireAuth(event); // any signed-in user can read

    const [
      daily,
      trips,
      fuel,
      spares,
      labour,
      licensing,
      other,
      vehicles,
      insurance,
    ] = await Promise.all([
      q("select * from app.fleet_daily_records"),
      q("select * from app.fleet_trips"),
      q("select * from app.fleet_fuel_purchases"),
      q("select * from app.fleet_maintenance_spares"),
      q("select * from app.fleet_maintenance_labour"),
      q("select * from app.fleet_licensing_payments"),
      q("select * from app.fleet_other_expenses"),
      q("select * from app.fleet_vehicles"),
      q("select * from app.fleet_insurance"),
    ]);

    return json(200, {
      ok: true,
      daily: daily.rows,
      trips: trips.rows,
      fuel: fuel.rows,
      spares: spares.rows,
      labour: labour.rows,
      licensing: licensing.rows,
      other: other.rows,
      vehicles: vehicles.rows,
      insurance: insurance.rows,
    });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { ok: false, error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { ok: false, error: "Forbidden" });
    return json(500, { ok: false, error: "Server error", detail: msg });
  }
};
