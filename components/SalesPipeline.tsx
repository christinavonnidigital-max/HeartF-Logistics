import React, { useState } from 'react';
import { Opportunity, OpportunityStage } from '../types';
import { ShellCard, SectionHeader } from './UiKit';

interface SalesPipelineProps {
  opportunities: Opportunity[];
  onOpportunityClick: (opportunity: Opportunity) => void;
  onStageChange?: (opportunityId: number, newStage: OpportunityStage) => void;
}

const stageColors: { [key in OpportunityStage]: string } = {
  [OpportunityStage.PROSPECTING]: 'border-t-slate-400',
  [OpportunityStage.QUALIFICATION]: 'border-t-sky-500',
  [OpportunityStage.PROPOSAL]: 'border-t-purple-500',
  [OpportunityStage.NEGOTIATION]: 'border-t-amber-500',
  [OpportunityStage.CLOSED_WON]: 'border-t-emerald-500',
  [OpportunityStage.CLOSED_LOST]: 'border-t-rose-500',
};

const OpportunityCard: React.FC<{
    opp: Opportunity;
    onClick: (opp: Opportunity) => void;
    onDragStart: (id: number) => void;
}> = ({ opp, onClick, onDragStart }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(opp.id);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-100 mb-4 cursor-move hover:shadow-md hover:ring-2 hover:ring-orange-400 transition-all active:opacity-50"
            onClick={() => onClick(opp)}
        >
            <p className="font-semibold text-sm text-slate-900 mb-2">{opp.opportunity_name}</p>
            <p className="text-xs text-slate-500 mb-3">{opp.lead_id ? `Lead ID: ${opp.lead_id}` : `Customer ID: ${opp.customer_id}`}</p>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-sm font-semibold text-emerald-600">{new Intl.NumberFormat(undefined, { style: 'currency', currency: opp.currency }).format(opp.expected_value)}</span>
                <span className="text-xs text-slate-400 font-medium">{opp.probability}%</span>
            </div>
        </div>
    );
};

const PipelineColumn: React.FC<{
    title: string;
    opportunities: Opportunity[];
    stage: OpportunityStage;
    onOpportunityClick: (opportunity: Opportunity) => void;
    onDrop: (stage: OpportunityStage) => void;
    onDragStart: (id: number) => void;
}> = ({ title, opportunities, stage, onOpportunityClick, onDrop, onDragStart }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(stage);
    };

    return (
        <div className="flex-1 min-w-[300px]">
            <h3 className={`text-sm font-bold mb-4 pb-3 text-slate-800 border-b-2 border-slate-200 ${stageColors[stage]} border-t-4 pt-3 uppercase tracking-wider`}>
                {title} <span className="text-slate-400 font-normal">({opportunities.length})</span>
            </h3>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bg-slate-50/70 p-3 rounded-xl h-[450px] overflow-y-auto ring-1 transition-all ${
                    isDragOver ? 'ring-2 ring-orange-400 bg-orange-50/30' : 'ring-slate-100'
                }`}
            >
                {opportunities.map(opp => (
                    <OpportunityCard
                        key={opp.id}
                        opp={opp}
                        onClick={onOpportunityClick}
                        onDragStart={onDragStart}
                    />
                ))}
                {opportunities.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Drop cards here
                    </div>
                )}
            </div>
        </div>
    );
};

const SalesPipeline: React.FC<SalesPipelineProps> = ({ opportunities, onOpportunityClick, onStageChange }) => {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const stages = Object.values(OpportunityStage);

  const opportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const handleDragStart = (opportunityId: number) => {
    setDraggedId(opportunityId);
  };

  const handleDrop = (newStage: OpportunityStage) => {
    if (draggedId && onStageChange) {
      onStageChange(draggedId, newStage);
      setDraggedId(null);
    }
  };

  return (
    <ShellCard className="p-6">
      <SectionHeader title="Sales Pipeline" subtitle="Drag cards between stages to update their status" />
      <div className="mt-6 flex space-x-6 overflow-x-auto pb-4">
        {stages.map(stage => (
            <PipelineColumn
                key={stage}
                title={stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                opportunities={opportunitiesByStage(stage)}
                stage={stage}
                onOpportunityClick={onOpportunityClick}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
            />
        ))}
      </div>
    </ShellCard>
  );
};

export default SalesPipeline;
