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
} from '../../components/icons';
import {
  findPotentialLeads,
  LeadProspectingCriteria,
  LeadProspect,
} from '../services/geminiService';

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
      if (message.includes('API_KEY') || message.includes('apiKey')) {
        setError('API key not configured. Check your .env.local file has GEMINI_API_KEY set.');
      } else if (message.includes('googleSearch') || message.includes('tool')) {
        setError('Google Search grounding not enabled for this API key. Enable it in Google AI Studio.');
      } else if (message.includes('quota') || message.includes('429')) {
        setError('Rate limit exceeded. Wait a moment and try again.');
      } else {
        setError(message || 'We could not reach Gemini right now. Try again shortly.');
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

  return (
    <>
      {toastMessage && (
        <div className="fixed inset-x-0 top-6 z-80 flex justify-center px-4">
          <div className="bg-card text-foreground text-sm font-medium px-4 py-3 rounded-2xl shadow-xl shadow-muted/20 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-orange-300" />
            {toastMessage}
          </div>
        </div>
      )}
      <div
      className="fixed inset-0 bg-muted/70 backdrop-blur-sm z-70 flex items-center justify-center p-4 md:pl-64"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/40">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" /> AI Lead Prospector
            </p>
            <h2 className="text-2xl font-bold text-foreground">Search for logistics leads</h2>
            <p className="text-sm text-foreground-muted">Find verified companies and contacts from the web.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-muted text-foreground-muted border border-border"
            aria-label="Close lead finder"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden">
          <section className="p-5 space-y-5 bg-muted/60 overflow-y-auto">
            <form className="space-y-4" onSubmit={handleSearch}>
              <label className="space-y-2 block">
                <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Who are you hunting for?</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-foreground-muted" />
                    ... (trimmed for brevity)