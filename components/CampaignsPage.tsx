import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Campaign, CampaignStatus } from '../types';
import { mockCampaigns } from '../data/mockMarketingData';
import {
  CalendarDaysIcon,
  DuplicateIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  TruckIcon,
} from './icons';
import { View } from '../App';
import { Button, ShellCard, StatusPill } from './UiKit';
import ConfirmModal from './ConfirmModal';

interface CampaignsPageProps {
  setActiveView: (view: View) => void;
}

const TABLE_PAGE_SIZE = 5;
const CAMPAIGN_EDITOR_SEED_KEY = 'hf_campaign_editor_seed_v1';
const CAMPAIGN_EDITOR_NOTICE_KEY = 'hf_campaign_editor_notice_v1';

const formatDateZW = (iso?: string) => {
  if (!iso) return 'Not set';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Africa/Harare',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const timeAgo = (iso?: string) => {
  if (!iso) return 'Updated recently';
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'Updated recently';
  const hours = Math.floor((now - then) / (1000 * 60 * 60));
  if (hours < 24) return `Updated ${Math.max(1, hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
};

const getStatusTone = (status: CampaignStatus) => {
  switch (status) {
    case CampaignStatus.ACTIVE:
      return 'success';
    case CampaignStatus.PAUSED:
      return 'warn';
    case CampaignStatus.COMPLETED:
      return 'info';
    default:
      return 'neutral';
  }
};

const statusChipClass: Record<CampaignStatus, string> = {
  [CampaignStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700',
  [CampaignStatus.SCHEDULED]: 'bg-amber-100 text-amber-700',
  [CampaignStatus.PAUSED]: 'bg-slate-200 text-slate-700',
  [CampaignStatus.DRAFT]: 'bg-slate-100 text-slate-700',
  [CampaignStatus.COMPLETED]: 'bg-blue-100 text-blue-700',
  [CampaignStatus.ARCHIVED]: 'bg-slate-100 text-slate-600',
};

const CampaignsPage: React.FC<CampaignsPageProps> = ({ setActiveView }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [layout, setLayout] = useState<'table' | 'library'>('table');
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'info' } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const calculateRate = (numerator: number, denominator: number) =>
    denominator > 0 ? (numerator / denominator) * 100 : 0;

  const filteredCampaigns = useMemo(
    () =>
      campaigns
        .filter((campaign) => (statusFilter === 'all' ? true : campaign.status === statusFilter))
        .filter((campaign) => {
          const query = searchTerm.trim().toLowerCase();
          if (!query) return true;
          return (
            campaign.campaign_name.toLowerCase().includes(query) ||
            campaign.target_audience.toLowerCase().includes(query) ||
            campaign.campaign_goal.toLowerCase().includes(query)
          );
        }),
    [campaigns, searchTerm, statusFilter],
  );

  const totalFiltered = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / TABLE_PAGE_SIZE));
  const pageStartIndex = (tablePage - 1) * TABLE_PAGE_SIZE;
  const pagedCampaigns = useMemo(
    () => filteredCampaigns.slice(pageStartIndex, pageStartIndex + TABLE_PAGE_SIZE),
    [filteredCampaigns, pageStartIndex],
  );

  const recentDrafts = useMemo(
    () =>
      [...campaigns]
        .filter((campaign) => campaign.status === CampaignStatus.DRAFT)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 2),
    [campaigns],
  );

  const calendarItems = useMemo(
    () =>
      [...campaigns]
        .filter((campaign) =>
          campaign.status === CampaignStatus.SCHEDULED || campaign.status === CampaignStatus.DRAFT,
        )
        .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
        .slice(0, 4),
    [campaigns],
  );

  const stats = useMemo(() => {
    const totals = campaigns.reduce(
      (acc, campaign) => {
        acc.totalLeads += campaign.total_leads || 0;
        acc.totalSent += campaign.emails_sent || 0;
        acc.totalDelivered += campaign.emails_delivered || 0;
        acc.totalOpened += campaign.emails_opened || 0;
        acc.totalClicked += campaign.emails_clicked || 0;
        return acc;
      },
      { totalLeads: 0, totalSent: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0 },
    );

    return {
      totalOutreach: totals.totalSent,
      avgEngagementRate: calculateRate(
        totals.totalOpened + totals.totalClicked,
        Math.max(1, totals.totalDelivered * 2),
      ),
      leadsGenerated: totals.totalLeads,
    };
  }, [campaigns]);

  const channelBreakdown = useMemo(() => {
    const email = campaigns.filter(
      (campaign) =>
        campaign.campaign_type === 'newsletter' || campaign.campaign_type === 'nurture',
    ).length;
    const linkedIn = campaigns.filter(
      (campaign) =>
        campaign.campaign_type === 'cold_outreach' || campaign.campaign_type === 'reengagement',
    ).length;
    const sms = campaigns.filter(
      (campaign) =>
        campaign.campaign_type === 'promotional' || campaign.campaign_type === 'event',
    ).length;
    const total = Math.max(1, email + linkedIn + sms);
    return [
      { label: 'Email', pct: Math.round((email / total) * 100) },
      { label: 'LinkedIn', pct: Math.round((linkedIn / total) * 100) },
      { label: 'SMS', pct: Math.round((sms / total) * 100) },
    ];
  }, [campaigns]);

  const recentActivity = useMemo(
    () =>
      [...campaigns]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4)
        .map((campaign) => ({
          id: campaign.id,
          label:
            campaign.status === CampaignStatus.COMPLETED
              ? `Completed ${campaign.campaign_name}`
              : campaign.status === CampaignStatus.ACTIVE
                ? `Campaign running: ${campaign.campaign_name}`
                : `Updated ${campaign.campaign_name}`,
          when: formatDateZW(campaign.updated_at),
        })),
    [campaigns],
  );

  useEffect(() => {
    setTablePage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, statusFilter, layout]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  const showToast = (message: string, tone: 'success' | 'info' = 'success') => {
    setToast({ message, tone });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const handleDuplicateCampaign = (campaignId: number) => {
    const source = campaigns.find((campaign) => campaign.id === campaignId);
    if (!source) return;
    const copy: Campaign = {
      ...source,
      id: Date.now(),
      campaign_name: `${source.campaign_name} - Copy`,
      status: CampaignStatus.DRAFT,
      total_leads: 0,
      emails_sent: 0,
      emails_delivered: 0,
      emails_opened: 0,
      emails_clicked: 0,
      emails_replied: 0,
      emails_bounced: 0,
      unsubscribes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      started_at: undefined,
      paused_at: undefined,
      completed_at: undefined,
    };
    setCampaigns((prev) => [copy, ...prev]);
    showToast(`Created draft copy: ${copy.campaign_name}`);
  };

  const handleArchiveCampaign = (campaignId: number) => {
    let archivedName = '';
    setCampaigns((prev) =>
      prev.map((campaign) => {
        if (campaign.id !== campaignId) return campaign;
        archivedName = campaign.campaign_name;
        return {
          ...campaign,
          status: CampaignStatus.ARCHIVED,
          updated_at: new Date().toISOString(),
        };
      }),
    );
    showToast(`Archived campaign: ${archivedName}`);
  };

  const handleOpenCampaign = (campaign: Campaign) => {
    if (typeof window !== 'undefined') {
      const seed = {
        campaign_name: campaign.campaign_name,
        campaign_goal: campaign.campaign_goal,
        target_audience: campaign.target_audience,
        status:
          campaign.status === CampaignStatus.ARCHIVED ? CampaignStatus.DRAFT : campaign.status,
        campaign_type: campaign.campaign_type,
        track_opens: campaign.track_opens,
        track_clicks: campaign.track_clicks,
        auto_pause_on_reply: campaign.auto_pause_on_reply,
        sequences: [],
      };
      window.localStorage.setItem(CAMPAIGN_EDITOR_SEED_KEY, JSON.stringify(seed));
      window.localStorage.setItem(CAMPAIGN_EDITOR_NOTICE_KEY, `Loaded campaign: ${campaign.campaign_name}`);
    }
    setActiveView('new-campaign');
  };

  const confirmDeleteCampaign = () => {
    if (campaignToDelete === null) return;
    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== campaignToDelete));
    setCampaignToDelete(null);
  };

  return (
    <>
      <div className="space-y-5">
        <ShellCard className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Campaign Manager</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage outreach campaigns for Zimbabwe and SADC corridors.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <SearchIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns, sectors, or routes..."
                  className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <Button variant="primary" onClick={() => setActiveView('new-campaign')}>
                <PlusIcon className="h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </div>
        </ShellCard>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Outreach</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.totalOutreach.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Engagement</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.avgEngagementRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leads Generated (MTD)</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.leadsGenerated.toLocaleString()}</p>
          </div>
        </div>

        <ShellCard className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">View</p>
                <div className="mt-1 flex items-center rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLayout('table')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${layout === 'table' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    Table View
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout('library')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${layout === 'library' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    Library View
                  </button>
                </div>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {totalFiltered} result{totalFiltered === 1 ? '' : 's'}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <select
                aria-label="Filter campaigns by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                <option value="all">All statuses</option>
                {Object.values(CampaignStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {layout === 'table' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] p-4">
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Campaign Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Audience Segment</th>
                        <th className="px-4 py-3 text-right">Open Rate</th>
                        <th className="px-4 py-3 text-right">Click Rate</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedCampaigns.map((campaign) => {
                        const openRate = calculateRate(
                          campaign.emails_opened,
                          Math.max(1, campaign.emails_delivered),
                        );
                        const clickRate = calculateRate(
                          campaign.emails_clicked,
                          Math.max(1, campaign.emails_opened),
                        );
                        return (
                          <tr key={campaign.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{campaign.campaign_name}</p>
                              <p className="text-xs text-slate-500">
                                Updated {formatDateZW(campaign.updated_at)}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill
                                label={campaign.status.replace(/_/g, ' ')}
                                tone={getStatusTone(campaign.status)}
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {campaign.target_audience || 'General segment'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {openRate.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {clickRate.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {campaign.status === CampaignStatus.ACTIVE ? (
                                  <button
                                    aria-label="Pause campaign"
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                  >
                                    <PauseIcon className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    aria-label="Start campaign"
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                  >
                                    <PlayIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  aria-label="Duplicate campaign"
                                  onClick={() => handleDuplicateCampaign(campaign.id)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <DuplicateIcon className="h-4 w-4" />
                                </button>
                                <button
                                  aria-label="Delete campaign"
                                  onClick={() => setCampaignToDelete(campaign.id)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-600">
                    {totalFiltered === 0
                      ? 'No campaigns found.'
                      : `Showing ${pageStartIndex + 1}-${Math.min(pageStartIndex + TABLE_PAGE_SIZE, totalFiltered)} of ${totalFiltered} campaigns`}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                      disabled={tablePage <= 1}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      Page {tablePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={tablePage >= totalPages}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
                {recentDrafts.length ? (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Drafts</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recentDrafts.map((draft) => (
                        <span
                          key={draft.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                        >
                          {draft.campaign_name} - {formatDateZW(draft.updated_at)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="space-y-4">
                <ShellCard className="p-4">
                  <h3 className="text-2xl font-semibold text-slate-900">Campaign Insights</h3>
                  <div className="mt-4 space-y-3">
                    {channelBreakdown.map((channel) => (
                      <div key={channel.label}>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>{channel.label}</span>
                          <span>{channel.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{ width: `${channel.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ShellCard>

                <ShellCard className="p-4">
                  <h4 className="text-lg font-semibold text-slate-900">Recent Activity</h4>
                  <div className="mt-3 space-y-3">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.when}</p>
                      </div>
                    ))}
                  </div>
                </ShellCard>
              </aside>
            </div>
          ) : (
            <div className="grid gap-5 p-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <ShellCard className="p-4">
                  <div className="flex rounded-full bg-slate-100 p-1">
                    <button className="flex-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-orange-700 shadow-sm">
                      My Campaigns
                    </button>
                    <button className="flex-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600">
                      All
                    </button>
                  </div>
                </ShellCard>

                <ShellCard className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">Campaign Calendar</h4>
                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-3 space-y-3">
                    {calendarItems.length ? (
                      calendarItems.map((campaign) => (
                        <div key={campaign.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{campaign.campaign_name}</p>
                          <p className="text-xs text-slate-500">{formatDateZW(campaign.updated_at)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No scheduled campaigns.</p>
                    )}
                  </div>
                </ShellCard>

                <ShellCard className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">Template Library</h4>
                    <button className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                      View all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-gradient-to-b from-amber-200 to-amber-500/70 p-3 text-xs font-semibold text-white">
                      Harare Lane Update
                    </div>
                    <div className="rounded-xl bg-gradient-to-b from-rose-200 to-rose-400/70 p-3 text-xs font-semibold text-white">
                      Border Delay Notice
                    </div>
                  </div>
                </ShellCard>
              </aside>

              <section>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-900">Campaign Library</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Visual campaign snapshots for Zimbabwe and nearby markets.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    Last edited
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCampaigns.map((campaign, index) => {
                    const gradient = [
                      'from-orange-300 via-amber-300 to-yellow-200',
                      'from-cyan-300 via-blue-300 to-slate-200',
                      'from-emerald-300 via-teal-300 to-cyan-200',
                      'from-violet-300 via-indigo-300 to-slate-200',
                    ][index % 4];
                    const openRate = calculateRate(
                      campaign.emails_opened,
                      Math.max(1, campaign.emails_delivered),
                    );
                    const roi = Math.max(
                      1.2,
                      Number(((campaign.emails_replied + campaign.emails_clicked / 5 + 1) / 2).toFixed(1)),
                    );

                    return (
                      <article key={campaign.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className={`h-36 bg-gradient-to-r ${gradient} relative`}>
                          <div className="absolute right-3 top-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${statusChipClass[campaign.status]}`}
                            >
                              {campaign.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700">
                            <TruckIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="text-2xl font-semibold text-slate-900">{campaign.campaign_name}</h4>
                          <p className="mt-1 text-sm text-slate-500">{timeAgo(campaign.updated_at)}</p>
                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open Rate</p>
                              <p className="text-3xl font-semibold text-slate-900">{openRate.toFixed(1)}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ROI</p>
                              <p className="text-3xl font-semibold text-orange-600">{roi.toFixed(1)}x</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() => handleOpenCampaign(campaign)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateCampaign(campaign.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveCampaign(campaign.id)}
                              disabled={campaign.status === CampaignStatus.ARCHIVED}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {campaign.status === CampaignStatus.ARCHIVED ? 'Archived' : 'Archive'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </ShellCard>
      </div>

      <ConfirmModal
        isOpen={campaignToDelete !== null}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? All analytics and logs associated with it will be removed."
        confirmLabel="Delete Campaign"
      />
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <div
            className={`rounded-xl border px-4 py-2 text-sm font-semibold shadow-lg ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CampaignsPage;
