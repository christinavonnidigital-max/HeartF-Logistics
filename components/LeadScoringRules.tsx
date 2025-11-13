import React from 'react';
import { LeadScoringRule } from '../types';
import { PlusIcon } from './icons/Icons';

interface LeadScoringRulesProps {
  rules: LeadScoringRule[];
}

const ConditionDisplay: React.FC<{ condition: Record<string, any> }> = ({ condition }) => {
    const { field, operator, value } = condition;
    if (!field || !operator || !value) {
        return <span className="text-gray-500">Invalid condition</span>;
    }
    return (
        <div className="flex items-center space-x-2">
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{field}</span>
            <span className="text-gray-500">{operator.replace('_', ' ')}</span>
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{value}</span>
        </div>
    );
};

const LeadScoringRules: React.FC<LeadScoringRulesProps> = ({ rules }) => {
  return (
    <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Lead Scoring Rules</h2>
        <button 
          className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={() => alert('Add Rule form would open here.')}
        >
          <PlusIcon className="w-5 h-5"/>
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Rule Name</th>
              <th scope="col" className="px-6 py-3">Condition</th>
              <th scope="col" className="px-6 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {rule.rule_name}
                </td>
                <td className="px-6 py-4">
                    <ConditionDisplay condition={rule.condition} />
                </td>
                <td className={`px-6 py-4 font-bold text-right ${rule.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {rule.points > 0 ? `+${rule.points}` : rule.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadScoringRules;