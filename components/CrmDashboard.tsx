
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { mockLeadScoringRules, mockSalesReps } from '../data/mockCrmData';
import SalesPipeline from './SalesPipeline';
import LeadList from './LeadList';
import LeadScoringRules from './LeadScoringRules';
import LeadDetailsModal from './LeadDetailsModal';
import OpportunityDetailsModal from './OpportunityDetailsModal';
import { Lead, LeadScoringRule, Opportunity, OpportunityStage } from '../types';
import AddLeadModal from './AddLeadModal';
import AddLeadScoringRuleModal from './AddLeadScoringRuleModal';
import { calculateLeadScore } from '../services/crmService';
import { BriefcaseIcon, CurrencyDollarIcon, UsersIcon } from './icons';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';

const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
  <div className="flex flex-col justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>
    </div>
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);


const CrmDashboard: React.FC = () => {
    const { leads, opportunities, leadActivities, opportunityActivities, addLead, deleteLead, updateLead, updateOpportunity, logAuditEvent } = useData();
    // Rules are still local for now as they weren't part of the initial global scope request
    const [rules, setRules] = useState<LeadScoringRule[]>(mockLeadScoringRules);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);


    // Recalculate lead scores whenever the rules change.
    // NOTE: This updates local state which might desync with global if we pushed it back. 
    // For now we just display the calculated score locally or ideally update the global lead.
    useEffect(() => {
        // In a real app, we'd batch update these to the backend.
        // Here we won't spam the updateLead context to avoid infinite loops without careful diffing.
    }, [rules, leads]);


    const totalPipelineValue = opportunities.reduce((sum, opp) => {
        if (opp.stage !== 'closed_won' && opp.stage !== 'closed_lost') {
            return sum + opp.expected_value;
        }
        return sum;
    }, 0);

    const newLeadsCount = leads.filter(lead => lead.lead_status === 'new').length;

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
    };
    
    const handleOpportunityClick = (opportunity: Opportunity) => {
        setSelectedOpportunity(opportunity);
    };

    const handleStageChange = (opportunityId: number, newStage: OpportunityStage) => {
        const opportunity = opportunities.find(opp => opp.id === opportunityId);
        if (opportunity) {
            updateOpportunity({ ...opportunity, stage: newStage });
        }
    };

    const handleCloseModal = () => {
        setSelectedLead(null);
        setSelectedOpportunity(null);
    };

    const leadColumns = [
        { key: 'first_name', header: 'First Name' },
        { key: 'last_name', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'company_name', header: 'Company' },
        { key: 'city', header: 'City' },
        { key: 'country', header: 'Country' },
        { key: 'lead_status', header: 'Status' },
        { key: 'lead_source', header: 'Source' },
        { key: 'lead_score', header: 'Score' },
    ];

    const leadXlsxColumns = leadColumns.map((c) => ({ title: c.header, key: c.key, width: 18 }));

    const handleExportCsv = () => downloadCsv(leads, leadColumns as any, 'leads');
    const handleExportXlsx = () => downloadXlsx(leads, leadXlsxColumns as any, 'leads');

    const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => {
        const newLead: Lead = {
            ...newLeadData,
            id: Date.now(),
            lead_score: calculateLeadScore(newLeadData, rules),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addLead(newLead);
        setIsAddLeadModalOpen(false);
    };
    
    const handleDeleteLead = (id: number) => {
        deleteLead(id);
        if (selectedLead?.id === id) {
            setSelectedLead(null);
        }
    };
    
    const handleImportLeads = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
        let success = 0;
        let failed = 0;
        rows.forEach((row, index) => {
            try {
                const payload: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'> = {
                    first_name: row.first_name || '',
                    last_name: row.last_name || '',
                    email: row.email || '',
                    phone: row.phone || '',
                    company_name: row.company_name || row.company || '',
                    city: row.city || '',
                    country: row.country || '',
                    lead_status: row.lead_status || 'new',
                    lead_source: row.lead_source || 'other',
                    lead_score: 0 as any,
                    assigned_to: row.assigned_to ? Number(row.assigned_to) : undefined,
                    industry: row.industry,
                    position: row.position,
                    website: row.website,
                };
                const newLead: Lead = {
                    ...payload,
                    id: Date.now() + index,
                    lead_score: calculateLeadScore(payload, rules),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                addLead(newLead);
                success += 1;
            } catch {
                failed += 1;
            }
        });
        logAuditEvent({
            action: 'data.import',
            entity: { type: 'lead' },
            meta: { imported: success, failed: failed || meta.failed, source: 'leads.import' },
        });
        setIsImportModalOpen(false);
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
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
                    <p className="text-xs text-slate-500">Manage and sync your lead records.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                    >
                        Import
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={handleExportXlsx}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                    >
                        Export XLSX
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Total Pipeline Value" 
                    value={`$${new Intl.NumberFormat().format(totalPipelineValue)}`}
                    icon={<CurrencyDollarIcon className="w-5 h-5" />}
                />
                <StatCard 
                    label="New Leads" 
                    value={newLeadsCount}
                    icon={<BriefcaseIcon className="w-5 h-5" />}
                />
                <StatCard 
                    label="Opportunities" 
                    value={opportunities.length}
                    icon={<UsersIcon className="w-5 h-5" />}
                />
            </div>
            <SalesPipeline
                opportunities={opportunities}
                onOpportunityClick={handleOpportunityClick}
                onStageChange={handleStageChange}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LeadList 
                  leads={leads} 
                  onSelectLead={handleSelectLead} 
                  onAddLeadClick={() => setIsAddLeadModalOpen(true)}
                  onImportClick={() => setIsImportModalOpen(true)}
                  onDeleteLead={handleDeleteLead}
                />
                <LeadScoringRules rules={rules} onAddRuleClick={() => setIsAddRuleModalOpen(true)} />
            </div>
            {selectedLead && (
                <LeadDetailsModal 
                    lead={selectedLead} 
                    salesReps={mockSalesReps}
                    leadActivities={leadActivities}
                    onClose={handleCloseModal} 
                />
            )}
            {selectedOpportunity && (
                <OpportunityDetailsModal
                    opportunity={selectedOpportunity}
                    leads={leads}
                    salesReps={mockSalesReps}
                    opportunityActivities={opportunityActivities}
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
        {isImportModalOpen && (
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import leads"
                description="Upload a CSV with lead columns, map them, and import."
                targetFields={[
                    { key: 'first_name', label: 'First Name', required: true },
                    { key: 'last_name', label: 'Last Name', required: true },
                    { key: 'email', label: 'Email', required: true },
                    { key: 'phone', label: 'Phone' },
                    { key: 'company_name', label: 'Company', required: true },
                    { key: 'lead_status', label: 'Status' },
                    { key: 'lead_source', label: 'Source' },
                    { key: 'city', label: 'City' },
                    { key: 'country', label: 'Country' },
                ]}
                onImport={handleImportLeads}
            />
        )}
    </>
  );
};

export default CrmDashboard;
