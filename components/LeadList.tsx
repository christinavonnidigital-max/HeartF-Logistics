
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { PlusIcon, UploadIcon, TrashIcon, SearchIcon } from './icons/Icons';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';
import ConfirmModal from './ConfirmModal';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onAddLeadClick: () => void;
  onImportClick: () => void;
  onDeleteLead: (id: number) => void;
}

const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead, onAddLeadClick, onImportClick, onDeleteLead }) => {
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const sortedLeads = useMemo(() => {
      return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return sortedLeads;
    const lowerTerm = searchTerm.toLowerCase();
    return sortedLeads.filter(lead => {
        const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
        const company = (lead.company_name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        return fullName.includes(lowerTerm) || company.includes(lowerTerm) || email.includes(lowerTerm);
    });
  }, [sortedLeads, searchTerm]);

  const confirmDelete = () => {
    if (leadToDelete !== null) {
      onDeleteLead(leadToDelete);
      setLeadToDelete(null);
    }
  };

  return (
    <>
    <ShellCard className="flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <SectionHeader
          title="Leads"
          subtitle="Pipeline of people and companies you are speaking to"
          actions={
            <>
              <button
                onClick={onImportClick}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button
                className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                onClick={onAddLeadClick}
                aria-label="Add new lead"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </>
          }
        />
        <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 min-h-[400px]">
        {filteredLeads.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => {
              const name = `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || lead.company_name;
              const status = lead.lead_status?.replace("_", " ") || "";

              return (
                <div
                  key={lead.id}
                  className="group flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 rounded-xl transition"
                >
                  <button 
                    type="button"
                    onClick={() => onSelectLead?.(lead)}
                    className="flex-1 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-500 truncate">{lead.company_name}</p>
                    </div>
                    {status && (
                      <StatusPill label={status} tone="info" />
                    )}
                  </button>
                   <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Lead"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-16 text-center text-sm text-slate-500">
            {searchTerm ? `No leads found matching "${searchTerm}"` : 'No leads found.'}
          </div>
        )}
      </div>
    </ShellCard>

    <ConfirmModal 
        isOpen={leadToDelete !== null}
        onClose={() => setLeadToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete Lead"
    />
    </>
  );
};

export default LeadList;
