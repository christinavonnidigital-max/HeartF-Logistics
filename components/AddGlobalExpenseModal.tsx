
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Currency, PaymentMethod, ExpensePaymentStatus } from '../types';
import { CloseIcon } from './icons/Icons';

interface AddGlobalExpenseModalProps {
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'recorded_by' | 'amount_in_base_currency'>) => void;
}

const AddGlobalExpenseModal: React.FC<AddGlobalExpenseModalProps> = ({ onClose, onAddExpense }) => {
  const [formData, setFormData] = useState({
    expense_number: `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    expense_category: ExpenseCategory.OTHER,
    vendor_name: '',
    description: '',
    amount: '',
    currency: Currency.USD,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: PaymentMethod.CASH,
    payment_status: ExpensePaymentStatus.PAID,
    is_recurring: false,
  });
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name || !formData.amount) {
      setError('Vendor and Amount are required.');
      return;
    }
    setError('');
    const { amount, ...rest } = formData;
    onAddExpense({ ...rest, amount: parseFloat(amount), receipt_url: receiptUrl });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Add New Expense</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor*</label>
                <input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select name="expense_category" value={formData.expense_category} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                  {Object.values(ExpenseCategory).map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount*</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Receipt Upload</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {receiptUrl && (
                  <div className="mt-2">
                    <img src={receiptUrl} alt="Receipt preview" className="h-24 w-auto rounded-md object-cover" />
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </main>
          <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Add Expense</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
export default AddGlobalExpenseModal;