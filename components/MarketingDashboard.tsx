
import React, { useMemo } from 'react';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';
import { CampaignIcon, EnvelopeIcon, MapPinIcon, PlayIcon, PauseIcon } from './icons';
import { SparklesIcon } from './icons';
import { mockCampaigns } from '../data/mockMarketingData';
import { Campaign, CampaignStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const MarketingDashboard: React.FC = () => {
  
  const stats = useMemo(() => {
    const totalSent = mockCampaigns.reduce((acc, c) => acc + c.emails_sent, 0);
    const totalOpened = mockCampaigns.reduce((acc, c) => acc + c.emails_opened, 0);
    const totalClicked = mockCampaigns.reduce((acc, c) => acc + c.emails_clicked, 0);
    
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    return {
        totalSent,
        avgOpenRate: avgOpenRate.toFixed(1),
        avgClickRate: avgClickRate.toFixed(1)
    };
  }, []);

  const performanceData = useMemo(() => {
    return mockCampaigns
        .filter(c => c.emails_sent > 0)
        .map(c => ({
            name: c.campaign_name.split(' - ')[0].substring(0, 15) + '...',
            full_name: c.campaign_name,
            'Open Rate': c.emails_sent > 0 ? parseFloat(((c.emails_opened / c.emails_sent) * 100).toFixed(1)) : 0,
            'Click Rate': c.emails_opened > 0 ? parseFloat(((c.emails_clicked / c.emails_opened) * 100).toFixed(1)) : 0,
        })).slice(0, 6);
  }, []);

  const engagementData = useMemo(() => {
      const replied = mockCampaigns.reduce((acc, c) => acc + c.emails_replied, 0);
      const clickedOnly = mockCampaigns.reduce((acc, c) => acc + (c.emails_clicked - c.emails_replied), 0);
      const openedOnly = mockCampaigns.reduce((acc, c) => acc + (c.emails_opened - c.emails_clicked), 0);
      const ignored = mockCampaigns.reduce((acc, c) => acc + (c.emails_delivered - c.emails_opened), 0);

      return [
          { name: 'Replied', value: replied, color: '#10B981' },
          { name: 'Clicked', value: clickedOnly, color: '#3B82F6' },
          { name: 'Opened', value: openedOnly, color: '#F59E0B' },
          { name: 'No Action', value: ignored, color: '#E5E7EB' },
      ].filter(d => d.value > 0);
  }, []);

  const activeCampaigns = useMemo(() => {
      return mockCampaigns
        .filter(c => c.status === CampaignStatus.ACTIVE || c.status === CampaignStatus.PAUSED)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, []);

  const getStatusTone = (status: CampaignStatus) => {
      switch (status) {
          case CampaignStatus.ACTIVE: return 'success';
          case CampaignStatus.COMPLETED: return 'info';
          case CampaignStatus.PAUSED: return 'warn';
          case CampaignStatus.DRAFT: return 'neutral';
          default: return 'neutral';
      }
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emails Sent</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSent.toLocaleString()}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.avgOpenRate}%</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <MapPinIcon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Click-Through</p>
                <p className="text-2xl font-bold text-slate-900">{stats.avgClickRate}%</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <ShellCard className="lg:col-span-2 p-5 flex flex-col h-[400px]">
            <SectionHeader
                title="Campaign Performance"
                subtitle="Open rates vs Click rates for recent campaigns"
            />
            <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 11}} />
                        <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="Open Rate" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="Click Rate" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ShellCard>

        {/* Engagement Pie */}
        <ShellCard className="p-5 flex flex-col h-[400px]">
            <SectionHeader
                title="Lead Engagement"
                subtitle="Interaction breakdown"
            />
            <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={engagementData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {engagementData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </ShellCard>
      </div>

      {/* Active Campaigns List */}
      <ShellCard className="flex flex-col">
        <div className="p-4 border-b border-slate-100">
            <SectionHeader
                title="Active Campaigns"
                subtitle="Live status of currently running outreach"
                actions={
                    <button className="text-xs font-medium text-orange-600 hover:text-orange-700">View All</button>
                }
            />
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                    <tr>
                        <th className="px-6 py-3">Campaign</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3 text-right">Open Rate</th>
                        <th className="px-4 py-3 text-right">Reply Rate</th>
                        <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activeCampaigns.length > 0 ? activeCampaigns.map(campaign => {
                        const progress = campaign.total_leads > 0 ? Math.round((campaign.emails_sent / campaign.total_leads) * 100) : 0;
                        const openRate = campaign.emails_sent > 0 ? ((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(1) : '0.0';
                        const replyRate = campaign.emails_opened > 0 ? ((campaign.emails_replied / campaign.emails_opened) * 100).toFixed(1) : '0.0';

                        return (
                            <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <CampaignIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{campaign.campaign_name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{campaign.campaign_type.replace('_', ' ').toLowerCase()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <StatusPill label={campaign.status} tone={getStatusTone(campaign.status)} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="w-full max-w-[120px]">
                                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                                            <span>{progress}%</span>
                                            <span>{campaign.emails_sent}/{campaign.total_leads}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right font-medium text-slate-700">{openRate}%</td>
                                <td className="px-4 py-4 text-right font-medium text-slate-700">{replyRate}%</td>
                                <td className="px-4 py-4 text-center">
                                    <button aria-label={campaign.status === 'active' ? 'Pause campaign' : 'Start campaign'} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                        {campaign.status === 'active' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                                    </button>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                No active campaigns at the moment.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </ShellCard>
    </div>
  );
};

export default MarketingDashboard;
