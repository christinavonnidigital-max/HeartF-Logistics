import React, { useEffect, useRef, useState } from 'react';
import {
  Lead,
  LeadSource,
  LeadStatus,
  CompanySize,
  Industry,
} from '../types';
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
} from './icons';
type LeadProspectingCriteria = {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: string;
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
  resultKey?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  verified?: boolean;
  sourcesCount?: number;
};

async function findPotentialLeads(criteria: LeadProspectingCriteria): Promise<LeadProspect[]> {
  const res = await fetch("/.netlify/functions/lead-finder-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(criteria),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Unexpected response. Make sure Netlify functions are running (netlify dev).");
  }
  if (!res.ok) throw new Error(data?.error || "Lead Finder failed");
  return (data?.results || []) as LeadProspect[];
}

interface LeadFinderModalProps {
  onClose: () => void;
  onImport: (
    leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>[],
  ) => void;
}

const SUGGESTED_QUERIES = [
  'Logistics managers in mining companies in Zimbabwe',
  'Operations heads at Zimbabwean FMCG exporters needing cross-border trucks',
  'Procurement leads at lithium mining startups in Southern Africa',
  'Cold chain directors at pharma distributors in Harare',
];

const INITIAL_FORM: LeadProspectingCriteria = {
  query: SUGGESTED_QUERIES[0],
  geography: 'Zimbabwe + SADC trade lanes',
  industryFocus: 'Mining & heavy commodities',
  intentFocus: 'Need dependable long-haul logistics and border clearance',
  minHeadcount: '200+ employees',
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });
};

const mapCompanySize = (size?: string): CompanySize => {
  if (!size) return CompanySize.MEDIUM;
  const lower = size.toLowerCase();
  if (lower.includes('enterprise') || lower.includes('1000')) return CompanySize.ENTERPRISE;
  if (lower.includes('large') || lower.includes('500')) return CompanySize.LARGE;
  if (lower.includes('medium') || lower.includes('200')) return CompanySize.MEDIUM;
  if (lower.includes('startup') || lower.includes('early')) return CompanySize.STARTUP;
  return CompanySize.SMALL;
};

const mapIndustry = (industry?: string): Industry => {
  if (!industry) return Industry.OTHER;
  const lower = industry.toLowerCase();
  if (lower.includes('mining')) return Industry.MINING;
  if (lower.includes('agri')) return Industry.AGRICULTURE;
  if (lower.includes('fmcg') || lower.includes('retail')) return Industry.FMCG;
  if (lower.includes('manufact')) return Industry.MANUFACTURING;
  if (lower.includes('wholesale')) return Industry.WHOLESALE;
  return Industry.OTHER;
};

const splitContactName = (fullName?: string) => {
  if (!fullName) return { first: '', last: '' };
  const pieces = fullName.trim().split(/\s+/);
  if (pieces.length === 1) {
    return { first: pieces[0], last: '' };
  }
  const first = pieces.shift() || '';
  return { first, last: pieces.join(' ') };
};

const parseLocation = (location?: string) => {
  if (!location) return { city: '', country: '' };
  const parts = location.split(',').map((token) => token.trim()).filter(Boolean);
  if (!parts.length) return { city: '', country: '' };
  if (parts.length === 1) return { city: parts[0], country: parts[0] };
  const country = parts.pop() || '';
  const city = parts.join(', ');
  return { city, country };
};

type LeadTier = "verified" | "high" | "candidate";

const getLeadTier = (p: LeadProspect): LeadTier => {
  const confidence = Math.round(p.confidence ?? 0);
  const hasContact = Boolean(p.contact?.email || p.contact?.phone);

  if (p.verified || hasContact) return "verified";
  if (confidence >= 80) return "high";
  return "candidate";
};

