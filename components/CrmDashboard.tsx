
import React, { useState, useEffect } from 'react';
import { mockLeads, mockOpportunities, mockLeadScoringRules, mockSalesReps, mockLeadActivities } from '../data/mockCrmData';
import SalesPipeline from './SalesPipeline';
import LeadList from './LeadList';
import LeadScoringRules from './LeadScoringRules';
import LeadDetailsModal from './LeadDetailsModal';
import { Lead, LeadScoringRule } from '../types';
import AddLeadModal from './AddLeadModal';
import AddLeadScoringRuleModal from './AddLeadScoringRuleModal';
import { calculateLeadScore } from '../services/crmService';

const CrmDashboard: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>(mockLeads);
    const [rules, setRules] = useState<LeadScoringRule[]>(mockLeadScoringRules);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

    // Recalculate lead scores whenever the rules change.
    useEffect(() => {
        setLeads(prevLeads => 
            prevLeads.map(lead => ({
                ...lead,
                lead_score: calculateLeadScore(lead, rules)
            }))
        );
    }, [rules]);


    const totalPipelineValue = mockOpportunities.reduce((sum, opp) => {
        if (opp.stage !== 'closed_won' && opp.stage !== 'closed_lost') {
            return sum + opp.expected_value;
        }
        return sum;
    }, 0);

    const newLeadsCount = leads.filter(lead => lead.lead_status === 'new').length;

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
    };

    const handleCloseModal = () => {
        setSelectedLead(null);
    };

    const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => {
        const newLead: Lead = {
            ...newLeadData,
            id: Date.now(),
            lead_score: calculateLeadScore(newLeadData, rules),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setLeads(prev => [newLead, ...prev]);
        setIsAddLeadModalOpen(false);
    };

    const handleAddRule = (newRuleData: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>) => {
        const newRule: LeadScoringRule = {
            ...newRuleData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setRules(prev => [...prev, newRule]);
        setIsAddRuleModalOpen(false);
    };

  return (
    <>
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
                <LeadList leads={leads} onSelectLead={handleSelectLead} onAddLeadClick={() => setIsAddLeadModalOpen(true)} />
                <LeadScoringRules rules={rules} onAddRuleClick={() => setIsAddRuleModalOpen(true)} />
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
        {isAddLeadModalOpen && (
            <AddLeadModal
                onClose={() => setIsAddLeadModalOpen(false)}
                onAddLead={handleAddLead}
            />
        )}
        {isAddRuleModalOpen && (
            <AddLeadScoringRuleModal
                onClose={() => setIsAddRuleModalOpen(false)}
                onAddRule={handleAddRule}
            />
        )}
    </>
  );
};

export default CrmDashboard;