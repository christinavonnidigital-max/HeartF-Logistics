import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShellCard, Button, SectionHeader, StatusPill, Input, Select } from "./UiKit";
import {
  SearchIcon,
  UploadIcon,
  SparklesIcon,
  GlobeIcon,
  MapPinIcon,
  TagIcon,
  CheckCircleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "./icons";
import { ProspectDetailsModal, type LeadFinderResult } from "./ProspectDetailsModal";
import { OutreachEmailModal } from "./OutreachEmailModal";
import { useData } from "../contexts/DataContext";
import { CompanySize, Industry, Lead, LeadSource, LeadStatus } from "../types";

type LeadProspectingCriteria = {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: string;
  forceRefresh?: boolean;
};

type LeadProspect = LeadFinderResult & {
  companySize?: string;
  industry?: string;
  intentSignal?: string;
  sourcesCount?: number;
  alreadyInCrm?: boolean;
  alreadyReason?: string;
};

type SearchResponse = {
  ok?: boolean;
  results?: LeadProspect[];
  cached?: boolean;
  reasonHints?: string[];
};

const SUGGESTED_QUERIES = [
  "Logistics managers in mining companies in Zimbabwe",
  "Operations heads at Zimbabwean FMCG exporters needing cross-border trucks",
  "Procurement leads at lithium mining startups in Southern Africa",
  "Cold chain directors at pharma distributors in Harare",
];

const companySizeOptions = [
  { value: "any", label: "Any" },
  { value: "micro", label: "Micro" },
  { value: "sme", label: "SME" },
  { value: "enterprise", label: "Enterprise" },
];

const confidencePct = (c?: number) => {
  const n = Number(c ?? 0);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

type Tier = "verified" | "high" | "candidate";
const getTier = (r: LeadProspect): Tier => {
  const conf = confidencePct(r.confidence);
  const hasContact = Boolean(r.contact?.email || r.contact?.phone);
  if (r.verified || hasContact) return "verified";
  if (conf >= 80) return "high";
  return "candidate";
};

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "").trim();

const splitContactName = (fullName?: string) => {
  if (!fullName) return { first: "", last: "" };
  const pieces = fullName.trim().split(/\s+/);
  if (pieces.length === 1) return { first: pieces[0], last: "" };
  const first = pieces.shift() || "";
  return { first, last: pieces.join(" ") };
};

const parseLocation = (location?: string) => {
  if (!location) return { city: "", country: "" };
  const parts = location.split(",").map((t) => t.trim()).filter(Boolean);
  if (!parts.length) return { city: "", country: "" };
  if (parts.length === 1) return { city: parts[0], country: parts[0] };
  const country = parts.pop() || "";
  const city = parts.join(", ");
  return { city, country };
};

const mapCompanySize = (size?: string): CompanySize => {
  if (!size) return CompanySize.MEDIUM;
  const lower = size.toLowerCase();
  if (lower.includes("enterprise") || lower.includes("1000")) return CompanySize.ENTERPRISE;
  if (lower.includes("large") || lower.includes("500")) return CompanySize.LARGE;
  if (lower.includes("medium") || lower.includes("200")) return CompanySize.MEDIUM;
  if (lower.includes("startup") || lower.includes("early")) return CompanySize.STARTUP;
  if (lower.includes("micro")) return (CompanySize as any).MICRO ?? CompanySize.SMALL;
  return CompanySize.SMALL;
};

const mapIndustry = (industry?: string): Industry => {
  if (!industry) return Industry.OTHER;
  const lower = industry.toLowerCase();
  if (lower.includes("mining")) return Industry.MINING;
  if (lower.includes("agri")) return Industry.AGRICULTURE;
  if (lower.includes("fmcg") || lower.includes("retail")) return Industry.FMCG;
  if (lower.includes("manufact")) return Industry.MANUFACTURING;
  if (lower.includes("wholesale")) return Industry.WHOLESALE;
  if (lower.includes("logistics") || lower.includes("freight")) return (Industry as any).LOGISTICS ?? Industry.OTHER;
  return Industry.OTHER;
};

const prospectToLeadPayload = (prospect: LeadProspect): Omit<Lead, "id" | "created_at" | "updated_at"> => {
  const contact = prospect.contact || {};
  const name = splitContactName(contact.name);
  const location = parseLocation(prospect.location);

  return {
    first_name: name.first || "Unknown",
    last_name: name.last || "Contact",
    email: contact.email || "",
    phone: contact.phone || "",
    company_name: prospect.companyName,
    lead_source: LeadSource.COLD_OUTREACH,
    lead_status: LeadStatus.NEW,
    company_size: mapCompanySize(prospect.companySize),
    industry: mapIndustry(prospect.industry),
    position: contact.title || "Operations Lead",
    website: prospect.website || prospect.sourceUrl || "",
    address: "",
    city: location.city,
    country: location.country,
    logistics_needs:
      prospect.intentSignal || prospect.summary || "High-potential logistics buyer discovered via lead finder.",
    current_provider: "",
    monthly_shipment_volume: "",
    preferred_routes: "",
    assigned_to: null as any,
    next_action: "",
    next_action_date: "",
    notes: prospect.sourceUrl ? `Grounded via Google Search → ${prospect.sourceUrl}` : "Grounded via Google Search",
    tags: ["prospected", "lead-finder"].filter(Boolean) as any,
    custom_fields: {
      ai_confidence: confidencePct(prospect.confidence),
      ai_summary: prospect.summary,
      sources_count: prospect.sourcesCount ?? null,
      verified: getTier(prospect) === "verified",
      source_url: prospect.sourceUrl || prospect.website || null,
    } as any,
  } as any;
};

const LeadFinderPage: React.FC = () => {
  const { leads, addLead } = useData();

  const [form, setForm] = useState<LeadProspectingCriteria>({
    query: "Logistics freight forwarding",
    geography: "Harare",
    industryFocus: "Logistics",
    intentFocus: "freight forwarding",
    minHeadcount: "sme",
  });

  const [prospects, setProspects] = useState<LeadProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isSearching, setIsSearching] = useState(false);
  const [cached, setCached] = useState(false);
  const [reasonHints, setReasonHints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showHighPlus, setShowHighPlus] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [activeProspect, setActiveProspect] = useState<LeadProspect | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  const openDetails = (p: LeadProspect) => {
    setActiveProspect(p);
    setDetailsOpen(true);
  };

  const openDraftEmail = (p: LeadProspect) => {
    setActiveProspect(p);
    setEmailOpen(true);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const existingIndex = useMemo(() => {
    const emails = new Set<string>();
    const phones = new Set<string>();
    const companies = new Set<string>();

    for (const l of leads) {
      if (l.email) emails.add(String(l.email).toLowerCase().trim());
      if (l.phone) phones.add(normalizePhone(String(l.phone)));
      if (l.company_name) companies.add(String(l.company_name).toLowerCase().trim());
    }
    return { emails, phones, companies };
  }, [leads]);

  const prospectsWithDedupe = useMemo(() => {
    return prospects.map((p) => {
      const email = String(p.contact?.email || "").toLowerCase().trim();
      const phone = normalizePhone(String(p.contact?.phone || ""));
      const company = String(p.companyName || "").toLowerCase().trim();

      const emailHit = email && existingIndex.emails.has(email);
      const phoneHit = phone && existingIndex.phones.has(phone);
      const companyHit = company && existingIndex.companies.has(company);

      if (!emailHit && !phoneHit && !companyHit) return p;

      const reasons: string[] = [];
      if (emailHit) reasons.push("email");
      if (phoneHit) reasons.push("phone");
      if (companyHit) reasons.push("company");

      return {
        ...p,
        alreadyInCrm: true,
        alreadyReason: `Matched existing lead by ${reasons.join(", ")}`,
      };
    });
  }, [prospects, existingIndex]);

  const tierRank: Record<Tier, number> = { verified: 3, high: 2, candidate: 1 };

  const sortedProspects = useMemo(() => {
    const arr = [...prospectsWithDedupe];
    arr.sort((a, b) => {
      const ta = getTier(a);
      const tb = getTier(b);
      if (ta !== tb) return tierRank[tb] - tierRank[ta];

      const ca = confidencePct(a.confidence);
      const cb = confidencePct(b.confidence);
      if (ca !== cb) return cb - ca;

      const wa = a.website || a.sourceUrl ? 1 : 0;
      const wb = b.website || b.sourceUrl ? 1 : 0;
      return wb - wa;
    });
    return arr;
  }, [prospectsWithDedupe]);

  const visibleProspects = useMemo(() => {
    return sortedProspects.filter((p) => {
      const tier = getTier(p);
      if (showOnlyVerified) return tier === "verified";
      if (showHighPlus) return tier === "verified" || tier === "high";
      return true;
    });
  }, [sortedProspects, showOnlyVerified, showHighPlus]);

  const selectedCount = selectedIds.size;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Unexpected response. Make sure Netlify functions are running (netlify dev).");
    }
  };

  const handleSearch = async (opts?: { forceRefresh?: boolean }) => {
    if (!form.query?.trim()) {
      setError("Tell the assistant what to look for.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setProspects([]);
    setSelectedIds(new Set());
    setCached(false);
    setReasonHints([]);

    try {
      const payload: LeadProspectingCriteria = { ...form, forceRefresh: Boolean(opts?.forceRefresh) };

      const res = await fetch("/.netlify/functions/lead-finder-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data: SearchResponse = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.error || "Lead Finder failed");

      const results = (data.results || []) as LeadProspect[];
      setProspects(results);
      setCached(Boolean(data.cached));
      setReasonHints(Array.isArray(data.reasonHints) ? data.reasonHints : []);

      if (!results.length) {
        setError("No results found. Try broadening your keywords or location.");
      } else {
        showToast(`Found ${results.length} companies`);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes("unauth")) setError("You are not logged in. Please log in and try again.");
      else if (msg.includes("429")) setError("Rate limit reached. Wait a moment and try again.");
      else setError(msg || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const importProspects = (list: LeadProspect[]) => {
    const importable = list.filter((p) => !p.alreadyInCrm);
    const skipped = list.length - importable.length;

    if (!importable.length) {
      showToast("Nothing to import (all selected items already exist in CRM).");
      return;
    }

    importable.forEach((p) => addLead(prospectToLeadPayload(p)));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      importable.forEach((p) => next.delete(p.id));
      return next;
    });

    showToast(
      skipped > 0
        ? `Imported ${importable.length} lead(s). Skipped ${skipped} duplicate(s).`
        : `Imported ${importable.length} lead(s).`
    );
  };

  const importSelected = () => {
    const list = sortedProspects.filter((p) => selectedIds.has(p.id));
    if (!list.length) return;
    importProspects(list);
  };

  const importSingle = (p: LeadProspect) => {
    importProspects([p]);
  };

  const selectTopVerified = () => {
    const ids = sortedProspects
      .filter((p) => getTier(p) === "verified" && !p.alreadyInCrm)
      .slice(0, 12)
      .map((p) => p.id);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="space-y-5">
      <ProspectDetailsModal
        isOpen={detailsOpen}
        prospect={activeProspect}
        onClose={() => setDetailsOpen(false)}
        onDraftEmail={(p) => {
          setDetailsOpen(false);
          openDraftEmail(p as LeadProspect);
        }}
      />

      <OutreachEmailModal isOpen={emailOpen} prospect={activeProspect} onClose={() => setEmailOpen(false)} />

      {toastMessage ? (
        <div className="fixed inset-x-0 top-6 z-80 flex justify-center px-4">
          <div className="bg-card text-foreground text-sm font-medium px-4 py-3 rounded-2xl border border-border shadow-lg flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-orange-300" />
            {toastMessage}
          </div>
        </div>
      ) : null}

      <ShellCard className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionHeader
            title="Lead Finder"
            subtitle="Grounded search for target companies. Review details, draft outreach, then import."
          />

          <div className="flex items-center gap-2">
            {cached ? <StatusPill tone="info" label="cached" /> : null}
            <Button variant="secondary" onClick={() => handleSearch({ forceRefresh: true })} disabled={isSearching}>
              Fresh
            </Button>
            <Button variant="primary" onClick={() => handleSearch()} disabled={isSearching}>
              <SearchIcon className="w-4 h-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition"
              onClick={() => setForm((p) => ({ ...p, query: q }))}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Query</label>
            <Input
              value={form.query}
              onChange={(e: any) => setForm((p) => ({ ...p, query: e.target.value }))}
              placeholder="e.g. Cold chain distributors needing deliveries"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <Input
              value={form.geography || ""}
              onChange={(e: any) => setForm((p) => ({ ...p, geography: e.target.value }))}
              placeholder="Harare, Zimbabwe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
            <Input
              value={form.industryFocus || ""}
              onChange={(e: any) => setForm((p) => ({ ...p, industryFocus: e.target.value }))}
              placeholder="Logistics, Mining, FMCG..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intent</label>
            <Input
              value={form.intentFocus || ""}
              onChange={(e: any) => setForm((p) => ({ ...p, intentFocus: e.target.value }))}
              placeholder="freight forwarding"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company size</label>
            <Select
              value={form.minHeadcount && form.minHeadcount !== "" ? form.minHeadcount : "any"}
              onChange={(e: any) =>
                setForm((p) => ({ ...p, minHeadcount: e.target.value === "any" ? "" : e.target.value }))
              }
            >
              {companySizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
            {error}
            {reasonHints.length > 0 ? (
              <ul className="mt-2 text-xs text-rose-700 list-disc pl-5 space-y-1">
                {reasonHints.slice(0, 5).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </ShellCard>

      <ShellCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Results</h3>
            <p className="text-xs text-slate-500">Review details and draft outreach before importing.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOnlyVerified((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                showOnlyVerified ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              Verified only
            </button>
            <button
              type="button"
              onClick={() => setShowHighPlus((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                showHighPlus ? "bg-amber-600 text-white border-amber-600" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              High match+
            </button>

            <Button variant="secondary" size="sm" onClick={selectTopVerified} disabled={sortedProspects.length === 0}>
              Select top verified
            </Button>

            <Button variant="secondary" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>
              Clear
            </Button>

            <Button variant="primary" size="sm" onClick={importSelected} disabled={selectedCount === 0}>
              <UploadIcon className="w-4 h-4" />
              Import selected ({selectedCount})
            </Button>
          </div>
        </div>

        {isSearching && prospects.length === 0 ? <div className="text-sm text-slate-500">Searching…</div> : null}

        {!isSearching && sortedProspects.length === 0 ? (
          <div className="text-sm text-slate-500">No results yet. Run a search.</div>
        ) : null}

        {sortedProspects.length > 0 ? (
          <div className="text-xs text-slate-500 mb-3">
            Showing {visibleProspects.length} of {sortedProspects.length}
          </div>
        ) : null}

        <div className="space-y-3">
          {visibleProspects.map((p) => {
            const tier = getTier(p);
            const conf = confidencePct(p.confidence);
            const selected = selectedIds.has(p.id);
            const link = p.website || p.sourceUrl || "";

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 bg-white shadow-sm transition ${
                  selected ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelected(p.id)}
                    className="mt-1"
                    disabled={Boolean(p.alreadyInCrm)}
                    title={p.alreadyInCrm ? p.alreadyReason || "Already in CRM" : "Select"}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900 truncate">{p.companyName || "Untitled company"}</div>

                      {p.alreadyInCrm ? (
                        <StatusPill tone="info" label="Already in CRM" />
                      ) : tier === "verified" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircleIcon className="w-4 h-4" />
                          Verified
                        </span>
                      ) : tier === "high" ? (
                        <StatusPill tone="warn" label="High match" />
                      ) : (
                        <StatusPill tone="info" label={`Candidate ${conf}%`} />
                      )}

                      <span className="text-xs text-slate-500">{conf}%</span>
                      {typeof p.sourcesCount === "number" ? (
                        <span className="text-xs text-slate-500">• Sources: {p.sourcesCount}</span>
                      ) : null}
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPinIcon className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{p.location || "Location unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <TagIcon className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{p.industry || "Industry unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <GlobeIcon className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{p.website || p.sourceUrl || "No website"}</span>
                      </div>
                    </div>

                    {p.summary ? (
                      <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{p.summary}</div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">No description provided.</div>
                    )}

                    {p.intentSignal ? (
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-semibold">Intent:</span> {p.intentSignal}
                      </div>
                    ) : null}

                    {p.contact?.name || p.contact?.email || p.contact?.phone ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCircleIcon className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{p.contact?.name || "Contact"}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{p.contact?.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <PhoneIcon className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{p.contact?.phone || "No phone"}</span>
                        </div>
                      </div>
                    ) : null}

                    {p.alreadyInCrm && p.alreadyReason ? (
                      <div className="mt-2 text-[11px] text-slate-500">{p.alreadyReason}</div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => openDetails(p)}>
                      Details
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openDraftEmail(p)}>
                      Draft email
                    </Button>

                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 rounded-xl text-xs font-bold transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                        title="Open source"
                      >
                        Open
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="h-9 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                        disabled
                        title="No link available"
                      >
                        Open
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => importSingle(p)}
                      disabled={Boolean(p.alreadyInCrm)}
                      className={`h-9 px-3 rounded-xl text-xs font-bold transition ${
                        p.alreadyInCrm
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-orange-600 text-white hover:bg-orange-700"
                      }`}
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ShellCard>
    </div>
  );
};

export default LeadFinderPage;