const prospectToLeadPayload = (
  prospect: LeadProspect,
): Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'> => {
  const contact = prospect.contact || {};
  const name = splitContactName(contact.name);
  const location = parseLocation(prospect.location);

  return {
    first_name: name.first,
    last_name: name.last,
    email: contact.email || '',
    phone: contact.phone || '',
    company_name: prospect.companyName,
    lead_source: LeadSource.COLD_OUTREACH,
    lead_status: LeadStatus.NEW,
    company_size: mapCompanySize(prospect.companySize),
    industry: mapIndustry(prospect.industry),
    position: contact.title || 'Operations Lead',
    website: prospect.website || prospect.sourceUrl || '',
    address: '',
    city: location.city,
    country: location.country,
    logistics_needs:
      prospect.intentSignal ||
      prospect.summary ||
      'High-potential logistics buyer discovered via AI lead prospecting.',
    notes: prospect.sourceUrl
      ? `Grounded via Google Search → ${prospect.sourceUrl}`
      : 'Grounded via Google Search',
    tags: ['prospected', 'ai-discovery'].filter(Boolean),
    custom_fields: {
      ai_confidence: prospect.confidence ?? null,
      ai_summary: prospect.summary,
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
  const [lastSearchAt, setLastSearchAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showHighPlus, setShowHighPlus] = useState(true);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.query.trim()) {
      setError('Tell the assistant what to look for.');
      return;
    }
    setIsSearching(true);
    setError(null);
    setProspects([]);
    setHasSearched(true);
    try {
      console.log('[LeadFinderModal] Starting search...', form);
      const results = await findPotentialLeads(form);
      console.log('[LeadFinderModal] Search completed:', results);
      setProspects(results);
      setSelectedIds(new Set());
      setLastSearchAt(new Date().toISOString());
      if (!results.length) {
        setError('No grounded web results matched this criteria. Try widening your search.');
      }
    } catch (err: any) {
      console.error('[LeadFinderModal] Search error:', err);
      const message = err?.message || String(err);
      if (message.toLowerCase().includes('unauth')) {
        setError('You are not logged in. Please log in and try again.');
      } else {
        setError(message || 'Lead Finder is unavailable right now. Try again shortly.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportSelection = () => {
    if (!selectedIds.size) return;
    const shortlisted = prospects.filter((prospect) => selectedIds.has(prospect.id));
    if (!shortlisted.length) return;
    const payload = shortlisted.map(prospectToLeadPayload);
    onImport(payload);
    markImported(shortlisted.map((prospect) => prospect.id));
    const label = shortlisted.length === 1 ? 'lead' : 'leads';
    showToast(`Added ${shortlisted.length} new ${label} from this search`);
  };

  const handleImportSingle = (prospect: LeadProspect) => {
    onImport([prospectToLeadPayload(prospect)]);
    markImported([prospect.id]);
  };

  const selectedCount = selectedIds.size;
  const tierRank: Record<LeadTier, number> = {
    verified: 3,
    high: 2,
    candidate: 1,
  };
  const sortedProspects = [...prospects].sort((a, b) => {
    const ta = getLeadTier(a);
    const tb = getLeadTier(b);
    if (ta !== tb) return tierRank[tb] - tierRank[ta];
    const ca = Math.round(a.confidence ?? 0);
    const cb = Math.round(b.confidence ?? 0);
    if (ca !== cb) return cb - ca;
    const wa = a.website ? 1 : 0;
    const wb = b.website ? 1 : 0;
    if (wa !== wb) return wb - wa;
    return 0;
  });
  const visibleProspects = sortedProspects.filter((p) => {
    const tier = getLeadTier(p);
    if (showOnlyVerified) return tier === "verified";
    if (showHighPlus) return tier === "verified" || tier === "high";
    return true;
  });

  return (
    <>
      {toastMessage && (
        <div className="fixed inset-x-0 top-6 z-80 flex justify-center px-4">
          <div className="bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-orange-300" />
            {toastMessage}
          </div>
        </div>
      )}
      <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-70 flex items-center justify-center p-4 md:pl-64"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-orange-50 via-white to-orange-50">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" /> AI Lead Prospector
            </p>
            <h2 className="text-2xl font-bold text-slate-900">Search for logistics leads</h2>
            <p className="text-sm text-slate-500">Find verified companies and contacts from the web.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white text-slate-500 border border-slate-200"
            aria-label="Close lead finder"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden">
          <section className="p-5 space-y-5 bg-slate-50/60 overflow-y-auto">
            <form className="space-y-4" onSubmit={handleSearch}>
              <label className="space-y-2 block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Who are you hunting for?</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <textarea
                    rows={3}
                    value={form.query}
                    onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                    placeholder="e.g. Logistics leads at mining exporters in Zimbabwe"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-3">
                <label className="space-y-1 text-xs font-semibold text-slate-600 uppercase">
                  Geography / trade lane focus
                  <input
                    type="text"
                    value={form.geography || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, geography: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                    placeholder="Harare, Zimbabwe or SADC"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 uppercase">
                  Industry focus
                  <input
                    type="text"
                    value={form.industryFocus || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, industryFocus: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                    placeholder="Mining, agriculture, pharma..."
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 uppercase">
                  Buying signal / logistics intent
                  <textarea
                    rows={2}
                    value={form.intentFocus || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, intentFocus: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                    placeholder="Needs chilled trucking, cross-border permits..."
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 uppercase">
                  Minimum company size / headcount
                  <input
                    type="text"
                    value={form.minHeadcount || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, minHeadcount: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                    placeholder="200+ employees, enterprise"
                  />
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Jump-start with a template</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-full border border-orange-100 text-orange-600 bg-orange-50 hover:bg-orange-100"
                      onClick={() => setForm((prev) => ({ ...prev, query: item }))}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500"
                disabled={isSearching}
              >
                {isSearching ? 'Searching the web…' : 'Prospect on the open web'}
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GlobeIcon className="w-4 h-4 text-orange-500" />
                Google Search grounding enabled
              </div>
              <p className="text-xs text-slate-500">
                We call Gemini with the googleSearch tool for every run. Citations stay attached so you can verify every lead.
              </p>
              {lastSearchAt && (
                <p className="text-[11px] text-slate-700">
                  Last run · {formatDateTime(lastSearchAt)}
                </p>
              )}
            </div>
          </section>

          <section className="p-6 space-y-4 overflow-y-auto min-h-0">
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!hasSearched && !isSearching && !error && (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3 text-slate-500 bg-white">
                <SparklesIcon className="w-10 h-10 mx-auto text-orange-400" />
                <p className="text-base font-semibold text-slate-800">Describe your dream lead, then let Gemini do the legwork.</p>
                <p className="text-sm">
                  We will fetch 3-6 prospects, summarize why they look ready to buy logistics, and let you save them directly into the CRM.
                </p>
              </div>
            )}

            {isSearching && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                    <div className="h-3 bg-slate-100 rounded-full w-full" />
                    <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-3 bg-slate-100 rounded-full w-20" />
                      <div className="h-3 bg-slate-100 rounded-full w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && hasSearched && !error && !sortedProspects.length && (
              <div className="rounded-3xl border border-slate-200 p-8 text-center space-y-2 bg-white">
                <p className="text-base font-semibold text-slate-800">No results found</p>
                <p className="text-sm text-slate-600">Try broader keywords, a wider geography, or fewer constraints.</p>
              </div>
            )}

            {sortedProspects.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOnlyVerified((v) => !v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      showOnlyVerified
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Verified only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHighPlus((v) => !v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      showHighPlus
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    High match+
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Showing {visibleProspects.length} of {sortedProspects.length}
                </div>
              </div>
            )}

            {visibleProspects.map((prospect) => {
              const selected = selectedIds.has(prospect.id);
              const imported = importedIds.has(prospect.id);
              const confidence = Math.round(prospect.confidence ?? 0);
              const contact = prospect.contact;
              const tier = getLeadTier(prospect);
              return (
                <article
                  key={prospect.id}
                  className="rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {prospect.companyName}
                        </h3>
                        {imported && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                            <CheckCircleIcon className="w-4 h-4" /> Added
                          </span>
                        )}
                        {!imported && (tier === "verified" ? (
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
                        ))}
                      </div>
                      {tier === "verified" ? (
                        <p className="mt-1 text-[11px] text-emerald-700">
                          Verified from company website
                        </p>
                      ) : tier === "high" ? (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Strong match, no verified contact yet
                        </p>
                      ) : null}
                      <p className="text-sm text-slate-600 mt-1">{prospect.summary || 'Opportunity summary pending.'}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-3">
                        {prospect.industry && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                            <BuildingOfficeIcon className="w-3.5 h-3.5" />
                            {prospect.industry}
                          </span>
                        )}
                        {prospect.companySize && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                            <TagIcon className="w-3.5 h-3.5" />
                            {prospect.companySize}
                          </span>
                        )}
                        {prospect.location && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {prospect.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-slate-700 font-semibold">Fit Confidence</p>
                      <p className="text-lg font-bold text-slate-900">{confidence || 0}%</p>
                      <button
                        onClick={() => toggleSelected(prospect.id)}
                        className={`mt-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          selected
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {selected ? 'Selected' : 'Shortlist'}
                      </button>
                    </div>
                  </div>

                  {contact && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      {contact.name && (
                        <div className="flex items-center gap-2">
                          <UserCircleIcon className="w-4 h-4" />
                          <div>
                            <p className="font-semibold text-slate-800">{contact.name}</p>
                            {contact.title && <p className="text-xs text-slate-500">{contact.title}</p>}
                          </div>
                        </div>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-orange-600"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-orange-600"
                        >
                          <PhoneIcon className="w-4 h-4" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex flex-wrap gap-3">
                      {prospect.website && (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Visit website
                        </a>
                      )}
                      {prospect.sourceUrl && (
                        <a
                          href={prospect.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-700"
                        >
                          View cited source ↗
                        </a>
                      )}
                      {typeof prospect.sourcesCount === "number" && (
                        <div className="w-full text-[11px] text-slate-500">
                          Sources: {prospect.sourcesCount}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleImportSingle(prospect)}
                      disabled={imported}
                      className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                        imported
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {imported ? 'Added to CRM' : 'Save this lead'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </main>

        <footer className="px-6 py-4 border-t border-slate-100 bg-white flex flex-wrap items-center gap-4 justify-between">
          <div className="text-sm text-slate-600">
            {selectedCount ? (
              <>
                <span className="font-semibold text-slate-900">{selectedCount}</span> shortlisted • ready to push straight into the CRM
              </>
            ) : (
              <>Select the strongest matches or add them one by one.</>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const top = sortedProspects
                  .filter((p) => getLeadTier(p) === "verified")
                  .slice(0, 10)
                  .map((p) => p.id);

                setSelectedIds(new Set(top));
              }}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Select top verified
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Done
            </button>
            <button
              onClick={handleImportSelection}
              disabled={!selectedCount}
              className="px-5 py-2 rounded-full bg-orange-600 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-500"
            >
              Add {selectedCount || ''} selected leads
            </button>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
};

export default LeadFinderModal;
