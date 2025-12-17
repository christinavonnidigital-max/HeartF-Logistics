
import React, { useState } from 'react';
import { Vehicle, Lead, Opportunity, Invoice, Booking } from '../types';
import {
  TruckIcon,
  BriefcaseIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserPlusIcon,
  PlusIcon,
} from './icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AppSettings } from '../App';
import { useAuth, UserRole } from '../auth/AuthContext';
import AddBookingModal from './AddBookingModal';
import AddLeadModal from './AddLeadModal';
import AddGlobalExpenseModal from './AddGlobalExpenseModal';
import { useData } from '../contexts/DataContext';

type DashboardData = {
  vehicles: Vehicle[];
  leads: Lead[];
  opportunities: Opportunity[];
  invoices: Invoice[];
  bookings: Booking[];
};

type DashboardProps = {
  data: DashboardData;
  settings: AppSettings;
  userRole?: UserRole;
};

// Using shared StatCard (UiKit_new) for calmer, consistent stats
import { StatCard as UiStatCard } from './UiKit_new';

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'orange' | 'blue' | 'emerald' | 'indigo';
};

// Local thin wrapper to adapt existing usage to the new UiStatCard API
const StatCard: React.FC<StatCardProps> = ({ label, value, sublabel, icon }) => {
  return (
    <UiStatCard label={label} value={value} hint={sublabel} icon={<div className="text-slate-400">{React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}</div>} />
  );
};

type RevenueCardProps = {
  totalInvoiced: number;
  openInvoices: number;
  paidInvoices: number;
  currency: 'USD' | 'ZWL';
  isCustomer?: boolean;
};

