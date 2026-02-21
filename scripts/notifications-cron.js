// Simple cron helper: enqueue dispatch job via HTTP
import fetch from "node-fetch";

const {
  CRON_DISPATCH_URL = "http://localhost:8788/api/notifications/dispatch",
  ADMIN_API_TOKEN,
} = process.env;

async function main() {
  const res = await fetch(CRON_DISPATCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_API_TOKEN ? { "x-admin-token": ADMIN_API_TOKEN } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Dispatch failed:", data);
    process.exit(1);
  }
  console.log("Dispatch ok", data);
}

main();
