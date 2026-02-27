import React, { useEffect, useMemo, useState } from 'react';
import { Campaign, CampaignStatus, CampaignType, EmailSequence } from '../types';
import CampaignDetailsStep from './campaignBuilder/CampaignDetailsStep';
import SequenceBuilderStep from './campaignBuilder/SequenceBuilderStep';
import { View } from '../App';
import { Button, ShellCard } from './UiKit';

interface NewCampaignPageProps {
    setActiveView: (view: View) => void;
}

const STEP_LABELS = ['Campaign Details', 'Build Sequence', 'Select Leads', 'Review & Launch'];
const CAMPAIGN_EDITOR_SEED_KEY = 'hf_campaign_editor_seed_v1';
const CAMPAIGN_EDITOR_NOTICE_KEY = 'hf_campaign_editor_notice_v1';
const DEFAULT_CAMPAIGN_DATA: Partial<Campaign> & { sequences?: EmailSequence[] } = {
    campaign_name: '',
    campaign_goal: '',
    target_audience: '',
    status: CampaignStatus.DRAFT,
    campaign_type: CampaignType.COLD_OUTREACH,
    track_opens: true,
    track_clicks: true,
    auto_pause_on_reply: true,
    sequences: [],
};

const NewCampaignPage: React.FC<NewCampaignPageProps> = ({ setActiveView }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [mode, setMode] = useState<'draft' | 'active'>('draft');
    const [editorNotice, setEditorNotice] = useState<string | null>(null);
    const [campaignData, setCampaignData] = useState<Partial<Campaign> & { sequences?: EmailSequence[] }>(DEFAULT_CAMPAIGN_DATA);

    const updateCampaignData = (updates: Partial<Campaign>) => {
        setCampaignData(prev => ({ ...prev, ...updates }));
    };

    const updateSequences = (sequences: EmailSequence[]) => {
        setCampaignData(prev => ({ ...prev, sequences }));
    };

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

    const handleSaveDraft = () => {
        alert('Campaign saved as draft!');
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.localStorage.getItem(CAMPAIGN_EDITOR_SEED_KEY);
        const notice = window.localStorage.getItem(CAMPAIGN_EDITOR_NOTICE_KEY);
        if (notice) {
            setEditorNotice(notice);
            window.localStorage.removeItem(CAMPAIGN_EDITOR_NOTICE_KEY);
        }
        if (!raw) return;
        try {
            const seed = JSON.parse(raw) as Partial<Campaign> & { sequences?: EmailSequence[] };
            setCampaignData((prev) => ({
                ...prev,
                ...seed,
                sequences: Array.isArray(seed.sequences) ? seed.sequences : prev.sequences,
            }));
            if (seed.status === CampaignStatus.ACTIVE) {
                setMode('active');
            } else {
                setMode('draft');
            }
            setCurrentStep(1);
        } catch {
            // Ignore malformed payload and continue with defaults.
        } finally {
            window.localStorage.removeItem(CAMPAIGN_EDITOR_SEED_KEY);
        }
    }, []);

    useEffect(() => {
        if (!editorNotice) return;
        const id = window.setTimeout(() => setEditorNotice(null), 3200);
        return () => window.clearTimeout(id);
    }, [editorNotice]);

    useEffect(() => {
        setCampaignData((prev) => ({
            ...prev,
            status: mode === 'active' ? CampaignStatus.ACTIVE : CampaignStatus.DRAFT,
        }));
    }, [mode]);

    const stepSubtitle = useMemo(() => {
        switch (currentStep) {
            case 1:
                return 'Define campaign goal, audience, and tracking settings for Zimbabwe and SADC outreach.';
            case 2:
                return 'Build sequence steps, delays, and branch logic.';
            case 3:
                return 'Choose eligible leads and enrollment rules.';
            default:
                return 'Confirm all details before launch.';
        }
    }, [currentStep]);

    const renderStep = () => {
        switch(currentStep) {
            case 1:
                return <CampaignDetailsStep data={campaignData} updateData={updateCampaignData} />;
            case 2:
                return <SequenceBuilderStep sequences={campaignData.sequences || []} updateSequences={updateSequences} />;
            case 3:
                return (
                    <div className="max-w-3xl mx-auto space-y-4 text-slate-700">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <p className="text-base font-semibold mb-1">Lead enrollment setup</p>
                            <p className="text-sm text-slate-500">Filtered enrollment by source, stage, and corridor (Zimbabwe, Zambia, Botswana, Mozambique, South Africa) is next. Use <strong>Next Step</strong> below to continue.</p>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
                            <h3 className="text-lg font-bold text-slate-900">Campaign Summary</h3>
                            <ul className="text-sm text-slate-700 space-y-1">
                                <li><strong>Name:</strong> {campaignData.campaign_name || 'Untitled campaign'}</li>
                                <li><strong>Type:</strong> {campaignData.campaign_type}</li>
                                <li><strong>Sequence steps:</strong> {campaignData.sequences?.length || 0}</li>
                                <li><strong>Tracking:</strong> {campaignData.track_opens ? 'Opens' : '-'} / {campaignData.track_clicks ? 'Clicks' : '-'}</li>
                                <li><strong>Audience:</strong> {campaignData.target_audience || 'Not specified'}</li>
                                <li><strong>Timezone:</strong> Africa/Harare</li>
                            </ul>
                        </div>
                    </div>
                );
            default:
                return <div className="text-center text-slate-500 py-16">Step {currentStep} not implemented yet.</div>;
        }
    };

    return (
        <div className="space-y-4">
            <ShellCard className="p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{campaignData.campaign_name || 'New Campaign'}</h2>
                        <p className="mt-1 text-sm text-slate-500">{stepSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden rounded-full bg-slate-100 p-1 sm:flex">
                            <button
                                type="button"
                                onClick={() => setMode('draft')}
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${mode === 'draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                            >
                                Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('active')}
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${mode === 'active' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600'}`}
                            >
                                Active
                            </button>
                        </div>
                        <Button variant="ghost" onClick={handleSaveDraft}>Save Draft</Button>
                    </div>
                </div>
                {editorNotice ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                        {editorNotice}
                    </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STEP_LABELS.map((label, idx) => {
                        const stepNum = idx + 1;
                        const active = stepNum === currentStep;
                        const done = stepNum < currentStep;
                        return (
                            <div
                                key={label}
                                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${active ? 'border-orange-300 bg-orange-50 text-orange-700' : done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                {stepNum}. {label}
                            </div>
                        );
                    })}
                </div>
            </ShellCard>

            <ShellCard className="min-h-[420px] p-4">
                {renderStep()}
            </ShellCard>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
                <Button variant="ghost" onClick={handleBack}>{currentStep === 1 ? 'Back to Campaigns' : 'Back'}</Button>
                <div className="flex items-center gap-2">
                    <Button variant="primary" onClick={handleNext}>{currentStep === 4 ? 'Launch Campaign' : 'Next Step'}</Button>
                </div>
            </div>
        </div>
    );
};

export default NewCampaignPage;
