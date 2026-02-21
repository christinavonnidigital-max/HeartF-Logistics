// Simple GPS simulator: posts random-ish location updates to the ingest endpoint.
// Env:
//  GPS_SIM_BASE_URL (default http://localhost:8788)
//  GPS_SIM_VEHICLE_IDS (comma list)
//  GPS_SIM_INTERVAL_MS (default 5000)
//  ADMIN_API_TOKEN

const BASE_URL = process.env.GPS_SIM_BASE_URL || "http://localhost:8788";
const VEHICLE_IDS = (process.env.GPS_SIM_VEHICLE_IDS || "1,2,3,4,5")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter(Boolean);
const INTERVAL_MS = Number(process.env.GPS_SIM_INTERVAL_MS || 5000);
const TOKEN = process.env.ADMIN_API_TOKEN;

const defaults = {
  1: { lat: -17.8252, lng: 31.0335 }, // Harare
  2: { lat: -20.1581, lng: 28.5833 }, // Bulawayo
  3: { lat: -18.9707, lng: 32.6710 }, // Mutare
  4: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
  5: { lat: -17.8252, lng: 31.0335 }, // Harare
};

const state = new Map(
  VEHICLE_IDS.map((id) => {
    const base = defaults[id] || { lat: -17.8 + Math.random(), lng: 31 + Math.random() };
    return [id, { lat: base.lat, lng: base.lng, heading: Math.random() * 360, speed: 40 + Math.random() * 30 }];
  })
);

async function sendUpdate(vehicleId, data) {
  const res = await fetch(`${BASE_URL}/api/vehicle-locations/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { "x-admin-token": TOKEN } : {}),
    },
    body: JSON.stringify({
      vehicleId,
      latitude: data.lat,
      longitude: data.lng,
      speed: Math.round(data.speed),
      heading: Math.round(data.heading),
      timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("ingest failed", vehicleId, res.status, err);
  }
}

function tick() {
  for (const [id, data] of state.entries()) {
    const jitterLat = (Math.random() - 0.5) * 0.01;
    const jitterLng = (Math.random() - 0.5) * 0.01;
    data.lat += jitterLat;
    data.lng += jitterLng;
    data.heading = (data.heading + (Math.random() - 0.5) * 15 + 360) % 360;
    data.speed = Math.max(0, data.speed + (Math.random() - 0.4) * 5);
    sendUpdate(id, data);
  }
}

console.log(`GPS simulator started: ${VEHICLE_IDS.length} vehicles @ ${INTERVAL_MS}ms`);
tick();
setInterval(tick, INTERVAL_MS);
