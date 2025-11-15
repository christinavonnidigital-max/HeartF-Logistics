
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import { PlusIcon, SearchIcon, CheckCircleIcon, PhoneIcon, DocumentTextIcon, CloseIcon } from './icons/Icons';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onAddLeadClick: () => void;
}

const getStatusPill = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.NEW:
      return { icon: <PlusIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-indigo-100 text-indigo-800' };
    case LeadStatus.QUALIFIED:
      return { icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-green-100 text-green-800' };
    case LeadStatus.CONTACTED:
      return { icon: <PhoneIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-yellow-100 text-yellow-800' };
    case LeadStatus.PROPOSAL_SENT:
        return { icon: <DocumentTextIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-purple-100 text-purple-800' };
    case LeadStatus.WON:
        return { icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-teal-100 text-teal-800' };
    case LeadStatus.LOST:
        return { icon: <CloseIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-red-100 text-red-800' };
    default:
      return { icon: null, classes: 'bg-gray-100 text-gray-800' };
  }
};

const getScoreIndicatorStyles = (score: number) => {
  const percentage = Math.min(score, 100);
  let colorClass = 'bg-red-400';
  if (score > 70) {
    colorClass = 'bg-green-500';
  } else if (score >= 40) {
    colorClass = 'bg-yellow-400';
  }

  return {
    width: `${percentage}%`,
    colorClass,
  };
};


const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead, onAddLeadClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = useMemo(() => {
    if (!searchTerm) {
      return leads;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return leads.filter(lead =>
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(lowercasedFilter) ||
      lead.company_name.toLowerCase().includes(lowercasedFilter) ||
      lead.email.toLowerCase().includes(lowercasedFilter)
    );
  }, [leads, searchTerm]);


  return (
    <div className="bg-white rounded-xl shadow-md flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Leads</h2>
            <button 
              className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
              onClick={onAddLeadClick}
            >
              <PlusIcon className="w-5 h-5"/>
            </button>
        </div>
        <div className="relative">
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Company</th>
              <th scope="col" className="px-6 py-3">Score</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => {
                const statusInfo = getStatusPill(lead.lead_status);
                const scoreStyles = getScoreIndicatorStyles(lead.lead_score);
                return (
                  <tr 
                    key={lead.id} 
                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 whitespace-nowrap">{lead.first_name} {lead.last_name}</div>
                        <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">{lead.company_name}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <span className="text-gray-900 font-medium w-8 text-right pr-2">{lead.lead_score}</span>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`${scoreStyles.colorClass} h-2 rounded-full`}
                                    style={{ width: scoreStyles.width }}
                                ></div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.classes}`}>
                        {statusInfo.icon}
                        {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                )
            })
            ) : (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                       No leads found{searchTerm ? ` for "${searchTerm}"` : ''}.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadList;