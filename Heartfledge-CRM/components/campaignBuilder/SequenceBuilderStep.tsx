
import React, { useState } from 'react';
import { EmailSequence } from '../../types';
import { PlusIcon } from '../icons/Icons';
import EmailComposer from './EmailComposer';
import SequenceStep from './SequenceStep';


interface SequenceBuilderStepProps {
    sequences: EmailSequence[];
    updateSequences: (sequences: EmailSequence[]) => void;
}

const SequenceBuilderStep: React.FC<SequenceBuilderStepProps> = ({ sequences, updateSequences }) => {
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);

    const handleAddStep = (newStep: Omit<EmailSequence, 'id' | 'campaign_id' | 'step_number' | 'emails_sent' | 'emails_opened' | 'emails_clicked' | 'created_at' | 'updated_at'>) => {
        const step: EmailSequence = {
            ...newStep,
            id: Date.now(),
            campaign_id: 0, // Will be assigned on campaign save
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
        updateSequences(sequences.map(s => s.id === updatedStep.id ? updatedStep : s));
        setEditingSequence(null);
        setIsComposerOpen(false);
    }
    
    const handleDeleteStep = (id: number) => {
        const newSequences = sequences
            .filter(s => s.id !== id)
            .map((s, index) => ({ ...s, step_number: index + 1 })); // Re-order steps
        updateSequences(newSequences);
    }

    const handleEditClick = (sequence: EmailSequence) => {
        setEditingSequence(sequence);
        setIsComposerOpen(true);
    };
    
    const openComposerForNew = () => {
        setEditingSequence(null);
        setIsComposerOpen(true);
    }

    return (
        <div className="max-w-3xl mx-auto">
            <p className="text-center text-gray-600 mb-6">
                Build the sequence of emails that will be sent to your leads. You can set delays and conditions for each step.
            </p>
            <div className="space-y-4">
                {sequences.map(seq => (
                    <SequenceStep 
                        key={seq.id}
                        sequence={seq}
                        onEdit={() => handleEditClick(seq)}
                        onDelete={() => handleDeleteStep(seq.id)}
                    />
                ))}
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={openComposerForNew}
                    className="inline-flex items-center px-4 py-2 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Email Step
                </button>
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
