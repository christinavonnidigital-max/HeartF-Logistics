
import React, { useState } from 'react';
import { Campaign, CampaignStatus, CampaignType, EmailSequence } from '../types';
import CampaignDetailsStep from './campaignBuilder/CampaignDetailsStep';
import SequenceBuilderStep from './campaignBuilder/SequenceBuilderStep';
import { View } from '../App';
import { ShellCard, SectionHeader } from './UiKit';

interface NewCampaignPageProps {
    setActiveView: (view: View) => void;
}

const NewCampaignPage: React.FC<NewCampaignPageProps> = ({ setActiveView }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [campaignData, setCampaignData] = useState<Partial<Campaign> & { sequences?: EmailSequence[] }>({
        campaign_name: '',
        campaign_goal: '',
        target_audience: '',
        status: CampaignStatus.DRAFT,
        campaign_type: CampaignType.COLD_OUTREACH,
        track_opens: true,
        track_clicks: true,
        auto_pause_on_reply: true,
        sequences: [],
    });

    const updateCampaignData = (updates: Partial<Campaign>) => {
        setCampaignData(prev => ({ ...prev, ...updates }));
    };
    
    const updateSequences = (sequences: EmailSequence[]) => {
        setCampaignData(prev => ({ ...prev, sequences }));
    }

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            setActiveView('campaigns');
        }
    };
    
    const renderStep = () => {
        switch(currentStep) {
            case 1:
                return <CampaignDetailsStep data={campaignData} updateData={updateCampaignData} />;
            case 2:
                return <SequenceBuilderStep sequences={campaignData.sequences || []} updateSequences={updateSequences} />;
            case 3:
                return (
                    <div className="max-w-3xl mx-auto space-y-4 text-slate-700">
                        <p className="text-sm text-slate-500 text-center">Step 3: Select leads to enroll in this sequence.</p>
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <p className="text-base font-semibold mb-1">Lead selection coming soon</p>
                            <p className="text-sm text-slate-500 mb-4">For now we’ll enroll all matching leads based on your audience filters.</p>
                            <button
                                onClick={handleNext}
                                className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-orange-700 transition"
                            >
                                Continue to Review
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="max-w-3xl mx-auto space-y-4">
                        <p className="text-sm text-slate-500 text-center">Step 4: Review & launch</p>
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
                            <h3 className="text-lg font-bold text-slate-900">Summary</h3>
                            <ul className="text-sm text-slate-700 space-y-1">
                                <li><strong>Name:</strong> {campaignData.campaign_name || 'Untitled campaign'}</li>
                                <li><strong>Type:</strong> {campaignData.campaign_type}</li>
                                <li><strong>Sequence steps:</strong> {campaignData.sequences?.length || 0}</li>
                                <li><strong>Tracking:</strong> {campaignData.track_opens ? 'Opens' : '—'} / {campaignData.track_clicks ? 'Clicks' : '—'}</li>
                            </ul>
                            <p className="text-xs text-slate-500">Launching will enroll eligible leads automatically once lead selection is available.</p>
                        </div>
                    </div>
                );
            default:
                return <div className="text-center text-slate-500 py-16">Step {currentStep} not implemented yet.</div>;
        }
    }

    return (
        <ShellCard className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100">
                <SectionHeader
                  title={`Step ${currentStep}: ${['Campaign Details', 'Build Sequence', 'Select Leads', 'Review & Launch'][currentStep - 1]}`}
                  subtitle="Build a new sequence in a few steps"
                />
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                {renderStep()}
            </div>
            <footer className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
                <button
                    type="button"
                    onClick={handleBack}
                    className="w-full sm:w-auto bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                    {currentStep === 1 ? 'Back to Campaigns' : 'Back'}
                </button>
                <div className="flex w-full sm:w-auto items-center gap-3">
                    <button
                        type="button"
                        onClick={() => alert('Campaign saved as draft!')}
                        className="flex-1 sm:flex-initial bg-slate-100 py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-800 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 sm:flex-initial inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        {currentStep === 4 ? 'Launch Campaign' : 'Next Step'}
                    </button>
                </div>
            </footer>
        </ShellCard>
    );
};

export default NewCampaignPage;
