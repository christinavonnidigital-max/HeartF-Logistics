import React, { useMemo, useState } from "react";
import { ShellCard, Button, SectionHeader, StatusPill, Input, Select } from "./UiKit";
import { SearchIcon, UploadIcon } from "./icons";
import { ProspectDetailsModal, LeadFinderResult } from "./ProspectDetailsModal";
import { OutreachEmailModal, SavedDraft } from "./OutreachEmailModal";
import { useData } from "../contexts/DataContext";
import { Lead, LeadSource, LeadStatus, CompanySize, Industry } from "../types";

type SearchBody = {
  industry: string;
  location: string;
  keywords?: string;
  companySize?: string;
  excludeIndustries?: string;
  excludeKeywords?: string;
};

type SearchResponse = {
  ok?: boolean;
  results?: LeadFinderResult[];
  cached?: boolean;
  reasonHints?: string[];
};

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
const getTier = (r: LeadFinderResult): Tier => {
  const conf = confidencePct(r.confidence);
  const hasContact = Boolean(r.contact?.email || r.contact?.phone);
  if (r.verified || hasContact) return "verified";
  if (conf >= 80) return "high";
  return "candidate";
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

function buildDraftNote(draft: SavedDraft, prospect: LeadFinderResult) {
  const when = new Date().toLocaleString();
  const url = draft.meta?.url || prospect.website || prospect.sourceUrl || "";

  const metaLine = [
    `Tone: ${draft.meta?.tone || "n/a"}`,
    `Goal: ${draft.meta?.goal || "n/a"}`,
    `Length: ${draft.meta?.length || "n/a"}`,
    `Personalized: ${draft.meta?.personalized ? "yes" : "no"}`,
  ].join(" | ");

  return [
    "-----",
    `Outreach draft (AI) • ${when}`,
    metaLine,
    url ? `Source: ${url}` : "",
    "",
    `Subject: ${draft.subject}`,
    "",
    draft.body,
    "-----",
  ]
    .filter(Boolean)
    .join("\n");
}

const LeadFinderPage: React.FC = () => {
  const { addLead } = useData();

  const [form, setForm] = useState<SearchBody>({
    industry: "Logistics",
    location: "Harare",
    keywords: "freight forwarding",
    companySize: "sme",
    excludeIndustries: "",
    excludeKeywords: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<LeadFinderResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [cached, setCached] = useState<boolean>(false);
  const [reasonHints, setReasonHints] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [draftsByProspectId, setDraftsByProspectId] = useState<Record<string, SavedDraft>>({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [activeProspect, setActiveProspect] = useState<LeadFinderResult | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const allSelected = useMemo(() => {
    if (results.length === 0) return false;
    return results.every((r) => selected.has(r.id));
  }, [results, selected]);

  const toggleSelectAll = () => {
    setSelected(() => {
      if (results.length === 0) return new Set();
      if (allSelected) return new Set();
      return new Set(results.map((r) => r.id));
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openDetails = (p: LeadFinderResult) => {
    setActiveProspect(p);
    setDetailsOpen(true);
  };

  const openDraftEmail = (p: LeadFinderResult) => {
    setActiveProspect(p);
    setEmailOpen(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
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
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(new Set());
    setCached(false);
    setReasonHints([]);

    try {
      const res = await fetch("/.netlify/functions/lead-finder-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          forceRefresh: Boolean(opts?.forceRefresh),
          excludeIndustries: form.excludeIndustries || "",
          excludeKeywords: form.excludeKeywords || "",
        }),
      });

      const data: SearchResponse = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error((data as any)?.error || "Search failed");

      const list = Array.isArray(data.results) ? data.results : [];
      setResults(list);
      setCached(Boolean(data.cached));
      setReasonHints(Array.isArray(data.reasonHints) ? data.reasonHints : []);

      if (!list.length) setError("No results found. Try changing keywords, industry, or location.");
      else showToast(`Found ${list.length} companies`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = useMemo(() => {
    const tierRank: Record<Tier, number> = { verified: 3, high: 2, candidate: 1 };
    const list = [...results];
    list.sort((a, b) => {
      const ta = getTier(a);
      const tb = getTier(b);
      if (ta !== tb) return tierRank[tb] - tierRank[ta];
      return confidencePct(b.confidence) - confidencePct(a.confidence);
    });
    return list;
  }, [results]);

  const prospectToLeadPayload = (p: LeadFinderResult, draft?: SavedDraft): Omit<Lead, "id" | "created_at" | "updated_at"> => {
    const contact = p.contact || {};
    const name = splitContactName((contact as any).name);
    const location = parseLocation(p.location);

    const baseNotes = p.sourceUrl ? `Grounded source: ${p.sourceUrl}` : p.website ? `Grounded source: ${p.website}` : "";
    const draftNote = draft ? buildDraftNote(draft, p) : "";
    const notes = [baseNotes, draftNote].filter(Boolean).join("\n\n");

    return {
      first_name: name.first || "Unknown",
      last_name: name.last || "Contact",
      email: contact.email || "",
      phone: contact.phone || "",
      company_name: p.companyName,
      lead_source: LeadSource.COLD_OUTREACH,
      lead_status: LeadStatus.NEW,
      company_size: mapCompanySize((p as any).companySize),
      industry: mapIndustry((p as any).industry),
      position: (contact as any).title || "Operations",
      website: p.website || p.sourceUrl || "",
      address: "",
      city: location.city,
      country: location.country,
      logistics_needs: (p as any).intentSignal || p.summary || "Prospected via Lead Finder.",
      current_provider: "",
      monthly_shipment_volume: "",
      preferred_routes: "",
      assigned_to: null as any,
      next_action: "",
      next_action_date: "",
      notes,
      tags: ["prospected", "lead-finder"] as any,
      custom_fields: {
        ai_confidence: confidencePct(p.confidence),
        ai_verified: getTier(p) === "verified",
        ai_source_url: p.sourceUrl || p.website || null,
        ai_has_saved_draft: Boolean(draft),
      } as any,
    } as any;
  };

  const importProspects = (ids: string[]) => {
    const list = sortedResults.filter((r) => ids.includes(r.id));
    if (!list.length) return;

    list.forEach((p) => {
      const draft = draftsByProspectId[p.id];
      const payload = prospectToLeadPayload(p, draft);
      addLead(payload);
    });

    setSelected(new Set());
    showToast(`Imported ${list.length} lead(s). ${list.filter((p) => draftsByProspectId[p.id]).length} with draft notes.`);
  };

  const importSelected = () => {
    if (selected.size === 0) return;
    importProspects(Array.from(selected));
  };

  const saveDraftForImport = (prospectId: string, draft: SavedDraft) => {
    setDraftsByProspectId((prev) => ({ ...prev, [prospectId]: draft }));
    showToast("Draft saved. It will be added to notes on import.");
  };

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed inset-x-0 top-6 z-80 flex justify-center px-4">
          <div className="bg-card text-foreground text-sm font-medium px-4 py-3 rounded-2xl border border-border shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}

      <ProspectDetailsModal
        isOpen={detailsOpen}
        prospect={activeProspect}
        onClose={() => setDetailsOpen(false)}
        onDraftEmail={(p) => {
          setDetailsOpen(false);
          openDraftEmail(p);
        }}
      />

      <OutreachEmailModal
        isOpen={emailOpen}
        prospect={activeProspect}
        onClose={() => setEmailOpen(false)}
        onSaveDraftForImport={saveDraftForImport}
      />

      <ShellCard className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionHeader
            title="Lead Finder"
            subtitle="Search real companies with grounding, exclude junk, draft outreach, and import into CRM."
          />
          <div className="flex items-center gap-2">
            {cached ? <StatusPill tone="info" label="cached" /> : null}
            <Button variant="secondary" onClick={() => handleSearch({ forceRefresh: true })} disabled={loading}>
              Fresh
            </Button>
            <Button variant="primary" onClick={() => handleSearch()} disabled={loading}>
              <SearchIcon className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
            <Input name="industry" value={form.industry} onChange={onChange} placeholder="Logistics, Mining, FMCG..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <Input name="location" value={form.location} onChange={onChange} placeholder="Harare, Zimbabwe" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keywords</label>
            <Input name="keywords" value={form.keywords || ""} onChange={onChange} placeholder="freight, distribution..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company size</label>
            <Select name="companySize" value={form.companySize || "any"} onChange={onChange}>
              {companySizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Exclude industries (comma-separated)</label>
            <Input
              name="excludeIndustries"
              value={form.excludeIndustries || ""}
              onChange={onChange}
              placeholder="e.g. gambling, adult, weapons"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Leads will be filtered out if their industry matches any excluded industry.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Exclude keywords (comma-separated)</label>
            <Input
              name="excludeKeywords"
              value={form.excludeKeywords || ""}
              onChange={onChange}
              placeholder="e.g. jobs, careers, recruitment, internship"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Leads will be filtered out if the company/summary matches any excluded keyword.
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
            {error}
            {reasonHints.length ? (
              <ul className="mt-2 text-xs list-disc pl-5 space-y-1">
                {reasonHints.slice(0, 6).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </ShellCard>

      <ShellCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Results</h3>
            <p className="text-xs text-slate-500">Draft outreach and attach it to import to save it into lead notes.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              Select all
            </label>

            <Button variant="secondary" size="sm" onClick={importSelected} disabled={selected.size === 0 || loading}>
              <UploadIcon className="w-4 h-4" />
              Import selected
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading && results.length === 0 ? <div className="text-sm text-slate-500">Searching…</div> : null}
          {!loading && results.length === 0 ? <div className="text-sm text-slate-500">No results yet. Run a search.</div> : null}

          {sortedResults.map((r) => {
            const tier = getTier(r);
            const conf = confidencePct(r.confidence);
            const link = r.website || r.sourceUrl || "";
            const hasDraft = Boolean(draftsByProspectId[r.id]);

            return (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 flex gap-3 items-start">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="mt-1" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">{r.companyName || "Untitled company"}</p>

                    {tier === "verified" ? (
                      <StatusPill label="Verified" tone="success" />
                    ) : tier === "high" ? (
                      <StatusPill label="High match" tone="warn" />
                    ) : (
                      <StatusPill label={`Candidate ${conf}%`} tone="info" />
                    )}

                    <span className="text-xs text-slate-500">{conf}%</span>

                    {hasDraft ? <StatusPill label="Draft saved" tone="info" /> : null}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 truncate">{r.website || r.sourceUrl || r.location || "No site"}</p>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{r.summary || "No description"}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openDetails(r)}>
                      Details
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openDraftEmail(r)}>
                      Draft email
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => importProspects([r.id])}
                      disabled={loading}
                    >
                      Import
                    </Button>

                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-orange-700 hover:text-orange-800">
                        Open source
                      </a>
                    ) : null}
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
