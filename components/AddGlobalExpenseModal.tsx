
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Currency, PaymentMethod, ExpensePaymentStatus, RecurringFrequency } from '../types';
import { CloseIcon, DocumentDuplicateIcon, CurrencyDollarIcon, TagIcon, CalendarDaysIcon, DocumentTextIcon, CreditCardIcon, CheckCircleIcon, ArrowPathIcon, UploadIcon } from './icons';
import { Button, Input, Select, Textarea, ModalShell } from './UiKit';
import { ShellCard, SubtleCard } from './UiKit_new';

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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Record Expense"
      description="Log a new operational or administrative cost"
      icon={<DocumentDuplicateIcon className="w-4 h-4" />}
      maxWidthClass="max-w-2xl"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save Expense</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="p-6 space-y-6">
            
            {/* Amount Hero */}
            <ShellCard className="p-5">
              <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Total Amount</label>
              <div className="flex gap-3">
                    <div className="relative grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-6 w-6 text-foreground-muted" />
                  </div>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-11 py-3 text-2xl font-bold"
                    autoFocus
                  />
                </div>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="py-3 text-lg font-medium"
                >
                  {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </ShellCard>

            {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><TagIcon className="w-3 h-3"/> Vendor Name*</label>
                <Input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} placeholder="e.g. Office World" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><TagIcon className="w-3 h-3"/> Category</label>
                <Select name="expense_category" value={formData.expense_category} onChange={handleChange} className="capitalize">
                  {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Date Incurred</label>
                <Input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} />
              </div>
              
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><CreditCardIcon className="w-3 h-3"/> Payment Method</label>
                <Select name="payment_method" value={formData.payment_method} onChange={handleChange} className="capitalize">
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><DocumentTextIcon className="w-3 h-3"/> Description</label>
                <Textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Details about items or services purchased..." />
            </div>

            <hr className="border-border" />

            {/* Settings & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="text-xs font-medium text-foreground-muted mb-1 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Payment Status</label>
                    <Select name="payment_status" value={formData.payment_status} onChange={handleChange} className="capitalize">
                    {Object.values(ExpensePaymentStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                </div>
                
                <SubtleCard className={`p-4 cursor-pointer transition-all duration-200 ${formData.is_recurring ? 'bg-amber-500/10 border-amber-500/20' : 'bg-card border-border hover:bg-muted'}`} onClick={() => setFormData(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}>
                  <div className="flex items-center h-5">
                    <Input
                      id="is_recurring_global"
                      name="is_recurring"
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={handleChange}
                      className="h-4 w-4 rounded text-foreground-muted border-border focus:ring-brand-600 pointer-events-none"
                    />
                    <label htmlFor="is_recurring_global" className="ml-3 text-sm font-medium text-foreground cursor-pointer">Recurring Expense</label>
                  </div>
                  {formData.is_recurring && (
                    <div className="mt-3 ml-7 animate-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
                      <Select
                        name="recurring_frequency"
                        value={formData.recurring_frequency}
                        onChange={handleChange}
                        className="text-xs py-1.5 capitalize"
                      >
                        {Object.values(RecurringFrequency).map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                </SubtleCard>
            </div>

            {/* Receipt Upload */}
            <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Receipt / Invoice</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg hover:bg-muted transition-colors bg-card relative group">
                    <div className="space-y-1 text-center">
                        {receiptFile ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                                {receiptFile.type.startsWith('image/') ? (
                                    <img src={receiptFile.url} alt="Receipt preview" className="h-32 w-auto rounded-md object-cover shadow-sm mb-2" />
                                ) : (
                          <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center mb-2 text-foreground-muted">
                                        <DocumentTextIcon className="h-10 w-10" />
                                    </div>
                                )}
                        <div className="flex text-sm text-foreground-muted">
                          <span className="font-medium text-foreground truncate max-w-50">{receiptFile.name}</span>
                        </div>
                        <div className="mt-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }}>Remove</Button>
                        </div>
                            </div>
                        ) : (
                            <>
                        <div className="mx-auto h-12 w-12 text-foreground-muted group-hover:text-amber-400 transition-colors">
                                    <UploadIcon className="h-full w-full" />
                                </div>
                        <div className="flex text-sm text-foreground-muted justify-center mt-2">
                          <label htmlFor="receipt-upload" className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-600">
                                        <span>Upload a file</span>
                                        <input id="receipt-upload" name="receipt-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                        <p className="text-xs text-foreground-muted">PNG, JPG, PDF up to 10MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="bg-danger-600/10 border border-danger-600/20 text-danger-600 px-4 py-3 rounded-lg text-sm text-center font-medium">{error}</div>}
          </main>
      </form>
    </ModalShell>
  );
};

export default AddGlobalExpenseModal;
