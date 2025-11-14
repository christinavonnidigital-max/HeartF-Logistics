import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import { PlusIcon, SearchIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const getStatusPill = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.NEW:
      return { icon: <PlusIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-indigo-100 text-indigo-800' };
    case LeadStatus.QUALIFIED:
      return { icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" />, classes: 'bg-green-100 text-green-800' };
    // FIX: Corrected typo from `Lead-Status` to `LeadStatus`.
    case LeadStatus.CONTACTED:
      return { icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>, classes: 'bg-yellow-100 text-yellow-800' };
    case LeadStatus.PROPOSAL_SENT:
        return { icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6v12a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 112 0v9a4 4 0 01-4 4H8a4 4 0 01-4-4V4z" clipRule="evenodd" /></svg>, classes: 'bg-purple-100 text-purple-800' };
    case LeadStatus.WON:
        return { icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>, classes: 'bg-teal-100 text-teal-800' };
    case LeadStatus.LOST:
        return { icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>, classes: 'bg-red-100 text-red-800' };
    default:
      return { icon: null, classes: 'bg-gray-100 text-gray-800' };
  }
};


const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead }) => {
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
              onClick={() => alert('Add Lead form would open here.')}
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => {
                const statusInfo = getStatusPill(lead.lead_status);
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.classes}`}>
                        {statusInfo.icon}
                        {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
            })
            ) : (
                <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500">
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