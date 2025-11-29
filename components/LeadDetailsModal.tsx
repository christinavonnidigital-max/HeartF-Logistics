
import React, { useState } from 'react';
import { Lead, User, LeadActivity, LeadActivityType } from '../types';
import { CloseIcon, BriefcaseIcon, UserCircleIcon, InfoIcon, DocumentTextIcon, PhoneIcon, EnvelopeIcon, CalendarDaysIcon, PencilSquareIcon } from './icons/Icons';

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
        <span className="text-gray-900 col-span-2 break-words">{value || 'N/A'}</span>
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
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const assignedRep = salesReps.find(rep => rep.id === lead.assigned_to);
    const activitiesForLead = leadActivities.filter(act => act.lead_id === lead.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
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
                                <DetailItem label="Notes" value={lead.notes} />
                            </DetailSection>
                        </div>
                    )}
                    {activeTab === 'activity' && (
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
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default LeadDetailsModal;
