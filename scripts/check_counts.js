import pg from "pg";

const { Client } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL first.");
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = [
    "fleet_daily_records",
    "fleet_trips",
    "fleet_fuel_purchases",
    "fleet_maintenance_spares",
    "fleet_maintenance_labour",
    "fleet_licensing_payments",
    "fleet_other_expenses",
    "fleet_vehicles",
    "fleet_insurance",
    "crm_leads",
    "crm_customers",
  ];

  for (const t of tables) {
    const res = await client.query(`select count(*) from app.${t}`);
    console.log(`${t}: ${res.rows[0].count}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
