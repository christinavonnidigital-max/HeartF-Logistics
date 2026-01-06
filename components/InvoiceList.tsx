
import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { PlusIcon } from './icons';
import { ShellCard, SectionHeader, StatusPill, ModalShell, Button, Input, Label } from './UiKit';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../auth/AuthContext';

interface InvoiceListProps {
  invoices: Invoice[];
  onAddInvoiceClick: () => void;
  reminderLeadDays: number;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onAddInvoiceClick, reminderLeadDays }) => {
  const { updateInvoice } = useData();
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  const getStatusTone = (status: InvoiceStatus): "success" | "warn" | "danger" | "info" | "neutral" => {
    switch (status) {
      case InvoiceStatus.PAID: return 'success';
      case InvoiceStatus.OVERDUE: return 'warn';
      case InvoiceStatus.PARTIAL: return 'warn';
      case InvoiceStatus.SENT: return 'info';
      case InvoiceStatus.VIEWED: return 'info';
      case InvoiceStatus.DRAFT: return 'neutral';
      case InvoiceStatus.CANCELLED: return 'danger';
      case InvoiceStatus.REFUNDED: return 'neutral';
      default: return 'neutral';
    }
  };

  const openReminderModal = (invoice: Invoice) => {
    const leadDays = Math.max(0, reminderLeadDays);
    const fallbackDate = invoice.due_date
      ? new Date(new Date(invoice.due_date).getTime() - leadDays * 24 * 60 * 60 * 1000)
      : new Date();
    setReminderInvoice(invoice);
    setReminderDate(invoice.reminder_at || fallbackDate.toISOString().split('T')[0] || '');
    setReminderNote(invoice.reminder_note || '');
  };

  const closeReminderModal = () => {
    setReminderInvoice(null);
    setReminderDate('');
    setReminderNote('');
  };

  const handleSaveReminder = () => {
    if (!reminderInvoice || isCustomer) return;
    updateInvoice({
      ...reminderInvoice,
      reminder_at: reminderDate || undefined,
      reminder_note: reminderNote || undefined,
    });
    closeReminderModal();
  };

  const handleLogReminderSent = () => {
    if (!reminderInvoice || isCustomer) return;
    updateInvoice({
      ...reminderInvoice,
      last_reminder_at: new Date().toISOString(),
    });
    closeReminderModal();
  };

  const handleMarkPaid = (invoice: Invoice) => {
    updateInvoice({
      ...invoice,
      status: InvoiceStatus.PAID,
      amount_paid: invoice.total_amount,
      balance_due: 0,
    });
  };

  return (
    <ShellCard className="p-4">
      <SectionHeader
        title="Invoices"
        subtitle="Money owed and money collected"
        actions={
          <button 
            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition shrink-0"
            onClick={onAddInvoiceClick}
            aria-label="Add new invoice"
          >
            <PlusIcon className="w-5 h-5"/>
          </button>
        }
      />
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Invoice #</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2">Reminder</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">
                  {invoice.invoice_number}
                </td>
                <td className="px-3 py-3 text-slate-600">{invoice.customer_id}</td>
                <td className="px-3 py-3 text-slate-600">{new Date(invoice.due_date + 'T00:00:00').toLocaleDateString()}</td>
                <td className="px-3 py-3 text-slate-800 font-medium text-right">{new Intl.NumberFormat(undefined, { style: 'currency', currency: invoice.currency }).format(invoice.total_amount)}</td>
                <td className="px-3 py-3 text-center">
                  <StatusPill
                    label={invoice.status.replace(/_/g, ' ')}
                    tone={getStatusTone(invoice.status)}
                  />
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  <div>
                    {invoice.reminder_at ? new Date(invoice.reminder_at).toLocaleDateString() : '—'}
                  </div>
                  {invoice.last_reminder_at ? (
                    <div className="text-[11px] text-slate-400">
                      Sent {new Date(invoice.last_reminder_at).toLocaleDateString()}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className={`rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 ${
                        isCustomer ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      onClick={() => {
                        if (!isCustomer) openReminderModal(invoice);
                      }}
                      type="button"
                      disabled={isCustomer}
                    >
                      Reminder
                    </button>
                    {invoice.status !== InvoiceStatus.PAID && (
                      <button
                        className={`rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 ${
                          isCustomer ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                        onClick={() => {
                          if (!isCustomer) handleMarkPaid(invoice);
                        }}
                        type="button"
                        disabled={isCustomer}
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ModalShell
        isOpen={!!reminderInvoice}
        onClose={closeReminderModal}
        title="Schedule invoice reminder"
        description={reminderInvoice ? `Invoice ${reminderInvoice.invoice_number}` : undefined}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" type="button" onClick={handleLogReminderSent}>
              Log sent now
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={closeReminderModal}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={handleSaveReminder}>
                Save reminder
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Reminder date</Label>
            <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} />
          </div>
        </div>
      </ModalShell>
    </ShellCard>
  );
};

export default InvoiceList;
