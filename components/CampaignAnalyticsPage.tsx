
import React from 'react';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';
import { mockCampaigns } from '../data/mockMarketingData';
import { CampaignStatus } from '../types';

const CampaignAnalyticsPage: React.FC = () => {
  
  const getStatusTone = (status: CampaignStatus) => {
      switch (status) {
          case CampaignStatus.ACTIVE: return 'success';
          case CampaignStatus.COMPLETED: return 'info';
          case CampaignStatus.PAUSED: return 'warn';
          default: return 'neutral';
      }
  }

  return (
    <ShellCard className="flex flex-col min-h-[80vh]">
      <div className="p-6 border-b border-slate-100">
        <SectionHeader
          title="Campaign Analytics"
          subtitle="Detailed delivery and engagement metrics"
        />
      </div>
      
      <div className="flex-1 overflow-x-auto p-2">
        <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                <tr>
                    <th className="px-6 py-3 rounded-l-lg">Campaign Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total Leads</th>
                    <th className="px-4 py-3 text-right">Sent</th>
                    <th className="px-4 py-3 text-right">Delivered</th>
                    <th className="px-4 py-3 text-right">Bounced</th>
                    <th className="px-4 py-3 text-right">Unsub</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Reply Rate</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {mockCampaigns.map(campaign => {
                    const bounceRate = campaign.emails_sent > 0 ? (campaign.emails_bounced / campaign.emails_sent * 100).toFixed(1) : '0.0';
                    const replyRate = campaign.emails_opened > 0 ? (campaign.emails_replied / campaign.emails_opened * 100).toFixed(1) : '0.0';
                    
                    return (
                        <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{campaign.campaign_name}</td>
                            <td className="px-4 py-4">
                                <StatusPill label={campaign.status.replace('_', ' ')} tone={getStatusTone(campaign.status)} />
                            </td>
                            <td className="px-4 py-4 text-right text-slate-600">{campaign.total_leads}</td>
                            <td className="px-4 py-4 text-right text-slate-600">{campaign.emails_sent}</td>
                            <td className="px-4 py-4 text-right font-medium text-emerald-600">{campaign.emails_delivered}</td>
                            <td className="px-4 py-4 text-right text-slate-600">
                                {campaign.emails_bounced} <span className="text-xs text-slate-700">({bounceRate}%)</span>
                            </td>
                            <td className="px-4 py-4 text-right text-slate-600">{campaign.unsubscribes}</td>
                            <td className="px-4 py-4 text-right font-medium text-indigo-600">{replyRate}%</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        {mockCampaigns.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                No analytics data available.
            </div>
        )}
      </div>
    </ShellCard>
  );
};

export default CampaignAnalyticsPage;
