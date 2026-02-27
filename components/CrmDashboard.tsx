import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { mockLeadScoringRules, mockSalesReps } from '../data/mockCrmData';
import LeadDetailsModal from './LeadDetailsModal';
import OpportunityDetailsModal from './OpportunityDetailsModal';
import { Lead, LeadActivityType, LeadScoringRule, LeadSource, LeadStatus, Opportunity } from '../types';
import AddLeadModal from './AddLeadModal';
import AddLeadScoringRuleModal from './AddLeadScoringRuleModal';
import { calculateLeadScore } from '../services/crmService';
import { BriefcaseIcon, GlobeIcon, PlusIcon, SearchIcon, UsersIcon } from './icons';
import { Button, StatusPill } from './UiKit';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';
import { buildLeadExportRows, leadCsvColumns, leadXlsxColumns } from '../dataIO/leadExportColumns';
import { LeadMetricCard, LeadViewTabs, LeadWorkspaceHeader } from './leads/LeadWorkspaceShared';

type WorkspaceView = 'pipeline' | 'detail' | 'discovery';

type PipelineColumn = {
  status: LeadStatus;
  label: string;
  dotClass: string;
};

const PIPELINE_COLUMNS: PipelineColumn[] = [
  { status: LeadStatus.NEW, label: 'New Leads', dotClass: 'bg-blue-500' },
  { status: LeadStatus.CONTACTED, label: 'Contacted', dotClass: 'bg-orange-500' },
  { status: LeadStatus.QUALIFIED, label: 'Qualified', dotClass: 'bg-cyan-500' },
  { status: LeadStatus.PROPOSAL_SENT, label: 'Proposal', dotClass: 'bg-violet-500' },
  { status: LeadStatus.NEGOTIATION, label: 'Negotiation', dotClass: 'bg-amber-500' },
  { status: LeadStatus.WON, label: 'Won', dotClass: 'bg-emerald-500' },
];

const FLOW_STAGES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL_SENT,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON,
];

const CITY_MARKERS: Record<string, { x: number; y: number }> = {
  harare: { x: 56, y: 50 },
  bulawayo: { x: 38, y: 73 },
  mutare: { x: 75, y: 56 },
  gweru: { x: 50, y: 63 },
  masvingo: { x: 56, y: 77 },
  lusaka: { x: 33, y: 34 },
  gaborone: { x: 30, y: 82 },
  maputo: { x: 86, y: 74 },
  beira: { x: 84, y: 57 },
  johannesburg: { x: 44, y: 90 },
};

const toTitle = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const money = (value: number) =>
  new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  );

