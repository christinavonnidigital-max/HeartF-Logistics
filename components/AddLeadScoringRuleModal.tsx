
import React, { useState } from 'react';
import { LeadScoringRule } from '../types';
import { CloseIcon } from './icons';
import { Button, Input, Select, ModalShell } from './UiKit';

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
            <ModalShell
                isOpen={true}
                onClose={onClose}
                title="Add Scoring Rule"
                description="Create a rule to score leads automatically"
                icon={<CloseIcon className="w-5 h-5 text-brand-600" />}
                maxWidthClass="max-w-xl"
                footer={(
                    <>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" form="add-rule-form">Add Rule</Button>
                    </>
                )}
            >
                <form id="add-rule-form" onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground-muted">Rule Name</label>
                        <Input type="text" name="rule_name" value={formData.rule_name} onChange={handleChange} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground-muted">Condition</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            <Input type="text" name="condition_field" value={formData.condition_field} onChange={handleChange} />
                            <Select name="condition_operator" value={formData.condition_operator} onChange={handleChange}>
                                <option value="equals">equals</option>
                                <option value="contains">contains</option>
                                <option value="greater_than">greater than</option>
                            </Select>
                            <Input type="text" name="condition_value" value={formData.condition_value} onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground-muted">Points</label>
                        <Input type="number" name="points" value={formData.points as any} onChange={handleChange} className="mt-1" />
                    </div>
                    {error && <p className="text-danger-600 text-sm mt-2 bg-danger-600/10 p-2 rounded-md text-center">{error}</p>}
                </main>
                </form>
      </ModalShell>
    );
};

export default AddLeadScoringRuleModal;
