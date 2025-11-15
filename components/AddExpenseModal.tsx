import React, { useState } from 'react';
import { VehicleExpense, ExpenseType, Currency } from '../types';
import { CloseIcon } from './icons/Icons';

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
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-4">
            <div>
              <label htmlFor="expenseType" className="block text-sm font-medium text-gray-700">Expense Type</label>
              <select
                id="expenseType"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.values(ExpenseType).map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${errors.amount ? 'border-red-500' : ''}`}
                />
                {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
             <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Diesel fill-up at truck stop"
                className={`mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${errors.description ? 'border-red-500' : ''}`}
              />
               {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>
             <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="expenseDate"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
          </main>
          <footer className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save Expense
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;