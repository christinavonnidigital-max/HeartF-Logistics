
import React from 'react';
import { EmailSequence } from '../../types';
import { ClockIcon, EnvelopeIcon, PencilSquareIcon, TrashIcon } from '../icons/Icons';

interface SequenceStepProps {
    sequence: EmailSequence;
    onEdit: () => void;
    onDelete: () => void;
}

const SequenceStep: React.FC<SequenceStepProps> = ({ sequence, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                     <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <EnvelopeIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Step {sequence.step_number}: {sequence.subject_line}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1.5"/>
                            Wait {sequence.delay_days} day(s) before sending
                        </p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100">
                        <PencilSquareIcon className="w-5 h-5" />
                    </button>
                     <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SequenceStep;
