
import React, { useState } from 'react';
import { VehicleExpense, ExpenseType, Currency, RecurringFrequency } from '../types';
import { CloseIcon, CurrencyDollarIcon, TagIcon, CalendarDaysIcon, DocumentTextIcon, ArrowPathIcon } from './icons/Icons';

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
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Expense</h2>
            <p className="text-xs text-slate-500 mt-0.5">Record a new cost for this vehicle</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="p-6 space-y-6">
            
            {/* Amount Section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount</label>
                <div className="flex gap-3">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CurrencyDollarIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className={`block w-full rounded-lg border-slate-200 pl-10 py-3 text-lg font-semibold text-slate-900 focus:border-orange-500 focus:ring-orange-500 ${errors.amount ? 'border-red-500' : ''}`}
                            autoFocus
                        />
                    </div>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="rounded-lg border-slate-200 bg-white py-3 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-orange-500 focus:ring-orange-500"
                    >
                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Date</label>
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><TagIcon className="w-3 h-3"/> Type</label>
                        <select
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                            className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize"
                        >
                            {Object.values(ExpenseType).map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><DocumentTextIcon className="w-3 h-3"/> Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Diesel fill-up at truck stop"
                        rows={3}
                        className={`block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 resize-none ${errors.description ? 'border-red-500' : ''}`}
                    />
                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
                <div className="flex items-start gap-3">
                    <div className="flex items-center h-5">
                        <input
                            id="is_recurring"
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="h-4 w-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="is_recurring" className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            <ArrowPathIcon className="w-4 h-4 text-slate-400" />
                            Recurring Expense
                        </label>
                        <p className="text-xs text-slate-500">Automatically record this expense periodically</p>
                        
                        {isRecurring && (
                            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                                    className="block w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize"
                                >
                                    {Object.values(RecurringFrequency).map(freq => (
                                        <option key={freq} value={freq}>{freq}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

          </main>
        </form>
        
        <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all"
            >
              Save Expense
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AddExpenseModal;