const dateTimeGB = (iso?: string) => {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not set';
  return d.toLocaleString('en-GB', {
    timeZone: 'Africa/Harare',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sourcePillClass = (source?: LeadSource) => {
  if (source === LeadSource.REFERRAL) return 'bg-emerald-100 text-emerald-700';
  if (source === LeadSource.WEBSITE) return 'bg-blue-100 text-blue-700';
  if (source === LeadSource.EVENT) return 'bg-violet-100 text-violet-700';
  if (source === LeadSource.PARTNER) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const VIEW_TABS = [
  { key: 'pipeline', label: 'Pipeline', icon: <BriefcaseIcon className="h-4 w-4" /> },
  { key: 'detail', label: 'Lead Detail', icon: <UsersIcon className="h-4 w-4" /> },
  { key: 'discovery', label: 'Geographic Discovery', icon: <GlobeIcon className="h-4 w-4" /> },
];

const CrmDashboard: React.FC = () => {
  const {
    leads,
    opportunities,
    leadActivities,
    opportunityActivities,
    addLead,
    deleteLead,
    updateLead,
    addLeadActivity,
    logAuditEvent,
  } = useData();

  const [rules, setRules] = useState<LeadScoringRule[]>(mockLeadScoringRules);
  const [view, setView] = useState<WorkspaceView>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedLeadId, setFocusedLeadId] = useState<number | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const sorted = [...leads].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    if (!q) return sorted;
    return sorted.filter((lead) => {
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
      return (
        name.includes(q) ||
        (lead.company_name || '').toLowerCase().includes(q) ||
        (lead.city || '').toLowerCase().includes(q) ||
        (lead.email || '').toLowerCase().includes(q) ||
        String(lead.lead_status || '').toLowerCase().includes(q)
      );
    });
  }, [leads, searchTerm]);

  const leadById = useMemo(() => {
    const record: Record<number, Lead | undefined> = {};
    leads.forEach((lead) => {
      record[lead.id] = lead;
    });
    return record;
  }, [leads]);

  const oppByLeadId = useMemo(() => {
    const record: Record<number, Opportunity | undefined> = {};
    [...opportunities]
      .sort((a, b) => b.expected_value - a.expected_value)
      .forEach((opp) => {
        if (opp.lead_id && !record[opp.lead_id]) record[opp.lead_id] = opp;
      });
    return record;
  }, [opportunities]);

  const focusedLead = useMemo(() => {
    if (focusedLeadId && leadById[focusedLeadId]) return leadById[focusedLeadId] || null;
    return filteredLeads[0] || null;
  }, [focusedLeadId, leadById, filteredLeads]);

  const leadActivitiesSorted = useMemo(
    () => [...leadActivities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [leadActivities],
  );

  const totalPipelineValue = useMemo(
    () =>
      opportunities.reduce((sum, opp) => {
        if (opp.stage === 'closed_won' || opp.stage === 'closed_lost') return sum;
        return sum + Number(opp.expected_value || 0);
      }, 0),
    [opportunities],
  );

  const wonCount = useMemo(() => leads.filter((lead) => lead.lead_status === LeadStatus.WON).length, [leads]);
  const lostCount = useMemo(() => leads.filter((lead) => lead.lead_status === LeadStatus.LOST).length, [leads]);
  const conversionRate = Math.round((wonCount / Math.max(leads.length - lostCount, 1)) * 100);

  const handleCloseModal = () => {
    setSelectedLead(null);
    setSelectedOpportunity(null);
  };

  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: Date.now(),
      lead_score: calculateLeadScore(newLeadData, rules),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    void addLead(newLead as any);
    setFocusedLeadId(newLead.id);
    setIsAddLeadModalOpen(false);
  };

  const handleDeleteLead = (id: number) => {
    void deleteLead(id);
    if (focusedLeadId === id) setFocusedLeadId(null);
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const handleMoveLead = (lead: Lead, nextStatus: LeadStatus) => {
    if (lead.lead_status === nextStatus) return;
    void updateLead({ ...lead, lead_status: nextStatus, updated_at: new Date().toISOString() });
    addLeadActivity({
      lead_id: lead.id,
      activity_type: LeadActivityType.STATUS_CHANGE,
      subject: `Stage moved to ${toTitle(nextStatus)}`,
      description: `Pipeline stage updated from ${toTitle(lead.lead_status)} to ${toTitle(nextStatus)}.`,
      performed_by: lead.assigned_to || 1,
    });
  };

  const handleSendFollowUp = (lead: Lead) => {
    const now = new Date();
    const followupDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    addLeadActivity({
      lead_id: lead.id,
      activity_type: LeadActivityType.EMAIL,
      subject: 'Follow-up outreach sent',
      description: `Follow-up sent to ${lead.company_name} on active freight requirements.`,
      next_action: 'Schedule qualification call',
      next_action_date: followupDate,
      performed_by: lead.assigned_to || 1,
    });
    void updateLead({ ...lead, next_action: 'Schedule qualification call', next_action_date: followupDate });
  };

  const handleImportLeads = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
    let success = 0;
    let failed = 0;
    rows.forEach((row, index) => {
      try {
        const payload: any = {
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          email: row.email || '',
          phone: row.phone || '',
          company_name: row.company_name || row.company || '',
          city: row.city || 'Harare',
          country: row.country || 'Zimbabwe',
          lead_status: row.lead_status || LeadStatus.NEW,
          lead_source: row.lead_source || LeadSource.OTHER,
          lead_score: 0 as any,
          industry: row.industry,
          position: row.position,
          website: row.website,
          logistics_needs: row.logistics_needs || 'Regional freight support within Zimbabwe and SADC corridors.',
        };
        const newLead: Lead = {
          ...payload,
          id: Date.now() + index,
          lead_score: calculateLeadScore(payload, rules),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        void addLead(newLead as any);
        success += 1;
      } catch {
        failed += 1;
      }
    });

    logAuditEvent({
      action: 'data.import',
      entity: { type: 'lead' },
      meta: { imported: success, failed: failed || meta.failed, source: 'leads.import' },
    });
    setIsImportModalOpen(false);
  };

  const handleAddRule = (newRuleData: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>) => {
    const newRule: LeadScoringRule = {
      ...newRuleData,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRules((prev) => [...prev, newRule]);
    setIsAddRuleModalOpen(false);
  };

  const openPipelineLeads = useMemo(
    () => PIPELINE_COLUMNS.map((column) => ({ ...column, leads: filteredLeads.filter((lead) => lead.lead_status === column.status) })),
    [filteredLeads],
  );

  const focusedActivities = useMemo(
    () => (focusedLead ? leadActivitiesSorted.filter((entry) => entry.lead_id === focusedLead.id) : []),
    [focusedLead, leadActivitiesSorted],
  );

  const dealConfidence = useMemo(() => {
    if (!focusedLead) return 0;
    const sourceBoost = focusedLead.lead_source === LeadSource.REFERRAL ? 10 : 0;
    return Math.max(0, Math.min(99, Math.round((focusedLead.lead_score || 0) * 0.75 + sourceBoost + focusedActivities.length * 3)));
  }, [focusedLead, focusedActivities.length]);

  const detailProgressIndex = focusedLead ? Math.max(0, FLOW_STAGES.indexOf(focusedLead.lead_status)) : 0;
  const detailProgressPct = ((detailProgressIndex + 1) / FLOW_STAGES.length) * 100;

  const geoLeads = useMemo(
    () =>
      filteredLeads.slice(0, 12).map((lead, index) => {
        const cityKey = String(lead.city || '').trim().toLowerCase();
        const fallback = { x: 22 + ((index * 17) % 62), y: 18 + ((index * 11) % 70) };
        return { lead, coords: CITY_MARKERS[cityKey] || fallback };
      }),
    [filteredLeads],
  );

  const leadsBySource = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((lead) => map.set(lead.lead_source, (map.get(lead.lead_source) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const topGeoLead = geoLeads[0]?.lead;
  const leadExportRows = useMemo(
    () => buildLeadExportRows(leads, leadActivities, opportunities),
    [leads, leadActivities, opportunities],
  );

  return (
    <>
      <div className="space-y-5">
        <LeadWorkspaceHeader
          title="Leads & Pipeline"
          subtitle="Zimbabwe-first lead management across SADC corridors."
        >
          <div className="relative w-full sm:w-[320px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, contact, city, or status..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <Button variant="ghost" onClick={() => downloadCsv(leadExportRows, leadCsvColumns as any, 'leads-full-export')}>Export CSV</Button>
          <Button variant="ghost" onClick={() => downloadXlsx(leadExportRows, leadXlsxColumns as any, 'leads-full-export')}>Export XLSX</Button>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>Import</Button>
          <Button variant="primary" onClick={() => setIsAddLeadModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Create Lead
          </Button>
        </LeadWorkspaceHeader>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            <LeadMetricCard label="Open Pipeline Value" value={money(totalPipelineValue)} />
            <LeadMetricCard label="Active Leads" value={leads.length - lostCount} />
            <LeadMetricCard label="Closed Won" value={wonCount} />
            <LeadMetricCard label="Closed Lost" value={lostCount} />
          </div>
          <LeadViewTabs
            tabs={VIEW_TABS}
            activeKey={view}
            onChange={(next) => setView(next as WorkspaceView)}
          />
        </section>

        {view === 'pipeline' ? (
          <div className="space-y-4">
            <div className="grid items-start gap-3 2xl:grid-cols-6 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2">
              {openPipelineLeads.map((column) => (
                <section key={column.status} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <span className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`} />
                      {column.label}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{column.leads.length}</span>
                  </div>

                  <div className="max-h-[32vh] 2xl:max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                    {column.leads.map((lead) => {
                      const opp = oppByLeadId[lead.id];
                      const estimatedValue = opp?.expected_value || Math.round(Math.max(6000, lead.lead_score * 260));
                      return (
                        <div key={lead.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${sourcePillClass(lead.lead_source)}`}>{toTitle(lead.lead_source)}</span>
                            <button type="button" className="text-xs font-semibold text-orange-600 hover:text-orange-700" onClick={() => { setFocusedLeadId(lead.id); setView('detail'); }}>Open</button>
                          </div>
                          <p className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">{lead.company_name}</p>
                          <p className="mt-1 text-xl font-black text-orange-500">{money(estimatedValue)}</p>
                          <p className="mt-1 truncate text-[11px] text-slate-500">{lead.city || 'Harare'}, {lead.country || 'Zimbabwe'}</p>
                          <div className="mt-2 flex flex-col gap-2">
                            <span className="text-xs text-slate-500">Score {lead.lead_score || 0}</span>
                            <select value={lead.lead_status} onChange={(e) => handleMoveLead(lead, e.target.value as LeadStatus)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                              {FLOW_STAGES.map((status) => <option key={status} value={status}>{toTitle(status)}</option>)}
                            </select>
                          </div>
                        </div>
                      );
                    })}

                    {!column.leads.length ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-sm font-semibold text-slate-700">No leads in this stage</p>
                        <p className="mt-1 text-xs text-slate-500">Move leads here as they progress.</p>
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">Lead Insights</h3>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(#f59e0b 0 ${conversionRate}%, #e2e8f0 ${conversionRate}% 100%)` }}>
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-black text-slate-900">{conversionRate}%</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {leadsBySource.map(([source, count]) => (
                    <div key={source}>
                      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{toTitle(source)}</span><span className="text-slate-500">{count}</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-orange-400" style={{ width: `${Math.max(8, Math.round((count / Math.max(leads.length, 1)) * 100))}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xl font-semibold text-slate-900">Recent Activity</h4>
                <div className="mt-3 space-y-3">
                  {leadActivitiesSorted.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{activity.subject}</p>
                      <p className="text-xs text-slate-500">{leadById[activity.lead_id]?.company_name || 'Lead'} - {dateTimeGB(activity.created_at)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {view === 'detail' && focusedLead ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Next Best Action</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{focusedLead.next_action || 'Follow up with procurement contact on active lane pricing.'}</p>
                </div>
                <Button variant="primary" onClick={() => handleSendFollowUp(focusedLead)}>Send Follow-up</Button>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xl font-semibold text-slate-900">Company Dossier</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-xs font-semibold uppercase text-slate-500">Company</dt><dd className="font-semibold text-slate-900">{focusedLead.company_name}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-slate-500">Industry</dt><dd className="font-semibold text-slate-900">{toTitle(focusedLead.industry || 'other')}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-slate-500">Location</dt><dd className="font-semibold text-slate-900">{focusedLead.city || 'Harare'}, {focusedLead.country || 'Zimbabwe'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-slate-500">Lead Source</dt><dd className="font-semibold text-slate-900">{toTitle(focusedLead.lead_source)}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLead(focusedLead)}>Edit Lead</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(focusedLead.id)}>Delete</Button>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xl font-semibold text-slate-900">Activity Timeline</h4>
                {focusedActivities.slice(0, 8).map((activity) => (
                  <article key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-base font-semibold text-slate-900">{activity.subject}</h5>
                      <StatusPill label={toTitle(activity.activity_type)} tone="info" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{dateTimeGB(activity.created_at)}</p>
                    <p className="mt-2 text-sm text-slate-700">{activity.description || 'No description.'}</p>
                  </article>
                ))}
                {!focusedActivities.length ? <p className="text-sm text-slate-500">No activity logged for this lead yet.</p> : null}
              </section>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-xl font-semibold text-slate-900">Deal Progress</h4>
                  <div className="mt-4 space-y-3">
                    {FLOW_STAGES.map((stage, index) => {
                      const done = index <= detailProgressIndex;
                      return <div key={stage} className="flex items-start gap-2"><span className={`mt-1 h-3 w-3 rounded-full ${done ? 'bg-orange-500' : 'bg-slate-200'}`} /><div><p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-500'}`}>{toTitle(stage)}</p>{index === detailProgressIndex ? <p className="text-xs text-orange-700">Current stage</p> : null}</div></div>;
                    })}
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-orange-500" style={{ width: `${detailProgressPct}%` }} /></div>
                </section>

                <section className="rounded-2xl bg-orange-500 p-4 text-white shadow-sm">
                  <h4 className="text-lg font-semibold">Deal Confidence</h4>
                  <p className="mt-2 text-4xl font-black">{dealConfidence}%</p>
                  <p className="text-sm">{dealConfidence >= 75 ? 'High confidence' : 'Needs more engagement'}</p>
                </section>
              </aside>
            </div>
          </div>
        ) : null}

        {view === 'discovery' ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.3),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.22),transparent_42%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.16)_1px,transparent_1px)] bg-[size:34px_34px]" />
              <div className="relative z-10 h-[640px]">
                {geoLeads.map((item) => (
                  <button key={item.lead.id} type="button" onClick={() => { setFocusedLeadId(item.lead.id); setView('detail'); }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${item.coords.x}%`, top: `${item.coords.y}%` }}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow ring-4 ring-orange-100"><span className="h-2.5 w-2.5 rounded-full bg-white" /></span>
                  </button>
                ))}
              </div>
            </section>

            <aside className="space-y-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-2xl font-semibold text-slate-900">Live Lead Feed</h3><p className="mt-1 text-sm text-slate-500">Top regional prospects by score and intent.</p></section>
              {geoLeads.slice(0, 8).map(({ lead }) => (
                <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><div><p className="text-lg font-semibold text-slate-900">{lead.company_name}</p><p className="text-sm text-slate-500">{lead.city || 'Harare'} - {lead.country || 'Zimbabwe'}</p></div><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourcePillClass(lead.lead_source)}`}>{toTitle(lead.lead_source)}</span></div>
                  <div className="mt-3 flex items-center justify-between"><p className="text-sm text-slate-500">Lead score</p><p className="text-2xl font-black text-orange-500">{lead.lead_score || 0}%</p></div>
                  <div className="mt-3"><StatusPill label={toTitle(lead.lead_status)} tone="info" /></div>
                </article>
              ))}
              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 text-sm text-slate-700">{topGeoLead ? `Prioritize ${topGeoLead.company_name} for immediate outreach in ${topGeoLead.city || 'Harare'}.` : 'Run Lead Finder to capture additional high-intent companies.'}</section>
            </aside>
          </div>
        ) : null}
      </div>

      {selectedLead && <LeadDetailsModal lead={selectedLead} salesReps={mockSalesReps} leadActivities={leadActivities} onClose={handleCloseModal} />}
      {selectedOpportunity && <OpportunityDetailsModal opportunity={selectedOpportunity} leads={leads} salesReps={mockSalesReps} opportunityActivities={opportunityActivities} onClose={handleCloseModal} />}

      {isAddLeadModalOpen && <AddLeadModal onClose={() => setIsAddLeadModalOpen(false)} onAddLead={handleAddLead} />}
      {isAddRuleModalOpen && <AddLeadScoringRuleModal onClose={() => setIsAddRuleModalOpen(false)} onAddRule={handleAddRule} />}
      {isImportModalOpen && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import leads"
          description="Upload a CSV with Zimbabwe/SADC lead columns, map them, and import."
          targetFields={[
            { key: 'first_name', label: 'First Name', required: true },
            { key: 'last_name', label: 'Last Name', required: true },
            { key: 'email', label: 'Email', required: true },
            { key: 'phone', label: 'Phone' },
            { key: 'company_name', label: 'Company', required: true },
            { key: 'lead_status', label: 'Status' },
            { key: 'lead_source', label: 'Source' },
            { key: 'city', label: 'City' },
            { key: 'country', label: 'Country' },
          ]}
          onImport={handleImportLeads}
        />
      )}
    </>
  );
};

export default CrmDashboard;
