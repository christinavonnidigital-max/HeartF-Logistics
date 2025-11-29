
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceType, InvoiceStatus, Currency, Booking } from '../types';
import { CloseIcon, CalendarDaysIcon, UserCircleIcon, DocumentTextIcon, BanknotesIcon, CalculatorIcon } from './icons/Icons';
import { mockCustomers } from '../data/mockCrmData';

interface AddInvoiceModalProps {
  onClose: () => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'balance_due' | 'amount_paid'>) => void;
  booking?: Booking | null;
}

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ onClose, onAddInvoice, booking }) => {
  const [formData, setFormData] = useState({
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    customer_id: '',
    booking_id: undefined as number | undefined,
    invoice_type: InvoiceType.BOOKING,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    subtotal: '',
    tax_amount: '',
    discount_amount: 0,
    total_amount: '',
    currency: Currency.USD,
    status: InvoiceStatus.DRAFT,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      const subtotal = (booking.total_price - (booking.surcharges || 0) + (booking.discount || 0));
      const taxRate = 0.15; // Assuming 15% tax for calculation
      const calculatedTax = subtotal * taxRate;
      const calculatedTotal = subtotal + calculatedTax + (booking.surcharges || 0) - (booking.discount || 0);

      setFormData({
        invoice_number: `INV-B${booking.id}-${new Date().getFullYear()}`,
        customer_id: String(booking.customer_id),
        booking_id: booking.id,
        invoice_type: InvoiceType.BOOKING,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        subtotal: subtotal.toFixed(2),
        tax_amount: calculatedTax.toFixed(2),
        discount_amount: booking.discount || 0,
        total_amount: calculatedTotal.toFixed(2),
        currency: booking.currency,
        status: InvoiceStatus.DRAFT,
      });
    }
  }, [booking]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.total_amount) {
      setError('Customer and Total Amount are required.');
      return;
    }
    setError('');
    const { customer_id, subtotal, tax_amount, total_amount, discount_amount, ...rest } = formData;
    onAddInvoice({
      ...rest,
      customer_id: parseInt(customer_id),
      subtotal: parseFloat(subtotal) || 0,
      tax_amount: parseFloat(tax_amount) || 0,
      discount_amount: parseFloat(String(discount_amount)) || 0,
      total_amount: parseFloat(total_amount),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Draft New Invoice</h2>
            <p className="text-xs text-slate-500 mt-0.5">Create a financial record for a client</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="p-6 space-y-8">
            
            {/* Invoice Meta */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    Invoice Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Number</label>
                        <input 
                            type="text" 
                            value={formData.invoice_number} 
                            disabled 
                            className="block w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0" 
                        />
                    </div>
                    <div></div> {/* Spacer */}
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Issue Date</label>
                        <input 
                            type="date" 
                            name="issue_date" 
                            value={formData.issue_date} 
                            onChange={handleChange} 
                            className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Due Date</label>
                        <input 
                            type="date" 
                            name="due_date" 
                            value={formData.due_date} 
                            onChange={handleChange} 
                            className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" 
                        />
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Bill To */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4" />
                    Bill To
                </h3>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Customer*</label>
                    <select 
                        name="customer_id" 
                        value={formData.customer_id} 
                        onChange={handleChange} 
                        disabled={!!booking}
                        className={`block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 ${!!booking ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
                    >
                        <option value="">Select a Customer</option>
                        {mockCustomers.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Financials */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4" />
                    Payment Details
                </h3>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Subtotal</label>
                            <input type="number" name="subtotal" placeholder="0.00" value={formData.subtotal} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax Amount</label>
                            <input type="number" name="tax_amount" placeholder="0.00" value={formData.tax_amount} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-right" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Discount</label>
                            <input type="number" name="discount_amount" placeholder="0.00" value={formData.discount_amount} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-right" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                            <select name="currency" value={formData.currency} onChange={handleChange} disabled={!!booking} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-right">
                                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CalculatorIcon className="w-4 h-4 text-orange-500" />
                                Total Amount*
                            </label>
                            <div className="relative w-1/2">
                                 <input 
                                    type="number" 
                                    name="total_amount" 
                                    placeholder="0.00" 
                                    value={formData.total_amount} 
                                    onChange={handleChange} 
                                    readOnly={!!booking}
                                    className={`block w-full rounded-lg border-slate-200 text-lg font-bold text-slate-900 text-right focus:border-orange-500 focus:ring-orange-500 ${!!booking ? 'bg-slate-100' : 'bg-white'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                 <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}
          </main>
          
          <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Generate Invoice</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
export default AddInvoiceModal;
