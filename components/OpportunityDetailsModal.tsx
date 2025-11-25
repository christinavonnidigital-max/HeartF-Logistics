
import React, { useState, useEffect } from 'react';
import { Opportunity, Lead, User, OpportunityStage } from '../types';
import { CloseIcon, BriefcaseIcon, UserCircleIcon, InfoIcon, DocumentTextIcon, PhoneIcon, EnvelopeIcon, CalendarDaysIcon, ClockIcon, CurrencyDollarIcon } from './icons/Icons';

interface OpportunityDetailsModalProps {
  opportunity: Opportunity;
  leads: Lead[];
  salesReps: User[];
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
    <span className="text-gray-900 col-span-2 break-words">{value || 'N/A'}</span>
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

const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({ opportunity, leads, salesReps, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    
    const lead = leads.find(l => l.id === opportunity.lead_id);
    const salesRep = salesReps.find(rep => rep.id === opportunity.assigned_to);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for animation to finish
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-end md:justify-end"
      onClick={handleClose}
    >
      <div
        className={`bg-white shadow-2xl w-full md:max-w-md h-[90vh] md:h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-in-out ${isClosing ? 'translate-y-full md:translate-y-0 md:translate-x-full' : 'translate-y-0 md:translate-y-0 md:translate-x-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{opportunity.opportunity_name}</h2>
            <div className="mt-1">{getStagePill(opportunity.stage)}</div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <DetailSection title="Deal Overview" icon={<InfoIcon className="w-5 h-5" />}>
              <DetailItem label="Expected Value" value={<span className="font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: opportunity.currency }).format(opportunity.expected_value)}</span>} />
              <DetailItem label="Probability" value={`${opportunity.probability}%`} />
              <DetailItem label="Close Date" value={new Date(opportunity.expected_close_date + 'T00:00:00').toLocaleDateString()} />
            </DetailSection>

            <DetailSection title="Details" icon={<DocumentTextIcon className="w-5 h-5" />}>
                <DetailItem label="Description" value={opportunity.description} className="grid-cols-1"/>
                <DetailItem label="Next Step" value={<span className="font-semibold text-orange-700">{opportunity.next_step}</span>} className="grid-cols-1"/>
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
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default OpportunityDetailsModal;
