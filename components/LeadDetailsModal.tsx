import React from 'react';
import { Lead, User } from '../types';
import { CloseIcon, BriefcaseIcon, UserCircleIcon, InfoIcon, DocumentTextIcon } from './icons/Icons';

interface LeadDetailsModalProps {
  lead: Lead;
  salesReps: User[];
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


const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, salesReps, onClose }) => {
    const assignedRep = salesReps.find(rep => rep.id === lead.assigned_to);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon className="w-6 h-6 text-gray-600"/>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto space-y-8">
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
                </main>
            </div>
        </div>
    );
};

export default LeadDetailsModal;