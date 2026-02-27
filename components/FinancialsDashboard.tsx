
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import InvoiceList from './InvoiceList';
import ExpenseList from './ExpenseList';
import { Invoice, Expense, InvoiceStatus } from '../types';
import { CurrencyDollarIcon, TrendingUpIcon, DocumentTextIcon, CreditCardIcon } from './icons';
import AddInvoiceModal from './AddInvoiceModal';
import AddGlobalExpenseModal from './AddGlobalExpenseModal';
import { useAuth } from '../auth/AuthContext';
import { SectionHeader, ShellCard, PageHeader, Button } from './UiKit';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AppSettings } from '../App';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';
import { buildInvoiceCsvColumns, buildInvoiceXlsxColumns } from '../dataIO/invoiceExportColumns';

const REPORT_LOCALE = 'en-GB';
const REPORT_TZ = 'Africa/Harare';

const formatCurrencyZW = (value: number, currencyCode: string): string =>
    new Intl.NumberFormat('en-ZW', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2,
    }).format(value || 0);

const toIsoDate = (value?: string): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    const raw = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (match) {
        const [, dd, mm, yyyy] = match;
        return `${yyyy}-${mm}-${dd}`;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
    return parsed.toISOString().split('T')[0];
};

const todayStamp = (): string =>
    new Date().toLocaleDateString(REPORT_LOCALE, { timeZone: REPORT_TZ }).replace(/\//g, '-');

// Enhanced Stat Card for Financials
const FinStatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; trend?: string; currency: string }> = ({ label, value, icon, color, trend, currency }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-md border border-slate-100 group min-w-0">
        <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full ${color} opacity-10 transition-transform group-hover:scale-110`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrencyZW(value, currency)}
                </p>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${color.replace('bg-', 'text-').replace('-500', '-600')}` })}
            </div>
        </div>
        {trend && (
            <div className="relative z-10 mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <TrendingUpIcon className="w-3 h-3" />
                <span>{trend} vs last month</span>
            </div>
        )}
    </div>
);

interface FinancialsDashboardProps {
    settings: AppSettings;
}

const FinancialsDashboard: React.FC<FinancialsDashboardProps> = ({ settings }) => {
    const { user } = useAuth();
    const { invoices, expenses, customers, bookings, addInvoice, addExpense, logAuditEvent } = useData();
    
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
    const [isImportOpen, setIsImportOpen] = useState(false);

    const customerById = useMemo(
        () =>
            customers.reduce<Record<number, (typeof customers)[number] | undefined>>((acc, customer) => {
                acc[customer.id] = customer;
                return acc;
            }, {}),
        [customers],
    );

    const bookingById = useMemo(
        () =>
            bookings.reduce<Record<number, (typeof bookings)[number] | undefined>>((acc, booking) => {
                acc[booking.id] = booking;
                return acc;
            }, {}),
        [bookings],
    );

    const invoiceCsvColumns = useMemo(
        () => buildInvoiceCsvColumns({ customerById, bookingById }),
        [customerById, bookingById],
    );

    const invoiceXlsxColumns = useMemo(
        () => buildInvoiceXlsxColumns({ customerById, bookingById }),
        [customerById, bookingById],
    );

    useEffect(() => {
        if (user?.role === 'customer') {
            const customerId = Number(user.userId);
            setFilteredInvoices(!isNaN(customerId) ? invoices.filter(i => i.customer_id === customerId) : []);
            setFilteredExpenses([]);
        } else {
            setFilteredInvoices(invoices);
            setFilteredExpenses(expenses);
        }
    }, [user, invoices, expenses]);

    const totalRevenue = filteredInvoices
        .filter(inv => inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.PARTIAL)
        .reduce((sum, inv) => sum + inv.amount_paid, 0);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount_in_base_currency, 0);
    const netProfit = totalRevenue - totalExpenses;
    const isCustomer = user?.role === 'customer';

    // Process chart data for the last 6 months
    const chartData = useMemo(() => {
        const dataByMonth: { [key: string]: number } = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        filteredInvoices.forEach(invoice => {
            const date = new Date(invoice.issue_date);
            if (isNaN(date.getTime())) return;
            const month = date.getMonth();
            const year = date.getFullYear();
            const key = `${year}-${month}`;
            if (!dataByMonth[key]) dataByMonth[key] = 0;
            dataByMonth[key] += invoice.total_amount;
        });

        const data = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();
            const key = `${year}-${month}`;
            data.push({
                name: monthNames[month],
                Value: dataByMonth[key] || 0
            });
        }
        return data;
    }, [filteredInvoices]);

    const handleAddInvoice = (newInvoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'balance_due' | 'amount_paid'>) => {
        const actorId = Number(user?.userId);
        const createdBy = Number.isFinite(actorId) && actorId > 0 ? actorId : 1;
        addInvoice({
            ...newInvoiceData,
            created_by: createdBy,
            amount_paid: 0,
            balance_due: newInvoiceData.total_amount,
        });
        setIsInvoiceModalOpen(false);
    };

    const handleAddExpense = (newExpenseData: any) => {
        addExpense({ ...newExpenseData, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), recorded_by: 1, amount_in_base_currency: newExpenseData.amount });
        setIsExpenseModalOpen(false);
    };

    const handleExportCsv = () => downloadCsv(filteredInvoices, invoiceCsvColumns as any, `invoices-${todayStamp()}`);
    const handleExportXlsx = () => downloadXlsx(filteredInvoices, invoiceXlsxColumns as any, `invoices-${todayStamp()}`);

    const handleImportInvoices = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
        let success = 0;
        let failed = 0;
        rows.forEach((row) => {
            try {
                const customerByName = row.customer_name
                    ? customers.find((c) => c.company_name.toLowerCase() === String(row.customer_name).toLowerCase())
                    : undefined;
                const total = Number(row.total_amount) || 0;
                const balance = row.balance_due !== undefined ? Number(row.balance_due) : total - (Number(row.amount_paid) || 0);
                const issueDate = toIsoDate(row.issue_date);
                const dueDate = toIsoDate(row.due_date || row.issue_date);
                const invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> = {
                    invoice_number: row.invoice_number || `IMP-${Date.now() + success}`,
                    customer_id: row.customer_id ? Number(row.customer_id) : customerByName?.id || 0,
                    booking_id: row.booking_id ? Number(row.booking_id) : undefined,
                    invoice_type: row.invoice_type || 'booking',
                    issue_date: issueDate,
                    due_date: dueDate,
                    subtotal: total,
                    tax_amount: Number(row.tax_amount) || 0,
                    discount_amount: Number(row.discount_amount) || 0,
                    total_amount: total,
                    amount_paid: Number(row.amount_paid) || 0,
                    balance_due: balance,
                    currency: row.currency || settings.currency,
                    status: row.status || 'draft',
                    payment_terms: row.payment_terms ? Number(row.payment_terms) : undefined,
                    created_by: user?.userId ? Number(user.userId) : 0,
                };
                addInvoice(invoice);
                success += 1;
            } catch {
                failed += 1;
            }
        });
        logAuditEvent({
            action: 'data.import',
            entity: { type: 'invoice' },
            meta: { imported: success, failed: failed || meta.failed, source: 'invoices.import' },
        });
        setIsImportOpen(false);
    };

    return (
        <>
                <div className="flex flex-col gap-6 min-w-0">
                    <PageHeader
                        title="Financials & Invoicing"
                        subtitle="Zimbabwe and SADC billing, expenses, and profitability"
                        right={(
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="ghost" onClick={handleExportCsv}>Export CSV</Button>
                                <Button variant="ghost" onClick={handleExportXlsx}>Export XLSX</Button>
                                <Button variant="secondary" onClick={() => setIsImportOpen(true)}>Import</Button>
                                <Button variant="primary" onClick={() => setIsInvoiceModalOpen(true)}>Generate invoice</Button>
                            </div>
                        )}
                    />
                <div className={`grid grid-cols-1 ${isCustomer ? '' : 'md:grid-cols-3'} gap-5`}>
                    <FinStatCard 
                        label={isCustomer ? "Total Paid" : "Total Revenue"}
                        value={totalRevenue}
                        icon={<CurrencyDollarIcon />}
                        color="bg-emerald-500"
                        trend="+8.4%"
                        currency={settings.currency}
                    />
                    {!isCustomer && (
                        <>
                            <FinStatCard 
                                label="Operating Costs" 
                                value={totalExpenses}
                                icon={<CreditCardIcon />}
                                color="bg-rose-500"
                                currency={settings.currency}
                            />
                            <FinStatCard 
                                label="Net Profit" 
                                value={netProfit}
                                icon={<DocumentTextIcon />}
                                color={netProfit >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}
                                currency={settings.currency}
                            />
                        </>
                    )}
                </div>
                
                <div className="h-80 w-full">
                    <ShellCard className="h-full p-5 flex flex-col min-w-0 overflow-hidden">
                        <SectionHeader 
                            title={isCustomer ? "Spend History" : "Revenue Trend"} 
                            subtitle="Rolling six-month performance (Africa/Harare calendar)" 
                        />
                        <div className="flex-1 mt-4 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tickFormatter={(value) => `${value >= 1000 ? `${Math.round((value as number) / 1000)}k` : value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => formatCurrencyZW(value, settings.currency)}
                                        itemStyle={{ color: '#10b981', fontWeight: 600 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Value" 
                                        name={isCustomer ? "Spend" : "Revenue"}
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                                        activeDot={{ r: 6, fill: '#10b981', stroke: '#d1fae5', strokeWidth: 4 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </ShellCard>
                </div>

                <ShellCard className="p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Invoices
                            </button>
                            {!isCustomer && (
                                <button
                                    onClick={() => setActiveTab('expenses')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Expenses
                                </button>
                            )}
                        </div>
                        {!isCustomer && activeTab === 'invoices' && (
                            <button
                                onClick={() => setIsInvoiceModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-bold shadow-sm hover:bg-orange-700 transition"
                            >
                                Generate Invoice
                            </button>
                        )}
                        {!isCustomer && activeTab === 'expenses' && (
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-bold shadow-sm hover:bg-orange-700 transition"
                            >
                                Add Expense
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                        {activeTab === 'invoices' && (
                            <InvoiceList 
                                invoices={filteredInvoices} 
                                onAddInvoiceClick={() => !isCustomer && setIsInvoiceModalOpen(true)}
                                reminderLeadDays={settings.invoiceReminderDays}
                            />
                        )}
                        {!isCustomer && activeTab === 'expenses' && (
                            <ExpenseList expenses={filteredExpenses} onAddExpenseClick={() => setIsExpenseModalOpen(true)} />
                        )}
                    </div>
                </ShellCard>
            </div>
            
            {isInvoiceModalOpen && !isCustomer && (
                <AddInvoiceModal onClose={() => setIsInvoiceModalOpen(false)} onAddInvoice={handleAddInvoice} />
            )}
            {isExpenseModalOpen && !isCustomer && (
                <AddGlobalExpenseModal onClose={() => setIsExpenseModalOpen(false)} onAddExpense={handleAddExpense} />
            )}
            {isImportOpen && (
                <ImportModal
                    isOpen={isImportOpen}
                    onClose={() => setIsImportOpen(false)}
                    title="Import invoices"
                    description="Upload CSV data (DD/MM/YYYY or YYYY-MM-DD accepted), map columns, and import."
                    targetFields={[
                        { key: 'invoice_number', label: 'Invoice #', required: true },
                        { key: 'customer_id', label: 'Customer ID' },
                        { key: 'customer_name', label: 'Customer Name' },
                        { key: 'booking_id', label: 'Booking ID' },
                        { key: 'issue_date', label: 'Issue Date' },
                        { key: 'due_date', label: 'Due Date' },
                        { key: 'currency', label: 'Currency' },
                        { key: 'tax_amount', label: 'Tax / VAT Amount' },
                        { key: 'discount_amount', label: 'Discount Amount' },
                        { key: 'total_amount', label: 'Total Amount', required: true },
                        { key: 'amount_paid', label: 'Amount Paid' },
                        { key: 'balance_due', label: 'Balance Due' },
                        { key: 'payment_terms', label: 'Payment Terms (Days)' },
                        { key: 'status', label: 'Status' },
                        { key: 'notes', label: 'Internal Notes' },
                        { key: 'customer_notes', label: 'Client Notes' },
                    ]}
                    onImport={handleImportInvoices}
                />
            )}
        </>
    );
};

export default FinancialsDashboard;
