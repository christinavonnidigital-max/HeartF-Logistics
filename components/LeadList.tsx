import React from 'react';
import { Lead, LeadStatus } from '../types';
import { PlusIcon } from './icons/Icons';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const getStatusColor = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.NEW: return 'bg-blue-100 text-blue-800';
    case LeadStatus.QUALIFIED: return 'bg-green-100 text-green-800';
    case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-800';
    case LeadStatus.PROPOSAL_SENT: return 'bg-purple-100 text-purple-800';
    case LeadStatus.WON: return 'bg-teal-100 text-teal-800';
    case LeadStatus.LOST: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead }) => {
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Recent Leads</h2>
        <button 
          className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={() => alert('Add Lead form would open here.')}
        >
          <PlusIcon className="w-5 h-5"/>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Company</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Lead Score</th>
              <th scope="col" className="px-6 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectLead(lead)}
              >
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {lead.first_name} {lead.last_name}
                </td>
                <td className="px-6 py-4">{lead.company_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.lead_status)}`}>
                    {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">{lead.lead_score}</td>
                <td className="px-6 py-4">{lead.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadList;