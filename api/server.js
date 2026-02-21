import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import pg from "pg";
import { MailService } from "@sendgrid/mail";
import { GoogleGenAI } from "@google/genai";

const {
  DATABASE_URL,
  SENDGRID_API_KEY,
  SENDGRID_FROM,
  APP_BASE_URL = "http://localhost:4002",
  ADMIN_API_TOKEN,
  PORT = 8788,
  STREAM_ALLOW_ANY = "false",
} = process.env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!SENDGRID_API_KEY) console.warn("SENDGRID_API_KEY missing -- magic-link emails will not send");
if (!ADMIN_API_TOKEN) console.warn("ADMIN_API_TOKEN missing -- protected endpoints will reject requests");

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const USER_ROLE_BASE = ["admin", "ops_manager", "dispatcher", "finance", "customer", "driver", "marketing", "pending"];
let usersRoleCheckEnsurePromise = null;
let defaultOrgIdPromise = null;

const escapeSqlLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;

const ensurePendingUserRoleEnum = async () => {
  try {
    await pool.query(`alter type user_role add value if not exists 'pending'`);
  } catch (error) {
    const msg = String(error?.message || error || "").toLowerCase();
    if (msg.includes('type "user_role" does not exist')) return;
    if (msg.includes("must be owner of type user_role") || msg.includes("permission denied")) {
      console.warn("Could not auto-update user_role enum. Ensure it includes 'pending'.");
      return;
    }
    console.warn("Unable to ensure pending user role enum value:", error);
  }
};

const ensureUsersRoleCheckAllowsPending = async () => {
  if (usersRoleCheckEnsurePromise) return usersRoleCheckEnsurePromise;
  usersRoleCheckEnsurePromise = (async () => {
    try {
      const { rows } = await pool.query(
        `select distinct role::text as role from users where role is not null`
      );
      const allowed = new Set(USER_ROLE_BASE);
      for (const row of rows) {
        if (row?.role) allowed.add(String(row.role));
      }
      const literals = Array.from(allowed).map(escapeSqlLiteral).join(", ");
      await pool.query(`alter table users drop constraint if exists users_role_check`);
      await pool.query(
        `alter table users add constraint users_role_check check ((role::text = any (array[${literals}])))`
      );
    } catch (error) {
      const msg = String(error?.message || error || "").toLowerCase();
      if (msg.includes('relation "users" does not exist')) return;
      if (msg.includes("must be owner of table users") || msg.includes("permission denied")) {
        console.warn("Could not auto-update users role constraint. Ensure it allows 'pending'.");
        return;
      }
      console.warn("Unable to ensure users role constraint:", error);
    }
  })();
  return usersRoleCheckEnsurePromise;
};

const getDefaultOrgId = async () => {
  if (defaultOrgIdPromise) return defaultOrgIdPromise;
  defaultOrgIdPromise = (async () => {
    try {
      const { rows } = await pool.query(`select id from orgs order by created_at asc limit 1`);
      return rows?.[0]?.id ? String(rows[0].id) : null;
    } catch {
      return null;
    }
  })();
  return defaultOrgIdPromise;
};

const normalizeIdValue = (id) => {
  if (id === undefined || id === null) return null;
  const raw = String(id).trim();
  const numeric = Number(raw);
  if (raw && Number.isFinite(numeric) && !Number.isNaN(numeric)) return numeric;
  return raw;
};

const sg = new MailService();
if (SENDGRID_API_KEY) sg.setApiKey(SENDGRID_API_KEY);

const leadFinderApiKey =
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  "";
const leadFinderAi = leadFinderApiKey ? new GoogleGenAI({ apiKey: String(leadFinderApiKey).trim() }) : null;

const LEAD_FINDER_CACHE_TTL_MS = 15 * 60 * 1000;
const leadFinderCache = new Map();

const LEAD_FINDER_SYSTEM_INSTRUCTION = `
You are a B2B logistics lead prospector for Heartfledge Logistics.

Rules:
- You MUST use the googleSearch tool before answering.
- Do not fabricate contacts or companies.
- Every lead must include companyName and at least one of website/sourceUrl.
- If verified contact is unavailable, leave contact fields blank.
- Enforce excluded industries/keywords strictly.

Return JSON only.
`.trim();

const asList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const clampConfidence = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
};

const leadHashId = (value) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i);
  return Math.abs(hash >>> 0).toString(36);
};

const toNorm = (value) => String(value || "").trim();

const containsAnyText = (haystack, needles) => {
  const h = String(haystack || "").toLowerCase();
  return needles.some((n) => n && h.includes(String(n).toLowerCase()));
};

const normalizeLeadFinderInput = (body) => {
  const query = toNorm(body?.query);
  const geography = toNorm(body?.geography);
  const industryFocus = toNorm(body?.industryFocus);
  const intentFocus = toNorm(body?.intentFocus);
  const minHeadcount = toNorm(body?.minHeadcount);

  const legacyIndustry = toNorm(body?.industry);
  const legacyLocation = toNorm(body?.location);
  const legacyKeywords = toNorm(body?.keywords);
  const legacyCompanySize = toNorm(body?.companySize);

  const excludeIndustries = asList(body?.excludeIndustries);
  const excludeKeywords = asList(body?.excludeKeywords);

  return {
    query:
      query ||
      [legacyIndustry, legacyLocation, legacyKeywords]
        .filter(Boolean)
        .join(" ")
        .trim(),
    geography: geography || legacyLocation,
    industryFocus: industryFocus || legacyIndustry,
    intentFocus: intentFocus || legacyKeywords,
    minHeadcount: minHeadcount || legacyCompanySize,
    excludeIndustries,
    excludeKeywords,
    forceRefresh: Boolean(body?.forceRefresh),
  };
};

const extractLeadFinderText = (result) => {
  const candidates = result?.response?.candidates || result?.candidates || [];
  if (Array.isArray(candidates) && candidates.length) {
    return candidates
      .map((c) => (c?.content?.parts || []).map((p) => p?.text || "").join("\n"))
      .join("\n")
      .trim();
  }
  if (typeof result?.text === "string") return result.text;
  return "";
};

