// Cron helper to enqueue maintenance reminders
import fetch from "node-fetch";

const {
  CRON_MAINTENANCE_URL = "http://localhost:8788/api/maintenance-scan",
  ADMIN_API_TOKEN,
} = process.env;

async function main() {
  const res = await fetch(CRON_MAINTENANCE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_API_TOKEN ? { "x-admin-token": ADMIN_API_TOKEN } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Maintenance scan failed:", data);
    process.exit(1);
  }
  console.log("Maintenance scan ok", data);
}

main();