const RevenueCard: React.FC<RevenueCardProps> = ({
  totalInvoiced,
  openInvoices,
  paidInvoices,
  currency,
  isCustomer,
}) => {
  const totalInvoices = openInvoices + paidInvoices;
  const paidRatio = totalInvoices ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(totalInvoiced || 0);

  return (
    <div className="relative flex flex-col justify-between rounded-2xl bg-slate-900 p-6 shadow-xl overflow-hidden min-w-0">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-500 rounded-full opacity-10 blur-3xl"></div>

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/10">
            <CurrencyDollarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              {isCustomer ? "Account Spend" : "Revenue Snapshot"}
            </p>
            <p className="text-xs text-slate-700">
              {isCustomer ? "Total across all bookings" : "Total invoiced this period"}
            </p>
          </div>
        </div>
        {totalInvoices > 0 && (
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
            {openInvoices} open
          </span>
        )}
      </div>

      <div className="mt-6 relative z-10">
        <p className="text-3xl font-bold tracking-tight text-white">
          {formattedTotal}
        </p>
        <div className="flex items-center gap-2 mt-1">
             <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <TrendingUpIcon className="w-3 h-3" />
                +8.2%
            </span>
            <span className="text-xs text-slate-700">vs last month</span>
        </div>
      </div>

      {totalInvoices > 0 && (
        <div className="mt-6 relative z-10">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Collection Rate</span>
            <span className="font-medium text-white">{paidRatio}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-400"
              style={{ width: `${paidRatio}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const getBookingStatusClass = (status: Booking['status']): string => {
  switch (status) {
    case 'draft': return 'bg-muted text-foreground/70 border border-border';
    case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'scheduled': return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'confirmed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'dispatched': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'in_transit': return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'delivered': return 'bg-slate-50 text-slate-700 border border-slate-200';
    case 'closed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'cancelled': return 'bg-rose-50 text-rose-700 border border-rose-200';
    default: return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};

const getBookingCounts = (bookings: Booking[]) => {
  const counts = {
    draft: 0,
    pending: 0,
    scheduled: 0,
    confirmed: 0,
    dispatched: 0,
    in_transit: 0,
    delivered: 0,
    closed: 0,
  };
  bookings.forEach(b => {
    if (b.status in counts) {
      counts[b.status] += 1 as any;
    }
  });
  const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
  return { ...counts, total };
};

const processRevenueTrendData = (invoices: Invoice[]) => {
  const dataByMonth: { [key: string]: number } = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  invoices.forEach(invoice => {
      const date = new Date(invoice.issue_date);
      if (isNaN(date.getTime())) return;
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!dataByMonth[key]) dataByMonth[key] = 0;
      dataByMonth[key] += invoice.total_amount;
  });

  const chartData = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      chartData.push({ name: monthNames[month], Revenue: dataByMonth[key] || 0 });
  }
  return chartData;
};

const processRevenueByCategoryData = (invoices: Invoice[]) => {
    const dataByCategory = invoices.reduce((acc, invoice) => {
        const type = invoice.invoice_type.charAt(0).toUpperCase() + invoice.invoice_type.slice(1);
        if (!acc[type]) acc[type] = 0;
        acc[type] += invoice.total_amount;
        return acc;
    }, {} as { [key: string]: number });
    return Object.entries(dataByCategory).map(([name, value]) => ({ name, value }));
};

const RevenueTrendChart = ({ invoices, currency, title }: { invoices: Invoice[], currency: 'USD' | 'ZWL', title?: string }) => {
  const data = processRevenueTrendData(invoices);
  const currencySymbol = currency === 'ZWL' ? 'Z$' : '$';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-200/60 h-80 flex flex-col min-w-0">
      <h3 className="text-sm font-bold text-slate-800 shrink-0 tracking-tight">{title || 'Trend (Last 6 Months)'}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(value) => `${currencySymbol}${(value as number / 1000)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '12px' }}
            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value)}
          />
          <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#4338ca' }} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const RevenueByCategoryChart = ({ invoices, currency, title }: { invoices: Invoice[], currency: 'USD' | 'ZWL', title?: string }) => {
    const data = processRevenueByCategoryData(invoices);
    const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];

    return (
        <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-200/60 h-80 flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-800 shrink-0 tracking-tight">{title || 'Spend by Type'}</h3>
            <div className="flex-1 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            innerRadius={60}
                            dataKey="value"
                            paddingAngle={5}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '12px' }}
                            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value)}
                        />
                        <Legend 
                            iconSize={8} 
                            iconType="circle"
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            wrapperStyle={{ fontSize: "11px", color: "#64748b" }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DashboardHeader: React.FC<{ user: any }> = ({ user }) => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return (
        <div className="relative rounded-2xl bg-linear-to-r from-indigo-900 to-slate-900 p-6 shadow-lg overflow-hidden text-white mb-6">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
            <div className="relative z-10">
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">{date}</p>
                <h1 className="text-2xl font-bold">Good afternoon, {user?.name.split(' ')[0] || 'User'}</h1>
                <p className="text-slate-300 text-sm mt-1 max-w-md">Here's what's happening with your logistics operations today.</p>
            </div>
        </div>
    );
}

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all duration-200 text-sm font-medium text-slate-700"
    >
        {icon}
        <span>{label}</span>
    </button>
)

