
import React, { useState, useMemo } from 'react';
import { Campaign, CampaignStatus, CampaignType } from '../types';
import { mockCampaigns } from '../data/mockMarketingData';
import { PlusIcon, SearchIcon, PlayIcon, PauseIcon, DuplicateIcon, TrashIcon } from './icons/Icons';
import { View } from '../App';

interface CampaignsPageProps {
    setActiveView: (view: View) => void;
}

const getStatusPill = (status: CampaignStatus) => {
    switch (status) {
        case CampaignStatus.ACTIVE:
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center"><div className="w-2 h-2 mr-1.5 bg-green-500 rounded-full"></div>Active</span>;
        case CampaignStatus.PAUSED:
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center"><div className="w-2 h-2 mr-1.5 bg-yellow-500 rounded-full"></div>Paused</span>;
        case CampaignStatus.DRAFT:
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center"><div className="w-2 h-2 mr-1.5 bg-gray-500 rounded-full"></div>Draft</span>;
        case CampaignStatus.COMPLETED:
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center"><div className="w-2 h-2 mr-1.5 bg-blue-500 rounded-full"></div>Completed</span>;
        default:
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
};

const CampaignsPage: React.FC<CampaignsPageProps> = ({ setActiveView }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

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

    return (
        <div className="bg-white rounded-xl shadow-md flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-bold">Email Campaigns</h2>
                    <button
                        onClick={() => setActiveView('new-campaign')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>New Campaign</span>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                        className="rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="all">All Statuses</option>
                        {Object.values(CampaignStatus).map(status => (
                            <option key={status} value={status} className="capitalize">{status}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Campaign Name</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Leads</th>
                            <th scope="col" className="px-6 py-3 text-center">Sent</th>
                            <th scope="col" className="px-6 py-3 text-center">Open Rate</th>
                            <th scope="col" className="px-6 py-3 text-center">Click Rate</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCampaigns.map(campaign => {
                            const openRate = calculateRate(campaign.emails_opened, campaign.emails_delivered);
                            const clickRate = calculateRate(campaign.emails_clicked, campaign.emails_opened);
                            return (
                                <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{campaign.campaign_name}</td>
                                    <td className="px-6 py-4 text-center">{getStatusPill(campaign.status)}</td>
                                    <td className="px-6 py-4 text-center">{campaign.total_leads}</td>
                                    <td className="px-6 py-4 text-center">{campaign.emails_sent}</td>
                                    <td className="px-6 py-4 text-center">{openRate.toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-center">{clickRate.toFixed(1)}%</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button className="p-1.5 text-gray-500 hover:text-green-600"><PlayIcon className="w-5 h-5" /></button>
                                            <button className="p-1.5 text-gray-500 hover:text-yellow-600"><PauseIcon className="w-5 h-5" /></button>
                                            <button 
                                                className="p-1.5 text-gray-500 hover:text-blue-600"
                                                onClick={() => handleDuplicateCampaign(campaign.id)}
                                                aria-label={`Duplicate campaign ${campaign.campaign_name}`}
                                            >
                                                <DuplicateIcon className="w-5 h-5" />
                                            </button>
                                            <button className="p-1.5 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {filteredCampaigns.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No campaigns found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignsPage;