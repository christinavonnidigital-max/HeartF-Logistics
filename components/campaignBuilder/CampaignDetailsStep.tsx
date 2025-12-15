import React from 'react';
import { Campaign } from '../../types';

interface CampaignDetailsStepProps {
    data: Partial<Campaign>;
    updateData: (updates: Partial<Campaign>) => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <span className="grow flex flex-col">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-sm text-gray-500">{description}</span>
      </span>
            <button
                type="button"
                className={`${
                    enabled ? 'bg-orange-600' : 'bg-gray-200'
                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shrink-0`}
                role="switch"
                aria-checked={enabled ? 'true' : 'false'}
                aria-label={label}
                title={label}
                onClick={() => onChange(!enabled)}
            >
                        <span
                            className={`${
                                enabled ? 'translate-x-6' : 'translate-x-1'
                            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
      </button>
    </div>
  );
};


const CampaignDetailsStep: React.FC<CampaignDetailsStepProps> = ({ data, updateData }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="space-y-8">
                <div>
                    <label htmlFor="campaign_name" className="block text-sm font-medium text-gray-700">
                        Campaign Name
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="campaign_name"
                            id="campaign_name"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            placeholder="e.g., FMCG Retailers Q1 2025"
                            value={data.campaign_name || ''}
                            onChange={handleChange}
                        />
                    </div>
                     <p className="mt-2 text-sm text-gray-500">Give your campaign a name that's easy to identify.</p>
                </div>
                
                <div>
                    <label htmlFor="campaign_goal" className="block text-sm font-medium text-gray-700">
                        Campaign Goal
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="campaign_goal"
                            id="campaign_goal"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            placeholder="e.g., Schedule 20 introductory calls"
                             value={data.campaign_goal || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">What is the primary objective of this campaign?</p>
                </div>

                <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                        Target Audience
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="target_audience"
                            name="target_audience"
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            placeholder="e.g., Logistics and procurement managers at large FMCG companies in Zimbabwe and South Africa."
                            value={data.target_audience || ''}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Briefly describe the ideal recipient for this campaign's emails.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Tracking Settings</h3>
                        <div className="mt-2 p-4 border border-gray-200 rounded-md space-y-4">
                            <ToggleSwitch
                                label="Track Opens"
                                description="Embed a tracking pixel to see who opens your emails."
                                enabled={data.track_opens ?? true}
                                onChange={(value) => updateData({ track_opens: value })}
                            />
                             <ToggleSwitch
                                label="Track Clicks"
                                description="Replace links with tracking URLs to see who clicks."
                                enabled={data.track_clicks ?? true}
                                onChange={(value) => updateData({ track_clicks: value })}
                            />
                        </div>
                    </div>
                    <div>
                         <h3 className="text-sm font-medium text-gray-700">Automation Settings</h3>
                         <div className="mt-2 p-4 border border-gray-200 rounded-md">
                            <ToggleSwitch
                                label="Auto Pause on Reply"
                                description="If a lead replies, automatically pause the sequence for them."
                                enabled={data.auto_pause_on_reply ?? true}
                                onChange={(value) => updateData({ auto_pause_on_reply: value })}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CampaignDetailsStep;