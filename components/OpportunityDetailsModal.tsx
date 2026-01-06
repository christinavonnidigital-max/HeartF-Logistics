
import React, { useState, useEffect } from 'react';
import { Opportunity, Lead, User, OpportunityStage, OpportunityActivity, OpportunityActivityType } from '../types';
import { CloseIcon, BriefcaseIcon, UserCircleIcon, InfoIcon, DocumentTextIcon, ClockIcon } from './icons';
import { Button, Input, Label, Select } from './UiKit';
import { useData } from '../contexts/DataContext';

interface OpportunityDetailsModalProps {
  opportunity: Opportunity;
  leads: Lead[];
  salesReps: User[];
  opportunityActivities: OpportunityActivity[];
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
  <div>
    <h3 className="text-base font-semibold mb-2 flex items-center text-gray-800">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-lg border">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={`grid grid-cols-3 gap-2 py-1.5 ${className}`}>
    <span className="text-gray-500 col-span-1">{label}</span>
    <span className="text-gray-900 col-span-2 wrap-break-word">{value || 'N/A'}</span>
  </div>
);

const getStagePill = (stage: OpportunityStage) => {
    const styles: { [key in OpportunityStage]: string } = {
        [OpportunityStage.PROSPECTING]: 'bg-gray-100 text-gray-800',
        [OpportunityStage.QUALIFICATION]: 'bg-blue-100 text-blue-800',
        [OpportunityStage.PROPOSAL]: 'bg-purple-100 text-purple-800',
        [OpportunityStage.NEGOTIATION]: 'bg-yellow-100 text-yellow-800',
        [OpportunityStage.CLOSED_WON]: 'bg-green-100 text-green-800',
        [OpportunityStage.CLOSED_LOST]: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[stage]}`}>
            {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    );
};

const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({ opportunity, leads, salesReps, opportunityActivities, onClose }) => {
    const { addOpportunityActivity, updateOpportunity } = useData();
    const [activityType, setActivityType] = useState<OpportunityActivityType>(OpportunityActivityType.NOTE);
    const [activityDescription, setActivityDescription] = useState('');
    const [nextActionDate, setNextActionDate] = useState(opportunity.next_action_date || '');
    
    const lead = leads.find(l => l.id === opportunity.lead_id);
    const salesRep = salesReps.find(rep => rep.id === opportunity.assigned_to);
    const activitiesForOpp = opportunityActivities
        .filter((act) => act.opportunity_id === opportunity.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
        document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        setNextActionDate(opportunity.next_action_date || '');
    }, [opportunity.next_action_date, opportunity.id]);

    const handleAddActivity = () => {
        if (!activityDescription.trim()) return;
        addOpportunityActivity({
            opportunity_id: opportunity.id,
            activity_type: activityType,
            description: activityDescription.trim(),
            performed_by: opportunity.assigned_to,
        });
        if (nextActionDate && nextActionDate !== opportunity.next_action_date) {
            updateOpportunity({ ...opportunity, next_action_date: nextActionDate });
        }
        setActivityDescription('');
    };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-60 flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{opportunity.opportunity_name}</h2>
            <div className="mt-1">{getStagePill(opportunity.stage)}</div>
          </div>
            <button onClick={onClose} aria-label="Close" title="Close" className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">
            <DetailSection title="Deal Overview" icon={<InfoIcon className="w-5 h-5" />}>
              <DetailItem label="Expected Value" value={<span className="font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: opportunity.currency }).format(opportunity.expected_value)}</span>} />
              <DetailItem label="Probability" value={`${opportunity.probability}%`} />
              <DetailItem label="Close Date" value={new Date(opportunity.expected_close_date + 'T00:00:00').toLocaleDateString()} />
            </DetailSection>

            <DetailSection title="Details" icon={<DocumentTextIcon className="w-5 h-5" />}>
                <DetailItem label="Description" value={opportunity.description} className="grid-cols-1"/>
                <DetailItem label="Next Step" value={<span className="font-semibold text-orange-700">{opportunity.next_step}</span>} className="grid-cols-1"/>
                <DetailItem
                    label="Next Action Date"
                    value={opportunity.next_action_date ? new Date(opportunity.next_action_date).toLocaleDateString() : 'Not set'}
                    className="grid-cols-1"
                />
            </DetailSection>

            {lead && (
                <DetailSection title="Associated Lead" icon={<BriefcaseIcon className="w-5 h-5" />}>
                    <DetailItem label="Name" value={`${lead.first_name} ${lead.last_name}`} />
                    <DetailItem label="Company" value={lead.company_name} />
                    <DetailItem label="Email" value={<a href={`mailto:${lead.email}`} className="text-orange-600 hover:underline">{lead.email}</a>} />
                    <DetailItem label="Phone" value={<a href={`tel:${lead.phone}`} className="text-orange-600 hover:underline">{lead.phone}</a>} />
                </DetailSection>
            )}
            
            {salesRep && (
                <DetailSection title="Sales Rep" icon={<UserCircleIcon className="w-5 h-5" />}>
                     <DetailItem label="Name" value={`${salesRep.first_name} ${salesRep.last_name}`} />
                     <DetailItem label="Email" value={<a href={`mailto:${salesRep.email}`} className="text-orange-600 hover:underline">{salesRep.email}</a>} />
                </DetailSection>
            )}

            <DetailSection title="Activity Log" icon={<ClockIcon className="w-5 h-5" />}>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Activity type</Label>
                            <Select value={activityType} onChange={(e) => setActivityType(e.target.value as OpportunityActivityType)}>
                                {Object.values(OpportunityActivityType).map((type) => (
                                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Next action date</Label>
                            <Input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Description</Label>
                        <Input value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} placeholder="Add a quick update..." />
                    </div>
                    <div className="flex justify-end">
                        <Button variant="secondary" size="sm" onClick={handleAddActivity}>
                            Log activity
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {activitiesForOpp.length ? (
                            activitiesForOpp.map((act) => (
                                <div key={act.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="uppercase tracking-wide">{act.activity_type.replace(/_/g, ' ')}</span>
                                        <span>{new Date(act.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-1 text-gray-800">{act.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No activity logged yet.</p>
                        )}
                    </div>
                </div>
            </DetailSection>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default OpportunityDetailsModal;
