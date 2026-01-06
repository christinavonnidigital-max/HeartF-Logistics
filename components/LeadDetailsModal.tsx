
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, User, LeadActivity, LeadActivityType } from '../types';
import { CloseIcon, BriefcaseIcon, UserCircleIcon, InfoIcon, DocumentTextIcon, PhoneIcon, EnvelopeIcon, CalendarDaysIcon, PencilSquareIcon } from './icons';
import { Button, Input, Label, Select } from './UiKit';
import { useData } from '../contexts/DataContext';

interface LeadDetailsModalProps {
  lead: Lead;
  salesReps: User[];
  leadActivities: LeadActivity[];
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
        <span className="text-gray-500 col-span-1">{label}</span>
        <span className="text-gray-900 col-span-2 wrap-break-word">{value || 'N/A'}</span>
    </div>
);

const activityIcons: { [key in LeadActivityType]: React.ReactNode } = {
    [LeadActivityType.CALL]: <PhoneIcon className="w-5 h-5" />,
    [LeadActivityType.EMAIL]: <EnvelopeIcon className="w-5 h-5" />,
    [LeadActivityType.MEETING]: <CalendarDaysIcon className="w-5 h-5" />,
    [LeadActivityType.NOTE]: <PencilSquareIcon className="w-5 h-5" />,
    [LeadActivityType.PROPOSAL_SENT]: <DocumentTextIcon className="w-5 h-5" />,
    [LeadActivityType.QUOTE_SENT]: <DocumentTextIcon className="w-5 h-5" />,
    [LeadActivityType.STATUS_CHANGE]: <InfoIcon className="w-5 h-5" />,
    [LeadActivityType.CAMPAIGN_EMAIL]: <EnvelopeIcon className="w-5 h-5" />,
};

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, salesReps, leadActivities, onClose }) => {
    const { addLeadActivity, updateLead } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [activityType, setActivityType] = useState<LeadActivityType>(LeadActivityType.NOTE);
    const [activitySubject, setActivitySubject] = useState('');
    const [activityDescription, setActivityDescription] = useState('');
    const [nextAction, setNextAction] = useState(lead.next_action || '');
    const [nextActionDate, setNextActionDate] = useState(lead.next_action_date || '');
    const assignedRep = salesReps.find(rep => rep.id === lead.assigned_to);
    const activitiesForLead = useMemo(
        () => leadActivities.filter(act => act.lead_id === lead.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [leadActivities, lead.id]
    );

    useEffect(() => {
        setNextAction(lead.next_action || '');
        setNextActionDate(lead.next_action_date || '');
    }, [lead.id, lead.next_action, lead.next_action_date]);

    const handleAddActivity = () => {
        if (!activitySubject.trim() && !activityDescription.trim()) return;
        addLeadActivity({
            lead_id: lead.id,
            activity_type: activityType,
            subject: activitySubject.trim() || 'Activity update',
            description: activityDescription.trim() || '',
            next_action: nextAction.trim() || undefined,
            next_action_date: nextActionDate || undefined,
            performed_by: lead.assigned_to ?? 0,
        });
        updateLead({
            ...lead,
            next_action: nextAction.trim() || undefined,
            next_action_date: nextActionDate || undefined,
        });
        setActivitySubject('');
        setActivityDescription('');
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h2>
                        <button onClick={onClose} aria-label="Close lead details" title="Close" className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon className="w-6 h-6 text-gray-600"/>
                    </button>
                </header>

                <nav className="border-b border-gray-200">
                    <div className="px-6 flex space-x-6">
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`py-3 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Details
                        </button>
                         <button 
                            onClick={() => setActiveTab('activity')}
                            className={`py-3 text-sm font-medium border-b-2 ${activeTab === 'activity' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Activity History
                        </button>
                    </div>
                </nav>

                <main className="p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'details' && (
                        <div className="space-y-8">
                            <DetailSection title="Contact Information" icon={<UserCircleIcon className="w-5 h-5" />}>
                                <DetailItem label="Full Name" value={`${lead.first_name} ${lead.last_name}`} />
                                <DetailItem label="Email" value={lead.email} />
                                <DetailItem label="Phone" value={lead.phone} />
                                <DetailItem label="Address" value={`${lead.address}, ${lead.city}, ${lead.country}`} />
                            </DetailSection>
                            
                            <DetailSection title="Company Details" icon={<BriefcaseIcon className="w-5 h-5" />}>
                                <DetailItem label="Company Name" value={lead.company_name} />
                                <DetailItem label="Position" value={lead.position} />
                                <DetailItem label="Industry" value={lead.industry} />
                                <DetailItem label="Company Size" value={lead.company_size} />
                                <DetailItem label="Website" value={lead.website} />
                            </DetailSection>

                            <DetailSection title="Logistics Needs" icon={<DocumentTextIcon className="w-5 h-5" />}>
                            <DetailItem label="Needs" value={lead.logistics_needs} />
                            <DetailItem label="Current Provider" value={lead.current_provider} />
                            <DetailItem label="Shipment Volume" value={lead.monthly_shipment_volume ? `${lead.monthly_shipment_volume}/month` : 'N/A'} />
                            <DetailItem label="Preferred Routes" value={lead.preferred_routes} />
                            </DetailSection>

                            <DetailSection title="Internal Info" icon={<InfoIcon className="w-5 h-5" />}>
                                <DetailItem label="Lead Status" value={lead.lead_status} />
                                <DetailItem label="Lead Source" value={lead.lead_source} />
                                <DetailItem label="Lead Score" value={lead.lead_score} />
                                <DetailItem label="Assigned To" value={assignedRep ? `${assignedRep.first_name} ${assignedRep.last_name}` : 'Unassigned'} />
                                <DetailItem label="Next Action" value={lead.next_action || 'Not set'} />
                                <DetailItem label="Next Action Date" value={lead.next_action_date ? new Date(lead.next_action_date).toLocaleDateString() : 'Not set'} />
                                <DetailItem label="Notes" value={lead.notes} />
                            </DetailSection>
                        </div>
                    )}
                    {activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <h3 className="text-sm font-semibold text-gray-800">Log activity</h3>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Activity type</Label>
                                        <Select value={activityType} onChange={(e) => setActivityType(e.target.value as LeadActivityType)}>
                                            {Object.values(LeadActivityType).map((type) => (
                                                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Subject</Label>
                                        <Input value={activitySubject} onChange={(e) => setActivitySubject(e.target.value)} />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label>Description</Label>
                                        <Input value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Next action</Label>
                                        <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Next action date</Label>
                                        <Input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button variant="secondary" size="sm" onClick={handleAddActivity}>
                                        Log activity
                                    </Button>
                                </div>
                            </div>

                            <div className="flow-root">
                                <ul role="list" className="-mb-8">
                                    {activitiesForLead.map((activity, activityIdx) => {
                                        const performer = salesReps.find(rep => rep.id === activity.performed_by);
                                        return (
                                        <li key={activity.id}>
                                            <div className="relative pb-8">
                                            {activityIdx !== activitiesForLead.length - 1 ? (
                                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white text-gray-500">
                                                        {activityIcons[activity.activity_type]}
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">{activity.subject}</span> by {performer ? `${performer.first_name} ${performer.last_name}` : 'System'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                                                    {activity.next_action ? (
                                                        <p className="mt-1 text-xs text-gray-500">Next: {activity.next_action}</p>
                                                    ) : null}
                                                </div>
                                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                    <time dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleDateString()}</time>
                                                </div>
                                                </div>
                                            </div>
                                            </div>
                                        </li>
                                        )
                                    })}
                                </ul>
                                {!activitiesForLead.length ? (
                                    <p className="text-sm text-gray-500">No activity logged yet.</p>
                                ) : null}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default LeadDetailsModal;
