
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, Currency, Invoice, InvoiceStatus, InvoiceType } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { DocumentTextIcon, CurrencyDollarIcon, CalendarDaysIcon, UserCircleIcon, BanknotesIcon, CalculatorIcon } from './icons';
import { ModalShell, Button, Input, Select, SectionHeader, Label } from './UiKit';
import { SubtleCard } from './UiKit_new';

interface AddInvoiceModalProps {
  onClose: () => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'balance_due' | 'amount_paid'>) => void;
  booking?: Booking | null;
}

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ onClose, onAddInvoice, booking }) => {
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    customer_id: '101',
    booking_id: booking?.id ? String(booking.id) : '',
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
    if (!booking) return;

    const subtotal = booking.total_price - (booking.surcharges || 0) + (booking.discount || 0);
    const taxRate = 0.15;
    const calculatedTax = subtotal * taxRate;
    const calculatedTotal = subtotal + calculatedTax + (booking.surcharges || 0) - (booking.discount || 0);

    setFormData((prev) => ({
      ...prev,
      invoice_number: `INV-B${booking.id}-${new Date().getFullYear()}`,
      customer_id: String(booking.customer_id),
      booking_id: String(booking.id),
      invoice_type: InvoiceType.BOOKING,
      subtotal: subtotal.toFixed(2),
      tax_amount: calculatedTax.toFixed(2),
      total_amount: calculatedTotal.toFixed(2),
      currency: booking.currency,
    }));
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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={booking ? `Create invoice for ${booking.booking_number}` : 'Create invoice'}
      description="Generate an invoice for a booking or customer. Required fields are marked with *."
      icon={<DocumentTextIcon className="w-4 h-4" />}
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-foreground/60">
            {error ? <span className="text-rose-400">{error}</span> : <span>Tip: Draft invoices can be finalized later.</span>}
          </div>
          <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
              <Button variant="primary" type="submit" form="add-invoice-form">Create invoice</Button>
          </div>
        </div>
      }
    >
      <form id="add-invoice-form" onSubmit={handleSubmit} className="space-y-6">
        <main className="p-6 space-y-8">
          <SectionHeader title="Invoice Details" actions={<DocumentTextIcon className="w-4 h-4" />} />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg border border-border p-3">
                <Label>Invoice Number</Label>
                <Input type="text" value={formData.invoice_number} disabled className="bg-transparent border-none p-0 text-sm font-bold text-foreground focus:ring-0" />
              </div>
              <div></div> {/* Spacer */}

              <div>
                <Label className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Issue Date</Label>
                <Input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Due Date</Label>
                <Input type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
              </div>
            </div>
          <hr className="border-border" />
          {/* Bill To */}
          <SectionHeader title="Bill To" actions={<UserCircleIcon className="w-4 h-4" />} />
          <div className="space-y-4">
            <div>
              <Label>Customer*</Label>
              <Select name="customer_id" value={formData.customer_id} onChange={handleChange} disabled={!!booking}>
                <option value="">Select a Customer</option>
                {mockCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>
            </div>
          </div>
          <hr className="border-border" />
          {/* Financials */}
          <SectionHeader title="Payment Details" actions={<BanknotesIcon className="w-4 h-4" />} />

            <SubtleCard className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subtotal</Label>
                  <Input type="number" name="subtotal" placeholder="0.00" value={formData.subtotal} onChange={handleChange} className="text-right" />
                </div>
                <div>
                  <Label>Tax Amount</Label>
                  <Input type="number" name="tax_amount" placeholder="0.00" value={formData.tax_amount} onChange={handleChange} className="text-right" />
                </div>
                <div>
                  <Label>Discount</Label>
                  <Input type="number" name="discount_amount" placeholder="0.00" value={formData.discount_amount} onChange={handleChange} className="text-right" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select name="currency" value={formData.currency} onChange={handleChange} disabled={!!booking}>
                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CalculatorIcon className="w-4 h-4 text-foreground-muted" />
                    Total Amount*
                  </label>
                  <div className="relative w-1/2">
                    <Input
                      type="number"
                      name="total_amount"
                      placeholder="0.00"
                      value={formData.total_amount}
                      onChange={handleChange}
                      readOnly={!!booking}
                      className={`${!!booking ? 'bg-muted' : 'bg-card'} text-lg font-bold text-right`}
                    />
                  </div>
                </div>
              </div>
            </SubtleCard>
          </div>
          {error && (
            <div className="bg-danger-600/10 border border-danger-600/20 text-danger-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </main>

      </form>
    </ModalShell>
  );
};
export default AddInvoiceModal;
