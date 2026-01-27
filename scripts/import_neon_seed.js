import fs from "fs";
import path from "path";
import Papa from "papaparse";
import pg from "pg";

const { Client } = pg;

const csvDir = "C:/Users/asus/OneDrive/Desktop/Heartfledge/neon_seed_exports";

// Lightweight .env parser so we don't need an extra dependency
function loadEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const raw = fs.readFileSync(path.resolve(".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*\"?([^\"\\r\\n]+)\"?\s*$/i);
      if (m) {
        process.env.DATABASE_URL = m[1].trim();
        break;
      }
    }
  } catch (err) {
    console.warn("Could not read .env for DATABASE_URL; ensure env is set.");
  }
}

const toNull = (v) => (v === undefined || v === null || v === "" ? null : v);
const toCleanText = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return null;
  return s;
};
const toBool = (v) => (typeof v === "string" ? v.toLowerCase() === "true" : !!v);
const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true });
  return data;
}

async function insertRows(client, table, columns, rows, mapper) {
  if (!rows.length) return;
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const values = [];
    const placeholders = slice.map((row, idx) => {
      const mapped = mapper(row);
      values.push(...mapped);
      const offset = idx * columns.length;
      const ph = columns.map((_, cIdx) => `$${offset + cIdx + 1}`).join(", ");
      return `(${ph})`;
    });
    const sql = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES ${placeholders.join(", ")};`;
    await client.query(sql, values);
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // Clean slate so reruns are safe
    await client.query(
      "TRUNCATE app.crm_customers, app.crm_leads, app.fleet_insurance, app.fleet_vehicles, app.fleet_other_expenses, app.fleet_licensing_payments, app.fleet_maintenance_labour, app.fleet_maintenance_spares, app.fleet_fuel_purchases, app.fleet_trips, app.fleet_daily_records RESTART IDENTITY CASCADE;"
    );

    // 1) fleet_daily_records
    const dailyRows = parseCsv(path.join(csvDir, "fleet_daily_records.csv"));
    const validKoboUuids = new Set(dailyRows.map((r) => r.kobo_uuid));
    await insertRows(
      client,
      "app.fleet_daily_records",
      [
        "kobo_uuid",
        "kobo_id",
        "kobo_index",
        "record_date",
        "truck_reg",
        "truck_make_short",
        "start_ts",
        "end_ts",
        "has_trips",
        "has_fuel",
        "has_maintenance",
        "has_licensing",
        "has_other_expenses",
        "submitted_at",
        "submitted_by",
        "submission_status",
      ],
      dailyRows,
      (r) => [
        r.kobo_uuid,
        toNum(r.kobo_id),
        toNum(r.kobo_index),
        toNull(r.record_date),
        toNull(r.truck_reg),
        toNull(r.truck_make_short),
        toNull(r.start_ts),
        toNull(r.end_ts),
        toBool(r.has_trips),
        toBool(r.has_fuel),
        toBool(r.has_maintenance),
        toBool(r.has_licensing),
        toBool(r.has_other_expenses),
        toNull(r.submitted_at),
        toNull(r.submitted_by),
        toNull(r.submission_status),
      ]
    );
    console.log(`Inserted ${dailyRows.length} into app.fleet_daily_records`);

    // 2) fleet_trips
    const tripRows = parseCsv(path.join(csvDir, "fleet_trips.csv")).filter((r) => validKoboUuids.has(r.kobo_uuid));
    await insertRows(
      client,
      "app.fleet_trips",
      [
        "kobo_uuid",
        "trip_from",
        "trip_to",
        "customer",
        "opening_km",
        "closing_km",
        "trip_time_hours",
        "goods_description",
        "invoiced_amount_usd",
        "toll_currency",
        "toll_cost",
        "comments",
        "attachment_url",
      ],
      tripRows,
      (r) => [
        r.kobo_uuid,
        toNull(r.trip_from),
        toNull(r.trip_to),
        toNull(r.customer),
        toNum(r.opening_km),
        toNum(r.closing_km),
        toNum(r.trip_time_hours),
        toNull(r.goods_description),
        toNum(r.invoiced_amount_usd),
        toNull(r.toll_currency),
        toNum(r.toll_cost),
        toNull(r.comments),
        toNull(r.attachment_url),
      ]
    );
    console.log(`Inserted ${tripRows.length} into app.fleet_trips`);

    // 3) fleet_fuel_purchases
    const fuelRows = parseCsv(path.join(csvDir, "fleet_fuel_purchases.csv")).filter((r) => validKoboUuids.has(r.kobo_uuid));
    await insertRows(
      client,
      "app.fleet_fuel_purchases",
      ["kobo_uuid", "litres", "amount_usd", "supplier", "comments", "receipt_url"],
      fuelRows,
      (r) => [
        r.kobo_uuid,
        toNum(r.litres),
        toNum(r.amount_usd),
        toNull(r.supplier),
        toNull(r.comments),
        toNull(r.receipt_url),
      ]
    );
    console.log(`Inserted ${fuelRows.length} into app.fleet_fuel_purchases`);

    // 4) fleet_maintenance_spares
    const sparesRows = parseCsv(path.join(csvDir, "fleet_maintenance_spares.csv")).filter((r) =>
      validKoboUuids.has(r.kobo_uuid)
    );
    await insertRows(
      client,
      "app.fleet_maintenance_spares",
      ["kobo_uuid", "spare_name", "cost_usd", "supplier", "receipt_url"],
      sparesRows,
      (r) => [
        r.kobo_uuid,
        toNull(r.spare_name),
        toNum(r.cost_usd),
        toNull(r.supplier),
        toNull(r.receipt_url),
      ]
    );
    console.log(`Inserted ${sparesRows.length} into app.fleet_maintenance_spares`);

    // 5) fleet_maintenance_labour
    const labourRows = parseCsv(path.join(csvDir, "fleet_maintenance_labour.csv")).filter((r) =>
      validKoboUuids.has(r.kobo_uuid)
    );
    await insertRows(
      client,
      "app.fleet_maintenance_labour",
      ["kobo_uuid", "description", "supplier", "cost_usd"],
      labourRows,
      (r) => [r.kobo_uuid, toNull(r.description), toNull(r.supplier), toNum(r.cost_usd)]
    );
    console.log(`Inserted ${labourRows.length} into app.fleet_maintenance_labour`);

    // 6) fleet_licensing_payments
    const licenseRows = parseCsv(path.join(csvDir, "fleet_licensing_payments.csv")).filter((r) =>
      validKoboUuids.has(r.kobo_uuid)
    );
    await insertRows(
      client,
      "app.fleet_licensing_payments",
      ["kobo_uuid", "currency", "license_type", "cost", "attachment_url"],
      licenseRows,
      (r) => [r.kobo_uuid, toNull(r.currency), toNull(r.license_type), toNum(r.cost), toNull(r.attachment_url)]
    );
    console.log(`Inserted ${licenseRows.length} into app.fleet_licensing_payments`);

    // 7) fleet_other_expenses
    const otherRows = parseCsv(path.join(csvDir, "fleet_other_expenses.csv")).filter((r) =>
      validKoboUuids.has(r.kobo_uuid)
    );
    await insertRows(
      client,
      "app.fleet_other_expenses",
      ["kobo_uuid", "currency", "amount", "description", "attachment_url"],
      otherRows,
      (r) => [r.kobo_uuid, toNull(r.currency), toNum(r.amount), toNull(r.description), toNull(r.attachment_url)]
    );
    console.log(`Inserted ${otherRows.length} into app.fleet_other_expenses`);

    // 8) fleet_vehicles
    const vehicleRows = parseCsv(path.join(csvDir, "fleet_vehicles.csv"));
    // Drop duplicates based on cleaned reg number to satisfy unique index
    const seenRegs = new Set();
    const dedupedVehicles = vehicleRows.filter((r) => {
      const key = (r.reg_number_clean || "").toLowerCase();
      if (seenRegs.has(key)) return false;
      seenRegs.add(key);
      return true;
    });
    await insertRows(
      client,
      "app.fleet_vehicles",
      [
        "reg_number",
        "reg_number_clean",
        "make",
        "capacity_tonnes",
        "purchase_date",
        "purchase_cost_usd",
        "resale_value_2024_usd",
        "refrigeration",
        "maintenance_requirements",
        "quarterly_maintenance_budget_usd",
      ],
      vehicleRows,
      (r) => [
        toCleanText(r.reg_number),
        toCleanText(r.reg_number_clean),
        toCleanText(r.make),
        toNum(r.capacity_tonnes),
        toNull(r.purchase_date),
        toNum(r.purchase_cost_usd),
        toNum(r.resale_value_2024_usd),
        toCleanText(r.refrigeration),
        toCleanText(r.maintenance_requirements),
        toNum(r.quarterly_maintenance_budget_usd),
      ]
    );
    console.log(`Inserted ${dedupedVehicles.length} into app.fleet_vehicles`);

    // 9) fleet_insurance
    const insRows = parseCsv(path.join(csvDir, "fleet_insurance.csv"));
    await insertRows(
      client,
      "app.fleet_insurance",
      ["reg_number", "last_due_date", "renewed", "period_renewed", "amount_usd", "next_renewal", "type_of_cover", "service_provider"],
      insRows,
      (r) => [
        toNull(r.reg_number),
        toNull(r.last_due_date),
        toBool(r.renewed),
        toNull(r.period_renewed),
        toNum(r.amount_usd),
        toNull(r.next_renewal),
        toNull(r.type_of_cover),
        toNull(r.service_provider),
      ]
    );
    console.log(`Inserted ${insRows.length} into app.fleet_insurance`);

    // 10) crm_leads
    const leadRows = parseCsv(path.join(csvDir, "crm_leads.csv"));
    await insertRows(
      client,
      "app.crm_leads",
      [
        "customer",
        "customer_contact",
        "position",
        "heartfledge_contact",
        "action_completed",
        "action_date",
        "follow_up_action",
        "follow_up_date",
        "referred_suggested_by",
        "email",
      ],
      leadRows,
      (r) => [
        toNull(r.customer),
        toNull(r.customer_contact),
        toNull(r.position),
        toNull(r.heartfledge_contact),
        toNull(r.action_completed),
        toNull(r.action_date),
        toNull(r.follow_up_action),
        toNull(r.follow_up_date),
        toNull(r.referred_suggested_by),
        toNull(r.email),
      ]
    );
    console.log(`Inserted ${leadRows.length} into app.crm_leads`);

    // 11) crm_customers
    const custRows = parseCsv(path.join(csvDir, "crm_customers.csv"));
    await insertRows(
      client,
      "app.crm_customers",
      [
        "customer",
        "customer_contact",
        "position",
        "heartfledge_contact",
        "action_completed",
        "action_date",
        "follow_up_action",
        "follow_up_date",
        "referred_suggested_by",
      ],
      custRows,
      (r) => [
        toNull(r.customer),
        toNull(r.customer_contact),
        toNull(r.position),
        toNull(r.heartfledge_contact),
        toNull(r.action_completed),
        toNull(r.action_date),
        toNull(r.follow_up_action),
        toNull(r.follow_up_date),
        toNull(r.referred_suggested_by),
      ]
    );
    console.log(`Inserted ${custRows.length} into app.crm_customers`);

    console.log("All imports completed.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
