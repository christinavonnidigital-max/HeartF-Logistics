import React, { useState } from 'react';
import { mockLeads, mockOpportunities, mockLeadScoringRules, mockSalesReps, mockLeadActivities } from '../data/mockCrmData';
import SalesPipeline from './SalesPipeline';
import LeadList from './LeadList';
import LeadScoringRules from './LeadScoringRules';
import LeadDetailsModal from './LeadDetailsModal';
import { Lead } from '../types';

const CrmDashboard: React.FC = () => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const totalPipelineValue = mockOpportunities.reduce((sum, opp) => {
        if (opp.stage !== 'closed_won' && opp.stage !== 'closed_lost') {
            return sum + opp.expected_value;
        }
        return sum;
    }, 0);

    const newLeadsCount = mockLeads.filter(lead => lead.lead_status === 'new').length;

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
    };

    const handleCloseModal = () => {
        setSelectedLead(null);
    };

  return (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-gray-500 text-lg">Total Pipeline Value</h3>
                <p className="text-3xl font-bold text-gray-900">${totalPipelineValue.toLocaleString()}</p>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-gray-500 text-lg">New Leads</h3>
                <p className="text-3xl font-bold text-gray-900">{newLeadsCount}</p>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-gray-500 text-lg">Opportunities</h3>
                <p className="text-3xl font-bold text-gray-900">{mockOpportunities.length}</p>
            </div>
        </div>
        <SalesPipeline opportunities={mockOpportunities} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadList leads={mockLeads} onSelectLead={handleSelectLead} />
            <LeadScoringRules rules={mockLeadScoringRules} />
        </div>
        {selectedLead && (
            <LeadDetailsModal 
                lead={selectedLead} 
                salesReps={mockSalesReps}
                leadActivities={mockLeadActivities}
                onClose={handleCloseModal} 
            />
        )}
    </div>
  );
};

export default CrmDashboard;