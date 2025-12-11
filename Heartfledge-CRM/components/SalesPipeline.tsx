import React from 'react';
import { Opportunity, OpportunityStage } from '../types';
import { ShellCard, SectionHeader } from './UiKit';

interface SalesPipelineProps {
  opportunities: Opportunity[];
  onOpportunityClick: (opportunity: Opportunity) => void;
}

const stageColors: { [key in OpportunityStage]: string } = {
  [OpportunityStage.PROSPECTING]: 'border-t-slate-400',
  [OpportunityStage.QUALIFICATION]: 'border-t-sky-500',
  [OpportunityStage.PROPOSAL]: 'border-t-purple-500',
  [OpportunityStage.NEGOTIATION]: 'border-t-amber-500',
  [OpportunityStage.CLOSED_WON]: 'border-t-emerald-500',
  [OpportunityStage.CLOSED_LOST]: 'border-t-rose-500',
};

const OpportunityCard: React.FC<{ opp: Opportunity; onClick: (opp: Opportunity) => void }> = ({ opp, onClick }) => (
    <div 
        className="bg-white p-3 rounded-lg shadow-sm ring-1 ring-slate-100 mb-3 cursor-pointer hover:shadow-md hover:ring-1 hover:ring-orange-400 transition"
        onClick={() => onClick(opp)}
    >
        <p className="font-semibold text-sm text-slate-900">{opp.opportunity_name}</p>
        <p className="text-xs text-slate-500">{opp.lead_id ? `Lead ID: ${opp.lead_id}` : `Customer ID: ${opp.customer_id}`}</p>
        <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-semibold text-emerald-600">{new Intl.NumberFormat(undefined, { style: 'currency', currency: opp.currency }).format(opp.expected_value)}</span>
            <span className="text-xs text-slate-400">{opp.probability}%</span>
        </div>
    </div>
);

const PipelineColumn: React.FC<{ title: string; opportunities: Opportunity[]; stage: OpportunityStage; onOpportunityClick: (opportunity: Opportunity) => void; }> = ({ title, opportunities, stage, onOpportunityClick }) => (
    <div className="flex-1 min-w-[280px]">
        <h3 className={`text-sm font-semibold mb-3 pb-2 text-slate-800 border-b-2 border-slate-200 ${stageColors[stage]} border-t-4 pt-2`}>{title} ({opportunities.length})</h3>
        <div className="bg-slate-50/70 p-2 rounded-lg h-[400px] overflow-y-auto ring-1 ring-slate-100">
            {opportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} onClick={onOpportunityClick} />)}
        </div>
    </div>
);

const SalesPipeline: React.FC<SalesPipelineProps> = ({ opportunities, onOpportunityClick }) => {
  const stages = Object.values(OpportunityStage);

  const opportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  return (
    <ShellCard className="p-4">
      <SectionHeader title="Sales Pipeline" subtitle="Track opportunities from prospecting to close" />
      <div className="mt-2 flex space-x-4 overflow-x-auto pb-4">
        {stages.map(stage => (
            <PipelineColumn
                key={stage}
                title={stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                opportunities={opportunitiesByStage(stage)}
                stage={stage}
                onOpportunityClick={onOpportunityClick}
            />
        ))}
      </div>
    </ShellCard>
  );
};

export default SalesPipeline;