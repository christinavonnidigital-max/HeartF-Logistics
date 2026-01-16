import React, { useEffect, useRef, useState } from "react";
import { Lead, LeadSource, LeadStatus, CompanySize, Industry } from "../types";
import {
  CloseIcon,
  SparklesIcon,
  SearchIcon,
  GlobeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  TagIcon,
} from "./icons";

type LeadProspectingCriteria = {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: string;
  forceRefresh?: boolean;
};

type LeadProspect = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  companySize?: string;
  industry?: string;
  summary?: string;
  intentSignal?: string;
  confidence?: number;
  sourceUrl?: string;
  contact?: { name?: string; title?: string; email?: string; phone?: string };

  verified?: boolean;
  sourcesCount?: number;
};

async function findPotentialLeads(criteria: LeadProspectingCriteria): Promise<{ results: LeadProspect[]; cached?: boolean; reasonHints?: string[] }> {
  const res = await fetch("/.netlify/functions/lead-finder-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(criteria),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Lead Finder failed");
  return { results: data?.results || [], cached: data?.cached, reasonHints: data?.reasonHints || [] };
}

interface LeadFinderModalProps {
  onClose: () => void;
  onImport: (leads: Omit<Lead, "id" | "created_at" | "updated_at" | "lead_score">[]) => void;
}

const SUGGESTED_QUERIES = [
  "Logistics managers in mining companies in Zimbabwe",
  "Operations heads at Zimbabwean FMCG exporters needing cross-border trucks",
  "Procurement leads at lithium mining startups in Southern Africa",
  "Cold chain directors at pharma distributors in Harare",
];

const INITIAL_FORM: LeadProspectingCriteria = {
  query: "Logistics freight forwarding",
  geography: "Harare",
  industryFocus: "Logistics",
  intentFocus: "freight forwarding",
  minHeadcount: "sme",
};

type LeadTier = "verified" | "high" | "candidate";

const getLeadTier = (p: LeadProspect): LeadTier => {
  const conf = Math.round(p.confidence ?? 0);
  const hasContact = Boolean(p.contact?.email || p.contact?.phone);
  if (p.verified === true || hasContact) return "verified";
  if (conf >= 80) return "high";
  return "candidate";
};

const mapCompanySize = (size?: string): CompanySize => {
  if (!size) return CompanySize.MEDIUM;
  const lower = size.toLowerCase();
  if (lower.includes("enterprise") || lower.includes("1000")) return CompanySize.ENTERPRISE;
  if (lower.includes("large") || lower.includes("500")) return CompanySize.LARGE;
  if (lower.includes("medium") || lower.includes("200")) return CompanySize.MEDIUM;
  if (lower.includes("startup") || lower.includes("early")) return CompanySize.STARTUP;
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
  return Industry.OTHER;
};

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

const prospectToLeadPayload = (prospect: LeadProspect): Omit<Lead, "id" | "created_at" | "updated_at" | "lead_score"> => {
  const contact = prospect.contact || {};
  const name = splitContactName(contact.name);
  const location = parseLocation(prospect.location);

  return {
    first_name: name.first,
    last_name: name.last,
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
    logistics_needs: prospect.intentSignal || prospect.summary || "High-potential logistics buyer discovered via lead finder.",
    notes: prospect.sourceUrl ? `Grounded via Google Search → ${prospect.sourceUrl}` : "Grounded via Google Search",
    tags: ["prospected", "lead-finder"].filter(Boolean),
    custom_fields: {
      ai_confidence: prospect.confidence ?? null,
      ai_summary: prospect.summary,
      sources_count: prospect.sourcesCount ?? null,
      verified: getLeadTier(prospect) === "verified",
    },
  };
};