const Dashboard: React.FC<DashboardProps> = ({ data, settings, userRole }) => {
  const { user } = useAuth();
  const { addBooking, addLead, addExpense } = useData(); // Needed for handlers
  
  // Modal States for Quick Actions
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const { vehicles, leads, opportunities, invoices, bookings } = data;
  const isCustomer = userRole === 'customer';

  const totalVehicles = vehicles?.length || 0;
  const totalLeads = leads?.length || 0;
  const totalOpps = opportunities?.length || 0;

  const activeBookings = bookings?.filter((b) => ['pending', 'confirmed', 'in_transit'].includes(b.status)) || [];
  const activeBookingsCount = activeBookings.length;

  const openInvoices = invoices?.filter((inv) => !['paid', 'refunded', 'cancelled'].includes(inv.status)) || [];
  const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || [];
  const bookingCounts = getBookingCounts(bookings || []);
  const utilizationPct = totalVehicles > 0 ? Math.round((vehicles.filter(v => v.status === 'active').length / totalVehicles) * 100) : 0;
  const revenuePaid = invoices?.reduce((sum: number, inv: Invoice) => sum + (inv.status === 'paid' || inv.status === 'partial' ? inv.amount_paid : 0), 0) || 0;
  const revenueOutstanding = invoices?.reduce((sum: number, inv: Invoice) => {
    if (['paid', 'refunded', 'cancelled'].includes(inv.status)) return sum;
    return sum + Math.max(inv.total_amount - (inv.amount_paid || 0), 0);
  }, 0) || 0;
  const revenueTotal = revenuePaid + revenueOutstanding;
  const revenueCustomers = invoices ? new Set(invoices.map(i => i.customer_id)).size : 0;

  const invoicedAmount = invoices?.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0) || 0;

  // Recent items filtering
  const recentLeads = [...(leads || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
  const recentBookings = [...(bookings || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  return (
    <div className="pb-10">
      <DashboardHeader user={user} />

      {/* Quick Actions Toolbar */}
      {!isCustomer && (
          <div className="flex flex-wrap gap-4 mb-10">
              <QuickAction icon={<DocumentTextIcon className="w-4 h-4"/>} label="New Booking" onClick={() => setIsBookingModalOpen(true)} />
              <QuickAction icon={<UserPlusIcon className="w-4 h-4"/>} label="Add Lead" onClick={() => setIsLeadModalOpen(true)} />
              <QuickAction icon={<PlusIcon className="w-4 h-4"/>} label="Record Expense" onClick={() => setIsExpenseModalOpen(true)} />
          </div>
      )}
      {isCustomer && (
          <div className="flex flex-wrap gap-4 mb-10">
              <QuickAction icon={<PlusIcon className="w-4 h-4"/>} label="Request Booking" onClick={() => setIsBookingModalOpen(true)} />
          </div>
      )}

      <div className="space-y-10">
        {/* Operations Pulse */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-7 space-y-6 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Operations Pulse</p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Fleet + Bookings Snapshot</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">Live</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Fleet Utilization</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{utilizationPct}%</p>
                <p className="text-xs text-slate-700">1 in maintenance</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Pending Bookings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{bookingCounts.pending}</p>
                <p className="text-xs text-slate-700">Awaiting confirmation</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Out of Service</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{vehicles.filter(v => v.status === 'out_of_service').length}</p>
                <p className="text-xs text-slate-700">Requires attention</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Bookings pipeline</h3>
                  <span className="text-xs text-slate-700">{bookingCounts.total} bookings</span>
                </div>
                {[
                  { label: 'Pending', key: 'pending', color: 'bg-slate-900' },
                  { label: 'Confirmed', key: 'confirmed', color: 'bg-orange-500' },
                  { label: 'In transit', key: 'in_transit', color: 'bg-sky-500' },
                  { label: 'Delivered', key: 'delivered', color: 'bg-emerald-500' },
                ].map((row) => {
                  const value = bookingCounts[row.key as keyof typeof bookingCounts] as number;
                  const percent = bookingCounts.total ? Math.round((value / bookingCounts.total) * 100) : 0;
                  return (
                    <div key={row.key} className="space-y-1 mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{row.label}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                        <div className={`h-full ${row.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Revenue pulse</h3>
                  <span className="text-xs text-slate-500">Currency: {settings.currency}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Paid', value: revenuePaid },
                    { label: 'Outstanding', value: revenueOutstanding },
                    { label: 'Total', value: revenueTotal },
                    { label: 'Customers', value: revenueCustomers },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                      <p className="text-base font-bold text-slate-900 mt-1 leading-tight wrap-break-word">
                        {typeof item.value === 'number' && item.label !== 'Customers'
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).format(item.value)
                          : item.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Bookings</p>
                <h2 className="text-lg font-bold text-slate-900">Latest moves</h2>
              </div>
              <button className="text-xs font-semibold text-orange-700 hover:text-orange-800" onClick={() => setIsBookingModalOpen(true)}>View all</button>
            </div>
            <div className="space-y-3">
              {recentBookings.length === 0 && (
                <div className="text-sm text-slate-500">No bookings captured yet.</div>
              )}
              {recentBookings.map((booking) => {
                const statusClass = getBookingStatusClass(booking.status);
                return (
                  <div key={booking.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{booking.booking_number}</p>
                      <p className="text-xs text-slate-500 truncate">{`${booking.pickup_city} -> ${booking.delivery_city}`}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize shrink-0 ${statusClass}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top stats */}
        <section className={`grid gap-6 ${isCustomer ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
            {!isCustomer && (
                <StatCard
                label="Fleet Size"
                value={totalVehicles}
                trend={5}
                sublabel="Vehicles active"
                icon={<TruckIcon className="h-5 w-5" />}
                color="blue"
                />
            )}
            <StatCard
            label={isCustomer ? "Active Bookings" : "Active Jobs"}
            value={activeBookingsCount}
            trend={12}
            trendLabel="vs last week"
            sublabel="In progress"
            icon={<DocumentTextIcon className="h-5 w-5" />}
            color="orange"
            />
            <StatCard
            label="Open Invoices"
            value={openInvoices.length}
            sublabel={`Pending payment`}
            icon={<CreditCardIcon className="h-5 w-5" />}
            color="indigo"
            />
            <StatCard
            label={isCustomer ? "Requests" : "Opportunities"}
            value={totalOpps}
            trend={8}
            sublabel="Pipeline"
            icon={<BriefcaseIcon className="h-5 w-5" />}
            color="emerald"
            />
        </section>

        {/* Revenue summary */}
        {settings.showFinancialSummary && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <section className="xl:col-span-1">
                    <RevenueCard
                    totalInvoiced={invoicedAmount}
                    openInvoices={openInvoices.length}
                    paidInvoices={paidInvoices.length}
                    currency={settings.currency}
                    isCustomer={isCustomer}
                    />
                </section>
                
                <section className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                    <RevenueTrendChart 
                        invoices={invoices || []} 
                        currency={settings.currency} 
                        title={isCustomer ? "Spend Trend" : "Revenue Trend"}
                    />
                    <RevenueByCategoryChart 
                        invoices={invoices || []} 
                        currency={settings.currency} 
                        title={isCustomer ? "Spend Breakdown" : "Revenue by Source"}
                    />
                </section>
            </div>
        )}

        {/* Recent activity */}
        <section className={`grid gap-6 ${isCustomer ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
            {/* Leads - HIDDEN FOR CUSTOMERS */}
            {!isCustomer && (
                <div className="rounded-2xl bg-white shadow-md border border-slate-200/60 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/30">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Leads</h2>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{totalLeads} total</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentLeads.length === 0 && (
                        <div className="px-6 py-8 text-center text-sm text-slate-500">No leads captured yet.</div>
                        )}
                        {recentLeads.map((lead) => {
                        const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name;
                        const initials = (lead.first_name?.[0] || '') + (lead.last_name?.[0] || '');
                        const safeInitials = initials || name?.[0] || '?';

                        return (
                            <div key={lead.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 border border-indigo-100 shrink-0">
                                    {safeInitials.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                                    <p className="text-xs text-slate-500 truncate">{lead.company_name}</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium capitalize text-slate-600 shadow-sm shrink-0">
                                    {lead.lead_status.replace('_', ' ')}
                                </span>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}

            {/* Bookings - show here only for customers to avoid duplication */}
            {isCustomer && (
                <div className="rounded-2xl bg-white shadow-md border border-slate-200/60 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/30">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Bookings</h2>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{bookings?.length || 0} total</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentBookings.length === 0 && (
                        <div className="px-6 py-8 text-center text-sm text-slate-500">No bookings captured yet.</div>
                        )}
                        {recentBookings.map((booking) => {
                            // Use ASCII arrow to avoid rendering issues in some fonts
                            const route = `${booking.pickup_city} -> ${booking.delivery_city}`;
                            const statusClass = getBookingStatusClass(booking.status);

                            return (
                                <div key={booking.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{booking.booking_number}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <TruckIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                            <p className="text-xs text-slate-500 truncate">{route}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize shrink-0 ${statusClass}`}>
                                        {booking.status.replace('_', ' ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
      </div>

        {/* Quick Action Modals */}
        {isBookingModalOpen && (
            <AddBookingModal 
                onClose={() => setIsBookingModalOpen(false)}
                onAddBooking={(b) => { addBooking({...b, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); setIsBookingModalOpen(false); }}
            />
        )}
        {isLeadModalOpen && (
            <AddLeadModal 
                onClose={() => setIsLeadModalOpen(false)}
                onAddLead={(l) => { addLead({...l, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), lead_score: 0}); setIsLeadModalOpen(false); }}
            />
        )}
        {isExpenseModalOpen && (
            <AddGlobalExpenseModal 
                onClose={() => setIsExpenseModalOpen(false)}
                onAddExpense={(e) => { addExpense({...e, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), recorded_by: 1, amount_in_base_currency: e.amount }); setIsExpenseModalOpen(false); }}
            />
        )}
    </div>
  );
};

export default Dashboard;
