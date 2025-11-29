
import React, { useState } from 'react';
import { LeadScoringRule } from '../types';
import { CloseIcon } from './icons/Icons';

interface AddLeadScoringRuleModalProps {
  onClose: () => void;
  onAddRule: (rule: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddLeadScoringRuleModal: React.FC<AddLeadScoringRuleModalProps> = ({ onClose, onAddRule }) => {
    const [formData, setFormData] = useState({
        rule_name: '',
        points: 10,
        is_active: true,
        condition_field: 'industry',
        condition_operator: 'equals',
        condition_value: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.rule_name || !formData.condition_value) {
            setError('Rule Name and Condition Value are required.');
            return;
        }
        setError('');
        const { rule_name, points, is_active, condition_field, condition_operator, condition_value } = formData;
        onAddRule({
            rule_name,
            points: Number(points),
            is_active,
            condition: {
                field: condition_field,
                operator: condition_operator,
                value: condition_value,
            },
        });
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Add Scoring Rule</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                        <input type="text" name="rule_name" value={formData.rule_name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Condition</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            <input type="text" name="condition_field" value={formData.condition_field} onChange={handleChange} className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                            <select name="condition_operator" value={formData.condition_operator} onChange={handleChange} className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                                <option value="equals">equals</option>
                                <option value="contains">contains</option>
                                <option value="greater_than">greater than</option>
                            </select>
                            <input type="text" name="condition_value" value={formData.condition_value} onChange={handleChange} className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Points</label>
                        <input type="number" name="points" value={formData.points} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </main>
                <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Add Rule</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddLeadScoringRuleModal;