const LeadFinderModal: React.FC<LeadFinderModalProps> = ({ onClose, onImport }) => {
  const [form, setForm] = useState<LeadProspectingCriteria>(INITIAL_FORM);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prospects, setProspects] = useState<LeadProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean>(false);
  const [reasonHints, setReasonHints] = useState<string[]>([]);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showHighPlus, setShowHighPlus] = useState(true);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markImported = (ids: string[]) => {
    setImportedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const tierRank: Record<LeadTier, number> = { verified: 3, high: 2, candidate: 1 };

  const sortedProspects = [...prospects].sort((a, b) => {
    const ta = getLeadTier(a);
    const tb = getLeadTier(b);
    if (ta !== tb) return tierRank[tb] - tierRank[ta];

    const ca = Math.round(a.confidence ?? 0);
    const cb = Math.round(b.confidence ?? 0);
    if (ca !== cb) return cb - ca;

    const wa = a.website ? 1 : 0;
    const wb = b.website ? 1 : 0;
    return wb - wa;
  });

  const visibleProspects = sortedProspects.filter((p) => {
    const tier = getLeadTier(p);
    if (showOnlyVerified) return tier === "verified";
    if (showHighPlus) return tier === "verified" || tier === "high";
    return true;
  });

  const handleSearch = async (opts?: { forceRefresh?: boolean }) => {
    if (!form.query.trim()) {
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
      const out = await findPotentialLeads(payload);

      setCached(Boolean(out.cached));
      setReasonHints(out.reasonHints || []);
      setProspects(out.results || []);

      if (!out.results || out.results.length === 0) {
        setError("No results found. Try broadening your keywords or location.");
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

  const handleImportSelection = () => {
    if (!selectedIds.size) return;
    const shortlisted = prospects.filter((p) => selectedIds.has(p.id));
    if (!shortlisted.length) return;

    onImport(shortlisted.map(prospectToLeadPayload));
    markImported(shortlisted.map((p) => p.id));
    showToast(`Added ${shortlisted.length} new ${shortlisted.length === 1 ? "lead" : "leads"}`);
  };

  const handleImportSingle = (p: LeadProspect) => {
    onImport([prospectToLeadPayload(p)]);
    markImported([p.id]);
  };

  const selectedCount = selectedIds.size;

  return (
    <>
      {toastMessage && (
        <div className="fixed inset-x-0 top-6 z-80 flex justify-center px-4">
          <div className="bg-card text-foreground text-sm font-medium px-4 py-3 rounded-2xl border border-border shadow-lg flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-orange-300" />
            {toastMessage}
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-70 flex items-center justify-center p-4 md:pl-64" onClick={onClose}>
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-orange-600" />
                Lead Finder
                {cached && <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">cached</span>}
              </div>
              <div className="text-xs text-slate-500">Grounded search. Import only what you want.</div>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 transition" aria-label="Close">
              <CloseIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: form */}
            <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-700 mb-2">Suggested</div>
              <div className="flex flex-wrap gap-2 mb-4">
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

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-slate-500" /> Query
                  </div>
                  <input
                    value={form.query}
                    onChange={(e) => setForm((p) => ({ ...p, query: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Freight forwarding companies"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-slate-500" /> Location
                  </div>
                  <input
                    value={form.geography || ""}
                    onChange={(e) => setForm((p) => ({ ...p, geography: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Harare, Zimbabwe"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-slate-500" /> Industry
                  </div>
                  <input
                    value={form.industryFocus || ""}
                    onChange={(e) => setForm((p) => ({ ...p, industryFocus: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Logistics"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-slate-500" /> Intent
                  </div>
                  <input
                    value={form.intentFocus || ""}
                    onChange={(e) => setForm((p) => ({ ...p, intentFocus: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="freight forwarding"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">Company size</div>
                  <input
                    value={form.minHeadcount || ""}
                    onChange={(e) => setForm((p) => ({ ...p, minHeadcount: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="sme"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="flex-1 h-11 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-60 transition"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSearch({ forceRefresh: true })}
                    disabled={isSearching}
                    className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 transition"
                    title="Bypass cache"
                  >
                    Fresh
                  </button>
                </div>

                {error && (
                  <div className="mt-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
                    {error}
                    {reasonHints.length > 0 && (
                      <ul className="mt-2 text-xs text-rose-700 list-disc pl-5 space-y-1">
                        {reasonHints.slice(0, 4).map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: results */}
            <div className="lg:col-span-8 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex gap-2">
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
                </div>

                <div className="text-xs text-slate-500">
                  Showing {visibleProspects.length} of {sortedProspects.length}
                </div>
              </div>

              {visibleProspects.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50">
                  <div className="text-sm font-semibold text-slate-900">No results yet</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Run a search, then refine keywords or broaden location.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {visibleProspects.map((prospect) => {
                    const imported = importedIds.has(prospect.id);
                    const selected = selectedIds.has(prospect.id);
                    const confidence = Math.round(prospect.confidence ?? 0);
                    const tier = getLeadTier(prospect);

                    return (
                      <div
                        key={prospect.id}
                        className={`border rounded-2xl p-4 bg-white shadow-sm transition ${
                          selected ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-bold text-slate-900 truncate">{prospect.companyName}</div>

                              {!imported && (
                                <>
                                  {tier === "verified" ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                                      <CheckCircleIcon className="w-4 h-4" />
                                      Verified
                                    </span>
                                  ) : tier === "high" ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                                      High match
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-semibold bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                                      Candidate
                                    </span>
                                  )}
                                </>
                              )}

                              {imported && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Added
                                </span>
                              )}
                            </div>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-slate-400" />
                                <span className="truncate">{prospect.location || "Location unknown"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <GlobeIcon className="w-4 h-4 text-slate-400" />
                                <span className="truncate">{prospect.website || prospect.sourceUrl || "No website"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-slate-400" />
                                <span className="truncate">{confidence}% confidence</span>
                              </div>
                            </div>

                            {typeof prospect.sourcesCount === "number" && (
                              <div className="text-[11px] text-slate-500 mt-1">Sources: {prospect.sourcesCount}</div>
                            )}

                            {tier === "verified" ? (
                              <div className="mt-2 text-[11px] text-emerald-700">Verified via contact info present</div>
                            ) : tier === "high" ? (
                              <div className="mt-2 text-[11px] text-amber-700">Strong match, no verified contact yet</div>
                            ) : null}

                            {prospect.summary && (
                              <div className="mt-3 text-sm text-slate-700 leading-relaxed">{prospect.summary}</div>
                            )}

                            {(prospect.contact?.name || prospect.contact?.email || prospect.contact?.phone) && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                  <UserCircleIcon className="w-4 h-4 text-slate-400" />
                                  <span className="truncate">{prospect.contact?.name || "Contact unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                                  <span className="truncate">{prospect.contact?.email || "No email"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                                  <span className="truncate">{prospect.contact?.phone || "No phone"}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleSelected(prospect.id)}
                              disabled={imported}
                              className={`h-9 px-3 rounded-xl text-xs font-bold transition ${
                                imported
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : selected
                                  ? "bg-orange-600 text-white hover:bg-orange-700"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {selected ? "Selected" : "Select"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleImportSingle(prospect)}
                              disabled={imported}
                              className={`h-9 px-3 rounded-xl text-xs font-bold transition ${
                                imported
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
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Selected: <span className="font-bold text-slate-900">{selectedCount}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const top = sortedProspects
                        .filter((p) => getLeadTier(p) === "verified")
                        .slice(0, 10)
                        .map((p) => p.id);
                      setSelectedIds(new Set(top));
                    }}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Select top verified
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCount}
                    onClick={handleImportSelection}
                    className="h-10 px-4 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-60 transition"
                  >
                    Import selected
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500">
            Tip: If you keep getting no results, click <span className="font-semibold">Fresh</span> to bypass cache.
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadFinderModal;
