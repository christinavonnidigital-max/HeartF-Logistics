import React from 'react';
import { LeadScoringRule } from '../types';
import { PlusIcon } from './icons/Icons';
import { ShellCard, SectionHeader } from './UiKit';

interface LeadScoringRulesProps {
  rules: LeadScoringRule[];
  onAddRuleClick: () => void;
}

const ConditionDisplay: React.FC<{ condition: Record<string, any> }> = ({ condition }) => {
    const { field, operator, value } = condition;
    if (!field || !operator || !value) {
        return <span className="text-slate-500">Invalid condition</span>;
    }
    return (
        <div className="flex items-center space-x-2">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{field}</span>
            <span className="text-slate-500">{operator.replace('_', ' ')}</span>
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{value}</span>
        </div>
    );
};

const LeadScoringRules: React.FC<LeadScoringRulesProps> = ({ rules, onAddRuleClick }) => {
  return (
    <ShellCard className="flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <SectionHeader 
            title="Lead Scoring Rules"
            subtitle="Automatically qualify leads based on their properties"
            actions={
                <button 
                    className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                    onClick={onAddRuleClick}
                    aria-label="Add new scoring rule"
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
            }
        />
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Rule Name</th>
              <th scope="col" className="px-4 py-2 font-medium">Condition</th>
              <th scope="col" className="px-4 py-2 font-medium text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                  {rule.rule_name}
                </td>
                <td className="px-4 py-3">
                    <ConditionDisplay condition={rule.condition} />
                </td>
                <td className={`px-4 py-3 font-bold text-right ${rule.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {rule.points > 0 ? `+${rule.points}` : rule.points}
                </td>
              </tr>
            ))}
             {rules.length === 0 && (
                <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                       No scoring rules defined.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </ShellCard>
  );
};

export default LeadScoringRules;