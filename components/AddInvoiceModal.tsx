
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceType, InvoiceStatus, Currency, Booking } from '../types';
import { CloseIcon } from './icons/Icons';

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
      setError('Customer ID and Total Amount are required.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Add New Invoice</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                <input type="text" value={formData.invoice_number} disabled className="mt-1 block w-full shadow-sm sm:text-sm bg-gray-200 text-gray-500 border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer ID*</label>
                <input type="number" name="customer_id" value={formData.customer_id} onChange={handleChange} readOnly={!!booking} className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm ${!!booking ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-white text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-orange-500'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                <input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount*</label>
                <input type="number" name="total_amount" placeholder="0.00" value={formData.total_amount} onChange={handleChange} readOnly={!!booking} className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm ${!!booking ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-white text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-orange-500'}`} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} disabled={!!booking} className={`mt-1 block w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${!!booking ? 'bg-gray-200 text-gray-500' : 'bg-white text-gray-900'}`}>
                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </main>
          <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Add Invoice</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
export default AddInvoiceModal;