const extractLeadFinderJson = (text) => {
  if (!text) return null;
  const fenced = text.match(/```json([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const buildLeadFinderPrompt = (input) => {
  const excludedIndustries = input.excludeIndustries.length ? input.excludeIndustries.join(", ") : "(none)";
  const excludedKeywords = input.excludeKeywords.length ? input.excludeKeywords.join(", ") : "(none)";

  return `
Find 4-8 real companies likely to buy logistics, freight, or fleet services.

Search criteria:
- Query: ${input.query}
- Geography: ${input.geography || "(any)"}
- Industry: ${input.industryFocus || "(any)"}
- Intent: ${input.intentFocus || "(any)"}
- Company size/headcount: ${input.minHeadcount || "(any)"}

Exclusions (strict):
- Excluded industries: ${excludedIndustries}
- Excluded keywords: ${excludedKeywords}

Return JSON exactly as:
{
  "leads": [
    {
      "companyName": "",
      "summary": "",
      "location": "",
      "industry": "",
      "companySize": "",
      "website": "",
      "intentSignal": "",
      "contact": { "name": "", "title": "", "email": "", "phone": "", "linkedin": "" },
      "sourceUrl": "",
      "confidence": 0.0,
      "sourcesCount": 0,
      "verified": false
    }
  ]
}
`.trim();
};

const normalizeLeadFinderList = (payload, input) => {
  const raw = Array.isArray(payload?.leads) ? payload.leads : [];
  const reasonHints = [];
  const normalized = [];
  const excludedIndustries = input.excludeIndustries.map((s) => s.toLowerCase());
  const excludedKeywords = input.excludeKeywords.map((s) => s.toLowerCase());

  for (let i = 0; i < raw.length; i++) {
    const lead = raw[i] || {};
    const companyName = toNorm(lead.companyName);
    const website = toNorm(lead.website);
    const sourceUrl = toNorm(lead.sourceUrl);
    const summary = toNorm(lead.summary);
    const location = toNorm(lead.location);
    const industry = toNorm(lead.industry);
    const companySize = toNorm(lead.companySize);
    const intentSignal = toNorm(lead.intentSignal);
    const haystack = `${companyName} ${summary} ${industry} ${intentSignal} ${website} ${sourceUrl}`.toLowerCase();

    if (!companyName) {
      reasonHints.push("Dropped a lead with missing companyName.");
      continue;
    }
    if (!website && !sourceUrl) {
      reasonHints.push(`Dropped "${companyName}" (missing website/sourceUrl).`);
      continue;
    }
    if (excludedIndustries.length && containsAnyText(industry, excludedIndustries)) {
      reasonHints.push(`Excluded "${companyName}" due to industry exclusion.`);
      continue;
    }
    if (excludedKeywords.length && containsAnyText(haystack, excludedKeywords)) {
      reasonHints.push(`Excluded "${companyName}" due to keyword exclusion.`);
      continue;
    }

    const contact = lead.contact || {};
    normalized.push({
      id: leadHashId(`${companyName}|${website}|${sourceUrl}|${i}`),
      companyName,
      website: website || undefined,
      location: location || undefined,
      industry: industry || undefined,
      companySize: companySize || undefined,
      summary: summary || undefined,
      intentSignal: intentSignal || undefined,
      confidence: clampConfidence(lead.confidence),
      sourceUrl: sourceUrl || (website ? website : undefined),
      verified: Boolean(lead.verified),
      sourcesCount: typeof lead.sourcesCount === "number" ? lead.sourcesCount : undefined,
      contact: {
        name: toNorm(contact.name) || undefined,
        title: toNorm(contact.title) || undefined,
        email: toNorm(contact.email) || undefined,
        phone: toNorm(contact.phone) || undefined,
        linkedin: toNorm(contact.linkedin) || undefined,
      },
    });
  }

  const seen = new Set();
  const deduped = [];
  for (const p of normalized) {
    const key = `${p.companyName.toLowerCase()}|${(p.website || "").toLowerCase()}|${(p.sourceUrl || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(p);
  }

  deduped.sort((a, b) => {
    const av = a.verified ? 1 : 0;
    const bv = b.verified ? 1 : 0;
    if (av !== bv) return bv - av;
    return (b.confidence || 0) - (a.confidence || 0);
  });

  return { results: deduped, reasonHints };
};

const app = express();
app.use(cors());
app.use(express.json());

const columnCache = new Map();

const camelToSnake = (value) =>
  value.replace(/([A-Z])/g, "_$1").replace(/__/g, "_").toLowerCase();

const escapeIdentifier = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;

const getTableColumns = async (table) => {
  if (columnCache.has(table)) return columnCache.get(table);
  const { rows } = await pool.query(
    `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
    [table]
  );
  const columns = new Set(rows.map((r) => r.column_name));
  columnCache.set(table, columns);
  return columns;
};

const normalizePayload = (payload, columns) => {
  if (!payload || typeof payload !== "object") return {};
  const mapped = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (columns.has(key)) {
      mapped[key] = value;
      continue;
    }
    const snake = camelToSnake(key);
    if (columns.has(snake)) mapped[snake] = value;
  }
  return mapped;
};

const handleCrud = async (req, res, table, options = {}) => {
  try {
    const columns = await getTableColumns(table);
    if (!columns.size) return res.status(500).json({ error: "table_not_found" });

    const tableIdent = escapeIdentifier(table);
    const id = req.query.id;
    const idValue = normalizeIdValue(id);

    if (req.method === "GET") {
      if (id) {
        const { rows } = await pool.query(`select * from ${tableIdent} where id=$1`, [idValue]);
        return res.json(rows[0] || null);
      }
      if (options.getByEmail && req.query.email) {
        const email = String(req.query.email || "").toLowerCase();
        const { rows } = await pool.query(
          `select * from ${tableIdent} where lower(email)=$1 limit 1`,
          [email]
        );
        return res.json(rows[0] || null);
      }
      if (options.filterStatus && req.query.status) {
        const { rows } = await pool.query(
          `select * from ${tableIdent} where status=$1 order by id desc`,
          [String(req.query.status)]
        );
        return res.json(rows);
      }
      const { rows } = await pool.query(`select * from ${tableIdent} order by id desc`);
      return res.json(rows);
    }

    if (req.method === "POST") {
      const data = normalizePayload(req.body, columns);
      delete data.id;
      if (table === "users") {
        await ensureUsersRoleCheckAllowsPending();
        if (typeof data.email === "string") data.email = data.email.toLowerCase().trim();
        if (columns.has("org_id") && !data.org_id) {
          const orgId = await getDefaultOrgId();
          if (orgId) data.org_id = orgId;
        }
        if (columns.has("password_hash") && !data.password_hash) {
          data.password_hash = "__neon_auth_managed__";
        }
        if (columns.has("role") && !data.role) {
          data.role = "pending";
        }
      }
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: "no_fields" });
      const values = keys.map((k) => data[k]);
      const columnsSql = keys.map(escapeIdentifier).join(", ");
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
      try {
        const { rows } = await pool.query(
          `insert into ${tableIdent} (${columnsSql}) values (${placeholders}) returning *`,
          values
        );
        return res.status(201).json(rows[0]);
      } catch (error) {
        // Signup retries/races are expected. Return existing user instead of a hard 500.
        if (table === "users" && error?.code === "23505" && data.email) {
          const email = String(data.email).toLowerCase().trim();
          const query =
            columns.has("org_id") && data.org_id
              ? `select * from ${tableIdent} where org_id=$1 and lower(email)=$2 limit 1`
              : `select * from ${tableIdent} where lower(email)=$1 limit 1`;
          const params = columns.has("org_id") && data.org_id ? [data.org_id, email] : [email];
          const existing = await pool.query(query, params);
          if (existing.rows?.[0]) return res.status(200).json(existing.rows[0]);
        }
        throw error;
      }
    }

    if (req.method === "PUT") {
      if (!id) return res.status(400).json({ error: "id required" });
      const data = normalizePayload(req.body, columns);
      delete data.id;
      if (table === "users" && data.role != null) {
        await ensureUsersRoleCheckAllowsPending();
      }
      if (columns.has("updated_at") && data.updated_at === undefined) {
        data.updated_at = new Date().toISOString();
      }
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: "no_fields" });
      const setSql = keys.map((k, idx) => `${escapeIdentifier(k)}=$${idx + 1}`).join(", ");
      const values = keys.map((k) => data[k]);
      values.push(idValue);
      const { rows } = await pool.query(
        `update ${tableIdent} set ${setSql} where id=$${keys.length + 1} returning *`,
        values
      );
      return res.json(rows[0] || null);
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ error: "id required" });
      await pool.query(`delete from ${tableIdent} where id=$1`, [idValue]);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Database error" });
  }
};

const dbRoutes = [
  { path: "db-vehicles", table: "vehicles" },
  { path: "db-customers", table: "customers" },
  { path: "db-bookings", table: "bookings" },
  { path: "db-drivers", table: "drivers" },
  { path: "db-leads", table: "leads" },
  { path: "db-invoices", table: "invoices" },
  { path: "db-expenses", table: "expenses" },
  { path: "db-opportunities", table: "opportunities" },
  { path: "db-users", table: "users", options: { getByEmail: true } },
  { path: "db-notifications", table: "notifications", options: { filterStatus: true } },
];

dbRoutes.forEach(({ path, table, options }) => {
  app.all(`/api/${path}`, (req, res) => handleCrud(req, res, table, options));
});

app.post("/api/lead-finder-search", async (req, res) => {
  try {
    if (!leadFinderAi) {
      return res.status(500).json({ ok: false, error: "Lead Finder AI is not configured on the server." });
    }

    const input = normalizeLeadFinderInput(req.body || {});
    if (!input.query) {
      return res.status(400).json({ ok: false, error: "Missing query. Provide query or industry/location/keywords." });
    }

    const key = JSON.stringify({
      query: input.query,
      geography: input.geography,
      industryFocus: input.industryFocus,
      intentFocus: input.intentFocus,
      minHeadcount: input.minHeadcount,
      excludeIndustries: input.excludeIndustries,
      excludeKeywords: input.excludeKeywords,
    });

    if (!input.forceRefresh) {
      const hit = leadFinderCache.get(key);
      if (hit && Date.now() - hit.createdAt <= LEAD_FINDER_CACHE_TTL_MS) {
        return res.json({ ok: true, cached: true, results: hit.results, reasonHints: hit.reasonHints || [] });
      }
    }

    const prompt = buildLeadFinderPrompt(input);
    const result = await leadFinderAi.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: LEAD_FINDER_SYSTEM_INSTRUCTION,
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 4096,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = extractLeadFinderText(result);
    const payload = extractLeadFinderJson(rawText);
    if (!payload) {
      return res.status(500).json({
        ok: false,
        error: "Model did not return valid JSON.",
        detail: rawText.slice(0, 1500),
      });
    }

    const { results, reasonHints } = normalizeLeadFinderList(payload, input);
    leadFinderCache.set(key, { createdAt: Date.now(), results, reasonHints });

    return res.json({ ok: true, cached: false, results, reasonHints });
  } catch (e) {
    console.error("lead finder search error", e);
    return res.status(500).json({ ok: false, error: "lead_finder_failed", detail: String(e?.message || e) });
  }
});

const ensureGpsTable = async () => {
  await pool.query(`
    create table if not exists gps_locations (
      id serial primary key,
      vehicle_id integer not null,
      driver_id integer,
      booking_id integer,
      latitude numeric(10,7) not null,
      longitude numeric(10,7) not null,
      speed numeric(6,2),
      heading numeric(6,2),
      timestamp timestamptz not null default now(),
      created_at timestamptz not null default now()
    );
    create index if not exists gps_locations_vehicle_idx on gps_locations(vehicle_id);
    create index if not exists gps_locations_time_idx on gps_locations(timestamp);
  `);
};

// --- Simple SSE broker for realtime updates ---
const clients = new Set();
const HEARTBEAT_MS = 25000;

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      // drop dead connections
      clients.delete(res);
    }
  }
}

app.get("/api/stream", (req, res) => {
  const token = req.query.token;
  const allowAny = STREAM_ALLOW_ANY === "true";
  if (!allowAny && ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).end();
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("retry: 3000\n\n");
  clients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

app.post("/api/events/publish", (req, res) => {
  const token = req.header("x-admin-token") || req.query.token;
  if (ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const { type, payload } = req.body || {};
  if (!type) return res.status(400).json({ error: "type required" });
  broadcast({ type, payload, at: Date.now() });
  return res.json({ ok: true, delivered: clients.size });
});

// GPS ingest + latest endpoints
app.post("/api/vehicle-locations/ingest", async (req, res) => {
  const token = req.header("x-admin-token") || req.query.token;
  if (ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const { vehicleId, driverId, bookingId, latitude, longitude, speed, heading, timestamp } = req.body || {};
    if (!vehicleId || latitude == null || longitude == null) {
      return res.status(400).json({ error: "vehicleId, latitude, longitude required" });
    }
    await ensureGpsTable();
    const result = await pool.query(
      `insert into gps_locations(vehicle_id, driver_id, booking_id, latitude, longitude, speed, heading, timestamp)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning *`,
      [
        Number(vehicleId),
        driverId ? Number(driverId) : null,
        bookingId ? Number(bookingId) : null,
        Number(latitude),
        Number(longitude),
        speed != null ? Number(speed) : null,
        heading != null ? Number(heading) : null,
        timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      ]
    );
    const row = result.rows[0];
    broadcast({ type: "vehicle.location", payload: row, at: Date.now() });
    res.json({ ok: true, location: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gps_ingest_failed", detail: String(e.message || e) });
  }
});

app.get("/api/vehicle-locations/latest", async (req, res) => {
  const token = req.header("x-admin-token") || req.query.token;
  if (ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const vehicleId = req.query.vehicleId;
    await ensureGpsTable();
    if (vehicleId) {
      const { rows } = await pool.query(
        `select * from gps_locations where vehicle_id=$1 order by timestamp desc limit 1`,
        [Number(vehicleId)]
      );
      return res.json(rows[0] || null);
    }
    const { rows } = await pool.query(
      `select distinct on (vehicle_id) *
       from gps_locations
       order by vehicle_id, timestamp desc`
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gps_latest_failed", detail: String(e.message || e) });
  }
});

const ensureTable = async () => {
  await pool.query(`
    create table if not exists customer_magic_links (
      id text primary key default md5(random()::text),
      customer_id text not null,
      email text not null,
      token_hash text not null,
      expires_at timestamptz not null,
      created_at timestamptz not null default now(),
      used_at timestamptz
    );
    create index if not exists customer_magic_links_token_hash_idx on customer_magic_links(token_hash);
    create index if not exists customer_magic_links_expires_at_idx on customer_magic_links(expires_at);
  `);
};

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const randomToken = () => crypto.randomBytes(24).toString("hex");

app.post("/api/magic-links/send", async (req, res) => {
  try {
    const { customerId, email, expiresMinutes = 60 } = req.body || {};
    if (!customerId || !email) return res.status(400).json({ error: "customerId and email required" });

    await ensureTable();
    const token = randomToken();
    const tokenHash = sha256(token);
    const expires = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await pool.query(
      `insert into customer_magic_links(customer_id, email, token_hash, expires_at)
       values ($1,$2,$3,$4)`,
      [String(customerId), String(email).toLowerCase().trim(), tokenHash, expires.toISOString()]
    );

    const link = `${APP_BASE_URL.replace(/\/+$/, "")}/customer-portal?token=${encodeURIComponent(token)}`;

    if (SENDGRID_API_KEY && SENDGRID_FROM) {
      await sg.send({
        to: email,
        from: SENDGRID_FROM,
        subject: "Your Heartfledge portal link",
        text: `View your account: ${link}\nThis link expires at ${expires.toISOString()}`,
        html: `<p>View your account: <a href="${link}">${link}</a></p><p>Expires at ${expires.toISOString()}</p>`,
      });
    }

    res.json({ ok: true, link, expiresAt: expires.toISOString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e.message || e) });
  }
});

app.get("/api/customer-portal/validate", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "token required" });
    await ensureTable();
    const tokenHash = sha256(String(token));
    const result = await pool.query(
      `select customer_id, email, expires_at, used_at
       from customer_magic_links
       where token_hash = $1
       order by created_at desc
       limit 1`,
      [tokenHash]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: "invalid_token" });
    const row = result.rows[0];
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(401).json({ error: "expired" });
    res.json({ ok: true, customerId: row.customer_id, email: row.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e.message || e) });
  }
});

app.post("/api/maintenance-scan", async (req, res) => {
  const token = req.header("x-admin-token") || req.query.token;
  if (ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const leadDays = Number(process.env.MAINTENANCE_LEAD_DAYS || 7);
    const targetDate = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `select id, registration_number, next_service_due_date
       from vehicles
       where next_service_due_date is not null
       and next_service_due_date <= $1`,
      [targetDate.toISOString()]
    );

    const recipientEmail = process.env.MAINTENANCE_ALERT_EMAIL || "";
    for (const vehicle of rows) {
      await pool.query(
        `insert into notifications(type, entity_id, recipient_email, status, payload)
         values ($1,$2,$3,$4,$5)`,
        [
          "maintenance.due",
          vehicle.id,
          recipientEmail,
          "queued",
          JSON.stringify({
            vehicle: vehicle.registration_number,
            due_date: vehicle.next_service_due_date,
          }),
        ]
      );
    }

    res.json({ ok: true, queued: rows.length, leadDays });
  } catch (e) {
    console.error("maintenance scan error", e);
    res.status(500).json({ error: "scan_failed" });
  }
});

ensurePendingUserRoleEnum().catch(() => {
  // Non-fatal. Signups will fail to persist pending users until role enum is updated.
});

app.listen(PORT, () => {
  console.log(`Magic link API listening on :${PORT}`);
});

// Notification dispatch (queued -> SendGrid)
app.post("/api/notifications/dispatch", async (req, res) => {
  const token = req.header("x-admin-token") || req.query.token;
  if (ADMIN_API_TOKEN && token !== ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!SENDGRID_API_KEY || !SENDGRID_FROM) {
    return res.status(400).json({ error: "sendgrid_not_configured" });
  }
  try {
    const { rows } = await pool.query(
      `select id, type, recipient_email, payload
       from notifications
       where status = 'queued'
       order by created_at asc
       limit 20`
    );
    let sent = 0;
    for (const row of rows) {
      const payload = row && row.payload ? row.payload : {};
      const bookingRef = payload.booking_number || row.entity_id;
      const invoiceRef = payload.invoice_number || row.entity_id;
      const statusSuffix = payload.status ? ` -> ${payload.status}` : "";

      const subject =
        row.type === "booking.created"
          ? `Booking created: ${bookingRef}`
          : row.type === "booking.status"
          ? `Booking update: ${bookingRef}${statusSuffix}`
          : row.type === "maintenance.due"
          ? `Maintenance due: Vehicle ${payload.vehicle || row.entity_id}`
          : row.type === "invoice.overdue"
          ? `Invoice overdue: ${invoiceRef}`
          : `Heartfledge: ${row.type}`;

      const body = `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
          <p>Type: <strong>${row.type}</strong></p>
          <p>Details:</p>
          <pre style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">${JSON.stringify(
            row.payload,
            null,
            2
          )}</pre>
          <p style="margin-top:16px;">Sent automatically by Heartfledge.</p>
        </div>`;
      try {
        await sg.send({
          to: row.recipient_email,
          from: SENDGRID_FROM,
          subject,
          html: body,
        });
        await pool.query(
          `update notifications set status='sent', sent_at=now(), error=null where id=$1`,
          [row.id]
        );
        sent += 1;
      } catch (err) {
        await pool.query(
          `update notifications set status='failed', failed_at=now(), error=$2 where id=$1`,
          [row.id, String(err?.message || err)]
        );
      }
    }
    res.json({ ok: true, processed: rows.length, sent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dispatch_failed", detail: String(e.message || e) });
  }
});
