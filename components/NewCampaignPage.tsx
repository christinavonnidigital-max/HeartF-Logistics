
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
