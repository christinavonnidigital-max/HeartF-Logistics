
import React, { useState, useMemo } from 'react';
import { Campaign, CampaignStatus, CampaignType } from '../types';
import { mockCampaigns } from '../data/mockMarketingData';
import { PlusIcon, SearchIcon, PlayIcon, PauseIcon, DuplicateIcon, TrashIcon } from './icons/Icons';
import { View } from '../App';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';
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
            default: return 'neutral';
        }
    }

    return (
        <>
        <ShellCard className="flex flex-col">
            <div className="p-4 border-b border-slate-100">
                <SectionHeader
                    title="Email Campaigns"
                    subtitle="Automated outreach across your pipeline"
                    actions={
                        <button
                            onClick={() => setActiveView('new-campaign')}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>New Campaign</span>
                        </button>
                    }
                />
                <div className="mt-2 flex items-center gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                        className="rounded-md border border-slate-200 bg-white text-slate-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="all">All Statuses</option>
                        {Object.values(CampaignStatus).map(status => (
                            <option key={status} value={status} className="capitalize">{status}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="min-w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-medium">Campaign Name</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Status</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Leads</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Sent</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Open Rate</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Click Rate</th>
                            <th scope="col" className="px-6 py-3 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCampaigns.map(campaign => {
                            const openRate = calculateRate(campaign.emails_opened, campaign.emails_delivered);
                            const clickRate = calculateRate(campaign.emails_clicked, campaign.emails_opened);
                            return (
                                <tr key={campaign.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{campaign.campaign_name}</td>
                                    <td className="px-6 py-4 text-center"><StatusPill label={campaign.status} tone={getStatusTone(campaign.status)}/></td>
                                    <td className="px-6 py-4 text-center">{campaign.total_leads}</td>
                                    <td className="px-6 py-4 text-center">{campaign.emails_sent}</td>
                                    <td className="px-6 py-4 text-center">{openRate.toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-center">{clickRate.toFixed(1)}%</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button className="p-1.5 text-slate-500 hover:text-emerald-600"><PlayIcon className="w-5 h-5" /></button>
                                            <button className="p-1.5 text-slate-500 hover:text-amber-600"><PauseIcon className="w-5 h-5" /></button>
                                            <button 
                                                className="p-1.5 text-slate-500 hover:text-sky-600"
                                                onClick={() => handleDuplicateCampaign(campaign.id)}
                                                aria-label={`Duplicate campaign ${campaign.campaign_name}`}
                                            >
                                                <DuplicateIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                className="p-1.5 text-slate-500 hover:text-rose-600"
                                                onClick={() => setCampaignToDelete(campaign.id)}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {filteredCampaigns.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        No campaigns found.
                    </div>
                )}
            </div>
        </ShellCard>
        
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
