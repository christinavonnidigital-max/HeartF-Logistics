
import React, { useState, useMemo } from 'react';
import { Campaign, CampaignStatus, CampaignType } from '../types';
import { mockCampaigns } from '../data/mockMarketingData';
import { PlusIcon, SearchIcon, PlayIcon, PauseIcon, DuplicateIcon, TrashIcon, EnvelopeIcon, TagIcon, DocumentTextIcon, CalendarDaysIcon, ArrowPathIcon } from './icons';
import { SparklesIcon } from './icons';
import { View } from '../App';
import { SectionHeader, StatusPill } from './UiKit';
import { ShellCard } from './UiKit_new';
import ConfirmModal from './ConfirmModal';


interface CampaignsPageProps {
    setActiveView: (view: View) => void;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ setActiveView }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
    const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);

    const handleDuplicateCampaign = (campaignId: number) => {
        const campaignToDuplicate = campaigns.find(c => c.id === campaignId);
        if (!campaignToDuplicate) return;

        const newCampaign: Campaign = {
            ...campaignToDuplicate,
            id: Date.now(), // New unique ID
            campaign_name: `${campaignToDuplicate.campaign_name} - Copy`,
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

        setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
    };

    const confirmDeleteCampaign = () => {
        if (campaignToDelete !== null) {
            setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete));
            setCampaignToDelete(null);
        }
    }

    const filteredCampaigns = useMemo(() => {
        return campaigns
            .filter(campaign => {
                if (statusFilter === 'all') return true;
                return campaign.status === statusFilter;
            })
            .filter(campaign => {
                if (!searchTerm) return true;
                return campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [campaigns, searchTerm, statusFilter]);
    
    const calculateRate = (numerator: number, denominator: number) => {
        if (denominator === 0) return 0;
        return (numerator / denominator) * 100;
    }
    
    const getStatusTone = (status: CampaignStatus) => {
        switch (status) {
            case CampaignStatus.ACTIVE: return 'success';
            case CampaignStatus.COMPLETED: return 'info';
            case CampaignStatus.PAUSED: return 'warn';
            case CampaignStatus.DRAFT: return 'neutral';
            default: return 'neutral';
        }
    }

    const getCampaignStyle = (type: CampaignType) => {
        switch (type) {
            case CampaignType.COLD_OUTREACH: return { icon: <EnvelopeIcon className="w-5 h-5" />, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' };
            case CampaignType.NURTURE: return { icon: <SparklesIcon className="w-5 h-5" />, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' };
            case CampaignType.PROMOTIONAL: return { icon: <TagIcon className="w-5 h-5" />, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
            case CampaignType.NEWSLETTER: return { icon: <DocumentTextIcon className="w-5 h-5" />, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
            case CampaignType.EVENT: return { icon: <CalendarDaysIcon className="w-5 h-5" />, bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' };
            case CampaignType.REENGAGEMENT: return { icon: <ArrowPathIcon className="w-5 h-5" />, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' };
            default: return { icon: <DocumentTextIcon className="w-5 h-5" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
        }
    }

    return (
        <>
        <div className="space-y-6">
            {/* Header & Filters */}
            <ShellCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Campaigns</h2>
                    <p className="text-xs text-slate-500">Manage automated outreach sequences</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative grow sm:w-64">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <select
                        aria-label="Filter campaigns by status"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                        className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    >
                        <option value="all">All Statuses</option>
                        {Object.values(CampaignStatus).map(status => (
                            <option key={status} value={status} className="capitalize">{status.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:border-orange-300 hover:text-orange-700 transition"
                    >
                        View All
                    </button>
                    <button
                        onClick={() => setActiveView('new-campaign')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="whitespace-nowrap">New Campaign</span>
                    </button>
                </div>
            </ShellCard>

            {/* Campaign List */}
            <div className="space-y-4">
                {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map(campaign => {
                        const openRate = calculateRate(campaign.emails_opened, campaign.emails_delivered);
                        const clickRate = calculateRate(campaign.emails_clicked, campaign.emails_opened);
                        const progress = campaign.total_leads > 0 ? Math.round((campaign.emails_sent / campaign.total_leads) * 100) : 0;
                        const style = getCampaignStyle(campaign.campaign_type);

                        return (
                            <div 
                                key={campaign.id} 
                                className="group relative bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-200 cursor-pointer"
                                onClick={() => setActiveView('analytics')}
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${style.bg} ${style.text} border ${style.border} shrink-0`}>
                                            {style.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-slate-900">{campaign.campaign_name}</h3>
                                                <StatusPill label={campaign.status.replace(/_/g, ' ')} tone={getStatusTone(campaign.status)} />
                                            </div>
                                            <p className="text-sm text-slate-500">{campaign.campaign_goal}</p>
                                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                Created {new Date(campaign.created_at).toLocaleDateString()} • {campaign.campaign_type.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-start">
                                        {campaign.status === CampaignStatus.ACTIVE ? (
                                            <button className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition" title="Pause" onClick={(e) => { e.stopPropagation(); }}>
                                                <PauseIcon className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Start" onClick={(e) => { e.stopPropagation(); }}>
                                                <PlayIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDuplicateCampaign(campaign.id); }}
                                            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition"
                                            title="Duplicate"
                                        >
                                            <DuplicateIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setCampaignToDelete(campaign.id); }}
                                            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Total Leads</p>
                                        <p className="text-lg font-bold text-slate-900 mt-0.5">{campaign.total_leads}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Emails Sent</p>
                                        <p className="text-lg font-bold text-slate-900 mt-0.5">{campaign.emails_sent}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Open Rate</p>
                                        <p className={`text-lg font-bold mt-0.5 ${openRate > 30 ? 'text-emerald-600' : 'text-slate-900'}`}>{openRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Click Rate</p>
                                        <p className={`text-lg font-bold mt-0.5 ${clickRate > 5 ? 'text-emerald-600' : 'text-slate-900'}`}>{clickRate.toFixed(1)}%</p>
                                    </div>
                                </div>

                                {campaign.status !== CampaignStatus.DRAFT && (
                                    <div className="mt-2 pt-2">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                            <span className="font-medium">Sending Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    campaign.status === CampaignStatus.COMPLETED ? 'bg-emerald-500' : 
                                                    campaign.status === CampaignStatus.PAUSED ? 'bg-amber-400' : 
                                                    'bg-orange-500'
                                                }`} 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                            <SearchIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">No campaigns found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                            {searchTerm ? `No results for "${searchTerm}". Try a different keyword.` : 'Get started by creating your first email sequence.'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setActiveView('new-campaign')}
                                className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Create Campaign
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        <ConfirmModal 
            isOpen={campaignToDelete !== null}
            onClose={() => setCampaignToDelete(null)}
            onConfirm={confirmDeleteCampaign}
            title="Delete Campaign"
            message="Are you sure you want to delete this campaign? All analytics and logs associated with it will be removed."
            confirmLabel="Delete Campaign"
        />
        </>
    );
};

export default CampaignsPage;
