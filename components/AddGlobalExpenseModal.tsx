
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Currency, PaymentMethod, ExpensePaymentStatus, RecurringFrequency } from '../types';
import { CloseIcon, DocumentDuplicateIcon, CurrencyDollarIcon, TagIcon, CalendarDaysIcon, DocumentTextIcon, CreditCardIcon, CheckCircleIcon, ArrowPathIcon, UploadIcon } from './icons/Icons';

interface AddGlobalExpenseModalProps {
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'recorded_by' | 'amount_in_base_currency'>) => void;
}

const AddGlobalExpenseModal: React.FC<AddGlobalExpenseModalProps> = ({ onClose, onAddExpense }) => {
  // Pre-filled state for demo
  const [formData, setFormData] = useState({
    expense_number: `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    expense_category: ExpenseCategory.FUEL,
    vendor_name: 'Total Energies',
    description: 'Monthly bulk diesel purchase for depot',
    amount: '450.00',
    currency: Currency.USD,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: PaymentMethod.CARD,
    payment_status: ExpensePaymentStatus.PAID,
    is_recurring: false,
    recurring_frequency: RecurringFrequency.MONTHLY,
  });
  const [receiptFile, setReceiptFile] = useState<{ name: string; type: string; url: string; } | null>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            setReceiptFile({
                name: file.name,
                type: file.type,
                url: reader.result as string,
            });
        };
        reader.readAsDataURL(file);
    } else {
        setReceiptFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name || !formData.amount) {
      setError('Vendor and Amount are required.');
      return;
    }
    setError('');
    const { amount, recurring_frequency, ...rest } = formData;
    onAddExpense({ 
        ...rest, 
        amount: parseFloat(amount), 
        receipt_url: receiptFile?.url,
        recurring_frequency: formData.is_recurring ? recurring_frequency : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Expense</h2>
            <p className="text-xs text-slate-500 mt-0.5">Log a new operational or administrative cost</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="p-6 space-y-6">
            
            {/* Amount Hero */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount</label>
                <div className="flex gap-3">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CurrencyDollarIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="block w-full rounded-lg border-slate-200 pl-11 py-3 text-2xl font-bold text-slate-900 focus:border-orange-500 focus:ring-orange-500 placeholder:text-slate-300 bg-white"
                            autoFocus
                        />
                    </div>
                    <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="rounded-lg border-slate-200 bg-white py-3 pl-3 pr-10 text-lg font-medium text-slate-700 focus:border-orange-500 focus:ring-orange-500"
                    >
                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><TagIcon className="w-3 h-3"/> Vendor Name*</label>
                <input 
                    type="text" 
                    name="vendor_name" 
                    value={formData.vendor_name} 
                    onChange={handleChange} 
                    placeholder="e.g. Office World"
                    className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><TagIcon className="w-3 h-3"/> Category</label>
                <select 
                    name="expense_category" 
                    value={formData.expense_category} 
                    onChange={handleChange} 
                    className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white"
                >
                  {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Date Incurred</label>
                <input 
                    type="date" 
                    name="expense_date" 
                    value={formData.expense_date} 
                    onChange={handleChange} 
                    className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CreditCardIcon className="w-3 h-3"/> Payment Method</label>
                <select 
                    name="payment_method" 
                    value={formData.payment_method} 
                    onChange={handleChange} 
                    className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white"
                >
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><DocumentTextIcon className="w-3 h-3"/> Description</label>
                <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={2}
                    className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 resize-none"
                    placeholder="Details about items or services purchased..."
                />
            </div>

            <hr className="border-slate-100" />

            {/* Settings & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Payment Status</label>
                    <select 
                        name="payment_status" 
                        value={formData.payment_status} 
                        onChange={handleChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white"
                    >
                    {Object.values(ExpensePaymentStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                
                <div 
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${formData.is_recurring ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    onClick={() => setFormData(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}
                >
                    <div className="flex items-center h-5">
                        <input
                            id="is_recurring_global"
                            name="is_recurring"
                            type="checkbox"
                            checked={formData.is_recurring}
                            onChange={handleChange}
                            className="h-4 w-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 pointer-events-none"
                        />
                        <label htmlFor="is_recurring_global" className="ml-3 text-sm font-medium text-slate-900 cursor-pointer">Recurring Expense</label>
                    </div>
                    {formData.is_recurring && (
                        <div className="mt-3 ml-7 animate-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
                            <select
                                name="recurring_frequency"
                                value={formData.recurring_frequency}
                                onChange={handleChange}
                                className="block w-full rounded-md border-orange-200 text-xs py-1.5 focus:border-orange-500 focus:ring-orange-500 capitalize bg-white"
                            >
                                {Object.values(RecurringFrequency).map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Upload */}
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receipt / Invoice</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors bg-white relative group">
                    <div className="space-y-1 text-center">
                        {receiptFile ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                                {receiptFile.type.startsWith('image/') ? (
                                    <img src={receiptFile.url} alt="Receipt preview" className="h-32 w-auto rounded-md object-cover shadow-sm mb-2" />
                                ) : (
                                    <div className="h-20 w-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-400">
                                        <DocumentTextIcon className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="flex text-sm text-slate-600">
                                    <span className="font-medium text-slate-900 truncate max-w-[200px]">{receiptFile.name}</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }} 
                                    className="mt-2 text-xs text-red-600 font-medium hover:text-red-800 bg-red-50 px-3 py-1 rounded-full transition-colors"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mx-auto h-12 w-12 text-slate-300 group-hover:text-orange-400 transition-colors">
                                    <UploadIcon className="h-full w-full" />
                                </div>
                                <div className="flex text-sm text-slate-600 justify-center mt-2">
                                    <label htmlFor="receipt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                                        <span>Upload a file</span>
                                        <input id="receipt-upload" name="receipt-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">{error}</div>}
          </main>
          
          <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Save Expense</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
export default AddGlobalExpenseModal;
