import React, { useState } from 'react';
import { EmailSequence } from '../../types';
import { ClockIcon, PlusIcon, SearchIcon } from '../icons/Icons';
import EmailComposer from './EmailComposer';
import SequenceStep from './SequenceStep';
import { Button, ShellCard } from '../UiKit';

interface SequenceBuilderStepProps {
  sequences: EmailSequence[];
  updateSequences: (sequences: EmailSequence[]) => void;
}

const SequenceBuilderStep: React.FC<SequenceBuilderStepProps> = ({ sequences, updateSequences }) => {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);

  const handleAddStep = (
    newStep: Omit<
      EmailSequence,
      | 'id'
      | 'campaign_id'
      | 'step_number'
      | 'emails_sent'
      | 'emails_opened'
      | 'emails_clicked'
      | 'created_at'
      | 'updated_at'
    >,
  ) => {
    const step: EmailSequence = {
      ...newStep,
      id: Date.now(),
      campaign_id: 0,
      step_number: sequences.length + 1,
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    updateSequences([...sequences, step]);
    setIsComposerOpen(false);
  };

  const handleUpdateStep = (updatedStep: EmailSequence) => {
    updateSequences(sequences.map((step) => (step.id === updatedStep.id ? updatedStep : step)));
    setEditingSequence(null);
    setIsComposerOpen(false);
  };

  const handleDeleteStep = (id: number) => {
    const newSequences = sequences
      .filter((step) => step.id !== id)
      .map((step, index) => ({ ...step, step_number: index + 1 }));
    updateSequences(newSequences);
  };

  const openComposerForNew = () => {
    setEditingSequence(null);
    setIsComposerOpen(true);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <ShellCard className="h-fit p-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search blocks..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Triggers</h4>
        <div className="mt-3 space-y-2">
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            New lead added
          </button>
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            Lead status change
          </button>
        </div>

        <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h4>
        <div className="mt-3 space-y-2">
          <button
            onClick={openComposerForNew}
            className="w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-left text-sm font-semibold text-orange-700"
          >
            Send email
          </button>
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            Add tag
          </button>
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            Notify team
          </button>
        </div>

        <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Logic</h4>
        <div className="mt-3 space-y-2">
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            Wait / Delay
          </button>
          <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
            Condition
          </button>
        </div>
      </ShellCard>

      <div className="space-y-4">
        <ShellCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Sequence Flow</h3>
              <p className="text-sm text-slate-500">
                Build the journey from lead creation to follow-up for Zimbabwe and regional corridors.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                All changes saved
              </span>
              <Button variant="primary" onClick={openComposerForNew}>
                <PlusIcon className="h-4 w-4" />
                Add Email Step
              </Button>
            </div>
          </div>
        </ShellCard>

        <div className="min-h-[520px] rounded-2xl border border-slate-200 bg-[radial-gradient(circle,_rgba(148,163,184,0.22)_1px,_transparent_1px)] bg-[length:18px_18px] p-6">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Trigger</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">New lead added</p>
            <p className="mt-1 text-sm text-slate-500">Start sequence when a qualified regional lead enters CRM.</p>
          </div>

          {sequences.length ? (
            <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-4">
              {sequences.map((seq, index) => (
                <React.Fragment key={seq.id}>
                  <div className="w-full">
                    <SequenceStep
                      sequence={seq}
                      onEdit={() => {
                        setEditingSequence(seq);
                        setIsComposerOpen(true);
                      }}
                      onDelete={() => handleDeleteStep(seq.id)}
                    />
                  </div>
                  {index < sequences.length - 1 ? (
                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Wait {seq.delay_days} day(s)
                    </div>
                  ) : null}
                </React.Fragment>
              ))}

              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Condition</p>
                <p className="mt-1 text-base font-semibold text-slate-900">If email was opened?</p>
                <p className="mt-1 text-xs text-slate-500">Branching logic can route leads to different follow-ups.</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
              <p className="text-base font-semibold text-slate-900">No sequence steps yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Add your first email step for a Harare, Lusaka, Gaborone, or Maputo lead flow.
              </p>
              <div className="mt-4">
                <Button variant="secondary" onClick={openComposerForNew}>
                  <PlusIcon className="h-4 w-4" />
                  Add First Step
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isComposerOpen && (
        <EmailComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onSave={editingSequence ? handleUpdateStep : handleAddStep}
          initialData={editingSequence}
        />
      )}
    </div>
  );
};

export default SequenceBuilderStep;

