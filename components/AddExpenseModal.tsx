
import React, { useState } from 'react';
import { VehicleExpense, ExpenseType, Currency, RecurringFrequency } from '../types';
import { CloseIcon, CurrencyDollarIcon, TagIcon, CalendarDaysIcon, DocumentTextIcon, ArrowPathIcon } from './icons';
import { Button, Input, Select, Textarea, IconButton, ModalShell } from './UiKit';
import { SubtleCard } from './UiKit_new';

interface AddExpenseModalProps {
  onClose: () => void;
  onAddExpense: (expense: Omit<VehicleExpense, 'id' | 'vehicle_id' | 'created_at' | 'recorded_by'>) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose, onAddExpense }) => {
  const [expenseType, setExpenseType] = useState<ExpenseType>(ExpenseType.FUEL);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [errors, setErrors] = useState<{ amount?: string; description?: string; }>({});

  const validate = () => {
    const newErrors: { amount?: string; description?: string } = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    onAddExpense({
      expense_type: expenseType,
      amount: parseFloat(amount),
      currency,
      description,
      expense_date: expenseDate,
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? frequency : undefined,
    });
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Add Expense"
      description="Record a new cost for this vehicle"
      icon={<CurrencyDollarIcon className="w-4 h-4" />}
      maxWidthClass="max-w-lg"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save Expense</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="p-6 space-y-6">
            
            {/* Amount Section */}
            <SubtleCard className="p-4">
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Total Amount</label>
                <div className="flex gap-3">
                    <div className="relative grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-foreground-muted" />
                      </div>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`pl-10 text-lg font-semibold ${errors.amount ? 'border-danger-600' : ''}`}
                        autoFocus
                      />
                    </div>
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                      {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                  {errors.amount && <p className="mt-1 text-xs text-danger-600">{errors.amount}</p>}
            </SubtleCard>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-foreground-muted mb-1"><CalendarDaysIcon className="w-3 h-3"/> Date</label>
                      <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-foreground-muted mb-1"><TagIcon className="w-3 h-3"/> Type</label>
                      <Select value={expenseType} onChange={(e) => setExpenseType(e.target.value as ExpenseType)} className="capitalize">
                        {Object.values(ExpenseType).map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                      </Select>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-foreground-muted mb-1"><DocumentTextIcon className="w-3 h-3"/> Description</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Diesel fill-up at truck stop" rows={3} className={`${errors.description ? 'border-danger-600' : ''}`} />
                    {errors.description && <p className="mt-1 text-xs text-danger-600">{errors.description}</p>}
                </div>
            </div>
            
            <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <Input
                      id="is_recurring"
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring((e.target as HTMLInputElement).checked)}
                      className="h-4 w-4 rounded accent-warn-600 border-border focus:ring-warn-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="is_recurring" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 text-foreground-muted" />
                      Recurring Expense
                    </label>
                    <p className="text-xs text-foreground-muted">Automatically record this expense periodically</p>
                        
                        {isRecurring && (
                            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                <Select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} className="capitalize">
                                  {Object.values(RecurringFrequency).map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                  ))}
                                </Select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

          </main>
      </form>
    </ModalShell>
  );
};

export default AddExpenseModal;
