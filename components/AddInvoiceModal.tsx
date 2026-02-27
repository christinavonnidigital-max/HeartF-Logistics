import React, { useEffect, useMemo, useState } from 'react';
import { Booking, Currency, Invoice, InvoiceStatus, InvoiceType } from '../types';
import { DocumentTextIcon, CalendarDaysIcon, UserCircleIcon, BanknotesIcon, CalculatorIcon } from './icons';
import { ModalShell, Button, Input, Select, SectionHeader, Label, SubtleCard } from './UiKit';
import { useData } from '../contexts/DataContext';

interface AddInvoiceModalProps {
  onClose: () => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'balance_due' | 'amount_paid'>) => void;
  booking?: Booking | null;
}

const VAT_RATE = 0.15;

const toFixedMoney = (value: number): string => (Number.isFinite(value) ? value.toFixed(2) : '0.00');
const toNumber = (value: string | number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const makeInvoiceNumber = (bookingId?: number | string): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(100 + Math.random() * 900));
  return bookingId ? `INV-ZW-${datePart}-B${bookingId}` : `INV-ZW-${datePart}-${rand}`;
};

const addDays = (isoDate: string, days: number): string => {
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return isoDate;
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ onClose, onAddInvoice, booking }) => {
  const { customers } = useData();
  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.company_name.localeCompare(b.company_name)),
    [customers],
  );

  const [formData, setFormData] = useState({
    invoice_number: makeInvoiceNumber(booking?.id),
    customer_id: '',
    booking_id: booking?.id ? String(booking.id) : '',
    invoice_type: InvoiceType.BOOKING as InvoiceType,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: addDays(new Date().toISOString().split('T')[0], 30),
    payment_terms: '30',
    subtotal: '',
    tax_amount: '',
    discount_amount: '0',
    total_amount: '0.00',
    currency: Currency.USD as Currency,
    status: InvoiceStatus.DRAFT as InvoiceStatus,
    notes: '',
    customer_notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      const base = toNumber(booking.base_price);
      const surcharge = toNumber(booking.surcharges || 0);
      const discount = toNumber(booking.discount || 0);
      const subtotal = base + surcharge;
      const taxable = Math.max(subtotal - discount, 0);
      const tax = taxable * VAT_RATE;
      const total = taxable + tax;
      setFormData((prev) => ({
        ...prev,
        invoice_number: makeInvoiceNumber(booking.id),
        customer_id: String(booking.customer_id),
        booking_id: String(booking.id),
        invoice_type: InvoiceType.BOOKING,
        subtotal: toFixedMoney(subtotal),
        tax_amount: toFixedMoney(tax),
        discount_amount: toFixedMoney(discount),
        total_amount: toFixedMoney(total),
        currency: booking.currency,
      }));
      return;
    }

    if (!formData.customer_id && sortedCustomers.length > 0) {
      const preferred = sortedCustomers[0];
      setFormData((prev) => ({
        ...prev,
        customer_id: String(preferred.id),
        currency: preferred.preferred_currency || prev.currency,
      }));
    }
  }, [booking, formData.customer_id, sortedCustomers]);

  useEffect(() => {
    const subtotal = toNumber(formData.subtotal);
    const tax = toNumber(formData.tax_amount);
    const discount = toNumber(formData.discount_amount);
    const computed = Math.max(subtotal + tax - discount, 0);
    setFormData((prev) => (prev.total_amount === toFixedMoney(computed) ? prev : { ...prev, total_amount: toFixedMoney(computed) }));
  }, [formData.subtotal, formData.tax_amount, formData.discount_amount]);

  useEffect(() => {
    const terms = Math.max(0, Math.round(toNumber(formData.payment_terms)));
    const nextDue = addDays(formData.issue_date, terms);
    setFormData((prev) => (prev.due_date === nextDue ? prev : { ...prev, due_date: nextDue }));
  }, [formData.issue_date, formData.payment_terms]);

  const selectedCustomer = useMemo(
    () => sortedCustomers.find((c) => String(c.id) === String(formData.customer_id)),
    [sortedCustomers, formData.customer_id],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyVatDefault = () => {
    const subtotal = toNumber(formData.subtotal);
    const discount = toNumber(formData.discount_amount);
    const taxable = Math.max(subtotal - discount, 0);
    setFormData((prev) => ({ ...prev, tax_amount: toFixedMoney(taxable * VAT_RATE) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      setError('Customer is required.');
      return;
    }

    const total = toNumber(formData.total_amount);
    if (total <= 0) {
      setError('Total amount must be greater than 0.');
      return;
    }

    setError('');
    onAddInvoice({
      invoice_number: formData.invoice_number,
      customer_id: Number(formData.customer_id),
      booking_id: formData.booking_id ? Number(formData.booking_id) : undefined,
      invoice_type: formData.invoice_type,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      subtotal: toNumber(formData.subtotal),
      tax_amount: toNumber(formData.tax_amount),
      discount_amount: toNumber(formData.discount_amount),
      total_amount: total,
      currency: formData.currency,
      status: formData.status,
      payment_terms: Math.round(toNumber(formData.payment_terms)),
      notes: formData.notes.trim() || undefined,
      customer_notes: formData.customer_notes.trim() || undefined,
    });
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={booking ? `Generate invoice for ${booking.booking_number}` : 'Generate new invoice'}
      description="Create an invoice for Zimbabwe and regional SADC shipments. Dates are displayed as DD/MM/YYYY across the app."
      icon={<DocumentTextIcon className="w-4 h-4" />}
      maxWidthClass="max-w-3xl"
      footer={(
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-foreground/70">
            {error ? <span className="text-rose-500">{error}</span> : <span>Tip: VAT defaults to 15% and can be adjusted per client terms.</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form="add-invoice-form">Create invoice</Button>
          </div>
        </div>
      )}
    >
      <form id="add-invoice-form" onSubmit={handleSubmit} className="space-y-6 p-6">
        <SectionHeader title="Invoice Details" actions={<DocumentTextIcon className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Invoice Number</Label>
            <Input type="text" name="invoice_number" value={formData.invoice_number} onChange={handleChange} />
          </div>
          <div>
            <Label>Status</Label>
            <Select name="status" value={formData.status} onChange={handleChange}>
              <option value={InvoiceStatus.DRAFT}>Draft</option>
              <option value={InvoiceStatus.SENT}>Sent</option>
              <option value={InvoiceStatus.VIEWED}>Viewed</option>
              <option value={InvoiceStatus.PARTIAL}>Partial</option>
              <option value={InvoiceStatus.PAID}>Paid</option>
              <option value={InvoiceStatus.OVERDUE}>Overdue</option>
              <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" />Issue Date</Label>
            <Input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} />
          </div>
          <div>
            <Label className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" />Payment Terms (Days)</Label>
            <Select name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
              <option value="7">Net 7</option>
              <option value="14">Net 14</option>
              <option value="21">Net 21</option>
              <option value="30">Net 30</option>
              <option value="45">Net 45</option>
              <option value="60">Net 60</option>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" />Due Date</Label>
            <Input type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
          </div>
        </div>

        <hr className="border-border" />

        <SectionHeader title="Billing Details" actions={<UserCircleIcon className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Customer *</Label>
            <Select name="customer_id" value={formData.customer_id} onChange={handleChange} disabled={!!booking}>
              <option value="">Select customer</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name} ({customer.country || 'Zimbabwe'})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select name="currency" value={formData.currency} onChange={handleChange} disabled={!!booking}>
              {Object.values(Currency).map((currencyCode) => (
                <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
              ))}
            </Select>
          </div>
          {formData.booking_id ? (
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Linked booking: <span className="font-semibold text-slate-800">{booking?.booking_number || `#${formData.booking_id}`}</span>
            </div>
          ) : null}
          {selectedCustomer ? (
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Billing email: <span className="font-semibold text-slate-800">{selectedCustomer.billing_email}</span>
            </div>
          ) : null}
        </div>

        <hr className="border-border" />

        <SectionHeader title="Charges & Totals" actions={<BanknotesIcon className="w-4 h-4" />} />
        <SubtleCard className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subtotal</Label>
              <Input type="number" step="0.01" name="subtotal" placeholder="0.00" value={formData.subtotal} onChange={handleChange} className="text-right" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>Tax / VAT Amount</Label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                  onClick={applyVatDefault}
                >
                  Apply 15% VAT
                </button>
              </div>
              <Input type="number" step="0.01" name="tax_amount" placeholder="0.00" value={formData.tax_amount} onChange={handleChange} className="text-right" />
            </div>
            <div>
              <Label>Discount Amount</Label>
              <Input type="number" step="0.01" name="discount_amount" placeholder="0.00" value={formData.discount_amount} onChange={handleChange} className="text-right" />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalculatorIcon className="w-4 h-4 text-foreground-muted" />
                Total Amount
              </label>
              <Input
                type="number"
                step="0.01"
                name="total_amount"
                value={formData.total_amount}
                readOnly
                className="bg-muted text-lg font-bold text-right"
              />
            </div>
          </div>
        </SubtleCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Internal Notes</Label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Internal finance notes..."
            />
          </div>
          <div>
            <Label>Client Notes</Label>
            <textarea
              name="customer_notes"
              value={formData.customer_notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Shown on invoice email or PDF..."
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
};

export default AddInvoiceModal;
