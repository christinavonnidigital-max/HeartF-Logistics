import React, { useMemo, useState } from "react";
import { ShellCard, Button, SectionHeader, StatusPill } from "./UiKit";
import { SearchIcon, UploadIcon } from "./icons";

type LeadFinderResult = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  summary?: string;
  confidence?: number;
  sourceUrl?: string;
  verified?: boolean;
  contact?: {
    email?: string;
    phone?: string;
  };
  sourcesCount?: number;
  resultKey?: string;
};

type SearchBody = {
  industry: string;
  location: string;
  keywords?: string;
  companySize?: string;
};

const companySizeOptions = [
  { value: "any", label: "Any" },
  { value: "micro", label: "Micro" },
  { value: "sme", label: "SME" },
  { value: "enterprise", label: "Enterprise" },
];

const getTier = (r: LeadFinderResult) => {
  const conf = Number(r.confidence || 0);
  const hasContact = Boolean(r.contact?.email || r.contact?.phone);
  const verified = Boolean(r.verified);

  if (verified || hasContact) return "verified";
  if (conf >= 80) return "high";
  return "candidate";
};

const LeadFinderPage: React.FC = () => {
  const [form, setForm] = useState<SearchBody>({
    industry: "Logistics",
    location: "Harare",
    keywords: "freight forwarding",
    companySize: "sme",
  });
  const [searchId, setSearchId] = useState<string | null>(null);
  const [results, setResults] = useState<LeadFinderResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Unexpected response. Make sure Netlify functions are running (netlify dev).");
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setImportMsg(null);
    setSelected(new Set());

    try {
      const query = [form.industry, form.keywords].filter(Boolean).join(" ").trim();
      if (!query) {
        setError("Add an industry or keyword to search.");
        setLoading(false);
        return;
      }

      const criteria = {
        query,
        geography: form.location || "",
        industryFocus: form.industry || "",
        intentFocus: form.keywords || "",
        minHeadcount: form.companySize && form.companySize !== "any" ? form.companySize : "",
      };

      const res = await fetch("/.netlify/functions/lead-finder-search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Search failed");
      setSearchId(data.searchId);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = useMemo(() => selected.size === results.length && results.length > 0, [selected, results]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.id)));
    }
  };

  const importSelected = async () => {
    if (!searchId || selected.size === 0) return;
    setLoading(true);
    setError(null);
    setImportMsg(null);
    try {
      const res = await fetch("/.netlify/functions/lead-finder-import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId, resultIds: Array.from(selected) }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Import failed");
      setImportMsg(`Imported ${data.imported || selected.size} leads`);
    } catch (err: any) {
      setError(err?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <ShellCard className="p-5">
        <SectionHeader title="Lead Finder" subtitle="Search for target companies and import them into your CRM." />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
            <input
              name="industry"
              value={form.industry}
              onChange={onChange}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keywords (optional)</label>
            <input
              name="keywords"
              value={form.keywords || ""}
              onChange={onChange}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Example: refrigerated transport"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company size</label>
            <select
              name="companySize"
              value={form.companySize}
              onChange={onChange}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {companySizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={runSearch} disabled={loading}>
            <SearchIcon className="w-4 h-4" />
            {loading ? "Searching..." : "Search with AI"}
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {importMsg && <p className="mt-3 text-sm text-emerald-600">{importMsg}</p>}
      </ShellCard>

      <ShellCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Results</h3>
            <p className="text-xs text-slate-500">Select results to import into Leads.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              Select all
            </label>
            <Button variant="secondary" size="sm" onClick={importSelected} disabled={!searchId || selected.size === 0 || loading}>
              <UploadIcon className="w-4 h-4" />
              Import selected
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading && results.length === 0 && (
            <div className="text-sm text-slate-500">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-sm text-slate-500">No results yet. Run a search.</div>
          )}

          {results.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 flex gap-3 items-start">
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggleSelect(r.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{r.companyName || "Untitled company"}</p>
                  {(() => {
                    const tier = getTier(r);
                    if (tier === "verified") return <StatusPill label="Verified" tone="success" />;
                    if (tier === "high") return <StatusPill label="High match" tone="warn" />;
                    const conf = Number(r.confidence || 50);
                    return <StatusPill label={`Candidate ${conf}%`} tone="info" />;
                  })()}
                </div>
                <p className="text-xs text-slate-600 mt-1 truncate">{r.website || r.sourceUrl || r.location || "No site"}</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.summary || "No description"}</p>
              </div>
            </div>
          ))}
        </div>
      </ShellCard>
    </div>
  );
};

export default LeadFinderPage;
