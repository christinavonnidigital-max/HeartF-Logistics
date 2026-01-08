
import React, { useState, useMemo } from 'react';
import writeXlsxFile from 'write-excel-file';
import { ShellCard, SubtleCard, Button } from './UiKit';
import { Vehicle, VehicleMaintenance, VehicleExpense, Lead, Opportunity, Invoice, Expense, User, VehicleStatus, InvoiceStatus, OpportunityStage } from '../types';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area
} from 'recharts';
import { DownloadIcon, TruckIcon, CreditCardIcon, BriefcaseIcon } from './icons';

class ReportsErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: any) {
        // eslint-disable-next-line no-console
        console.error('Reports render error:', error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">Reports failed to render</p>
                        <p className="text-xs text-red-600 mt-1">{this.state.error.message}</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

interface ReportsPageProps {
  data: {
    fleet: { vehicles: Vehicle[], maintenance: VehicleMaintenance[], expenses: VehicleExpense[] };
    crm: { leads: Lead[], opportunities: Opportunity[], salesReps: User[] };
    financials: { invoices: Invoice[], expenses: Expense[] };
  }
}

type ReportTab = 'fleet' | 'financials' | 'sales';

const FleetReport: React.FC<{ fleetData: ReportsPageProps['data']['fleet'] }> = ({ fleetData }) => {
    const maintenanceCosts = useMemo(() => {
        const costs: { [key: number]: number } = {};
        fleetData.maintenance.forEach(m => {
            costs[m.vehicle_id] = (costs[m.vehicle_id] || 0) + m.cost;
        });
        return fleetData.vehicles.map(v => ({
            name: v.registration_number,
            Cost: costs[v.id] || 0,
        })).filter(i => i.Cost > 0).slice(0, 10);
    }, [fleetData]);

    const statusDistribution = useMemo(() => {
        const counts = fleetData.vehicles.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
        }, {} as { [key in VehicleStatus]: number });
        return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    }, [fleetData]);

    const fleetSummary = useMemo(() => {
        return fleetData.vehicles.map(v => {
            const totalExpenses = fleetData.expenses
                .filter(e => e.vehicle_id === v.id)
                .reduce((sum, e) => sum + e.amount, 0);
            return { ...v, totalExpenses };
        });
    }, [fleetData]);

    const totalVehicles = fleetData.vehicles.length;
    const activeCount = fleetData.vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
    const maintenanceCount = fleetData.vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
    const oosCount = fleetData.vehicles.filter(v => v.status === VehicleStatus.OUT_OF_SERVICE).length;
    const totalMaintenanceSpend = fleetData.maintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalVehicleExpenses = fleetData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgCostPerVehicle = totalVehicles ? totalVehicleExpenses / totalVehicles : 0;

    const topExpenseVehicles = useMemo(() => {
        return [...fleetSummary]
            .sort((a, b) => (b.totalExpenses || 0) - (a.totalExpenses || 0))
            .slice(0, 6)
            .map(v => ({
                name: v.registration_number,
                Expenses: Math.round(v.totalExpenses || 0),
            }));
    }, [fleetSummary]);

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SubtleCard className="p-4 border-l-4 border-info-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Total Vehicles</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalVehicles}</p>
                    <p className="text-xs text-foreground-muted mt-1">Active: {activeCount}</p>
                </SubtleCard>
                <SubtleCard className="p-4 border-l-4 border-success-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">In Maintenance</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{maintenanceCount}</p>
                    <p className="text-xs text-foreground-muted mt-1">Out of service: {oosCount}</p>
                </SubtleCard>
                <SubtleCard className="p-4 border-l-4 border-warning-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Maintenance Spend (YTD)</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalMaintenanceSpend)}
                    </p>
                </SubtleCard>
                <SubtleCard className="p-4 border-l-4 border-primary-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Avg Cost per Vehicle</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(avgCostPerVehicle)}
                    </p>
                </SubtleCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubtleCard className="p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Fleet Status</h3>
                    </div>
                    <div className="flex-1 min-h-60">
                        {statusDistribution.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-foreground-muted">No vehicles recorded yet.</p>
                        )}
                    </div>
                </SubtleCard>

                <SubtleCard className="p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Top Maintenance Costs</h3>
                    </div>
                    <div className="flex-1 min-h-60">
                        {maintenanceCosts.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={maintenanceCosts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                                    />
                                    <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-foreground-muted">No maintenance costs captured yet.</p>
                        )}
                    </div>
                </SubtleCard>
            </div>

            <SubtleCard className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Operating Cost by Vehicle</h3>
                </div>
                <div className="flex-1 min-h-60">
                    {topExpenseVehicles.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={topExpenseVehicles} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                                />
                                <Bar dataKey="Expenses" barSize={28} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="Expenses" stroke="#10B981" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-foreground-muted">No vehicle expenses captured yet.</p>
                    )}
                </div>
            </SubtleCard>
        </div>
    );
};

const FinancialsReport: React.FC<{ financialsData: ReportsPageProps['data']['financials'] }> = ({ financialsData }) => {
    const monthlyPerformance = useMemo(() => {
        const data: { [key: string]: { Revenue: number, Expenses: number }} = {};
        const processDate = (dateStr: string) => new Date(dateStr).toLocaleString('default', { month: 'short' });
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleString('default', { month: 'short' });
            data[month] = { Revenue: 0, Expenses: 0 };
        }

        financialsData.invoices.forEach(inv => {
            if(inv.issue_date) {
                const month = processDate(inv.issue_date);
                if (data[month]) data[month].Revenue += inv.total_amount;
            }
        });
        financialsData.expenses.forEach(exp => {
            if (exp.expense_date) {
                const month = processDate(exp.expense_date);
                if (data[month]) data[month].Expenses += exp.amount_in_base_currency;
            }
        });

        return Object.entries(data).map(([name, values]) => ({ name, ...values }));
    }, [financialsData]);

    const totalRevenue = financialsData.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalExpenses = financialsData.expenses.reduce((sum, exp) => sum + exp.amount_in_base_currency, 0);
    const netProfit = totalRevenue - totalExpenses;
    const hasFinancialData = financialsData.invoices.length + financialsData.expenses.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SubtleCard className="p-4 border-l-4 border-success-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}</p>
                </SubtleCard>
                <SubtleCard className="p-4 border-l-4 border-danger-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Total Expenses</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}</p>
                </SubtleCard>
                <SubtleCard className={`p-4 border-l-4 ${netProfit >= 0 ? 'border-info-500' : 'border-warn-500'}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Net Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-info-700' : 'text-warn-700'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netProfit)}</p>
                </SubtleCard>
            </div>

            <SubtleCard className="p-6 flex flex-col h-100">
                <h3 className="text-sm font-semibold mb-6 text-foreground">Revenue vs Expenses (6 Months)</h3>
                <div className="flex-1">
                    {hasFinancialData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="Revenue" barSize={20} fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" barSize={20} fill="#F43F5E" radius={[4, 4, 0, 0]} />
                                <Area type="monotone" dataKey="Revenue" fill="none" stroke="#10B981" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-foreground-muted">No invoices or expenses recorded yet.</p>
                    )}
                </div>
            </SubtleCard>
        </div>
    );
};

const SalesReport: React.FC<{ crmData: ReportsPageProps['data']['crm'] }> = ({ crmData }) => {
    const funnelData = useMemo(() => {
        const stages = [OpportunityStage.PROSPECTING, OpportunityStage.QUALIFICATION, OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION, OpportunityStage.CLOSED_WON];
        return stages.map(stage => ({
            name: stage.replace(/_/g, ' '),
            value: crmData.opportunities.filter(o => o.stage === stage).length,
            fill: stage === OpportunityStage.CLOSED_WON ? '#10B981' : '#6366f1'
        })).filter(d => d.value > 0);
    }, [crmData]);

    const leadSourceData = useMemo(() => {
        const sources = crmData.leads.reduce((acc, lead) => {
            acc[lead.lead_source] = (acc[lead.lead_source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(sources).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    }, [crmData]);

    const COLORS = ['#818CF8', '#34D399', '#FBBF24', '#F472B6', '#60A5FA'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubtleCard className="p-4 flex flex-col">
                    <h3 className="text-sm font-semibold mb-4 text-foreground">Opportunity Pipeline</h3>
                    <div className="flex-1 min-h-75">
                        {funnelData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} stroke="#64748b" />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-foreground-muted">No opportunities recorded yet.</p>
                        )}
                    </div>
                </SubtleCard>
                
                <SubtleCard className="p-4 flex flex-col">
                    <h3 className="text-sm font-semibold mb-4 text-foreground">Lead Sources</h3>
                    <div className="flex-1 min-h-75">
                        {leadSourceData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={leadSourceData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5}
                                    >
                                        {leadSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{fontSize: "12px"}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-foreground-muted">No leads captured yet.</p>
                        )}
                    </div>
                </SubtleCard>
            </div>
        </div>
    );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('fleet');

  const fleetData = useMemo(() => ({
    vehicles: data?.fleet?.vehicles || [],
    maintenance: data?.fleet?.maintenance || [],
    expenses: data?.fleet?.expenses || [],
  }), [data]);

  const financialsData = useMemo(() => ({
    invoices: data?.financials?.invoices || [],
    expenses: data?.financials?.expenses || [],
  }), [data]);

  const salesData = useMemo(() => ({
    leads: data?.crm?.leads || [],
    opportunities: data?.crm?.opportunities || [],
    salesReps: data?.crm?.salesReps || [],
  }), [data]);

  const hasAnyData = (fleetData.vehicles.length + fleetData.maintenance.length + fleetData.expenses.length +
    financialsData.invoices.length + financialsData.expenses.length +
    salesData.leads.length + salesData.opportunities.length) > 0;

  const handleExport = () => {
    type Column<T> = { header: string; getValue: (item: T) => string | number | boolean | Date | null };

    let columns: Column<any>[] = [];
    let dataset: any[] = [];
    let fileName = 'report';

    if (activeTab === 'fleet') {
        columns = [
            { header: 'Registration', getValue: (v) => v.registration_number },
            { header: 'Make', getValue: (v) => v.make },
            { header: 'Model', getValue: (v) => v.model },
            { header: 'Status', getValue: (v) => v.status },
            { header: 'Current KM', getValue: (v) => v.current_km },
            { header: 'Next Service', getValue: (v) => v.next_service_due_km }
        ];
        dataset = data.fleet.vehicles;
        fileName = 'fleet_report';
    } else if (activeTab === 'financials') {
        columns = [
            { header: 'Invoice #', getValue: (i) => i.invoice_number },
            { header: 'Date', getValue: (i) => i.issue_date },
            { header: 'Total', getValue: (i) => i.total_amount },
            { header: 'Status', getValue: (i) => i.status },
            { header: 'Customer', getValue: (i) => i.customer_id }
        ];
        dataset = data.financials.invoices;
        fileName = 'financial_report';
    } else if (activeTab === 'sales') {
        columns = [
            { header: 'Name', getValue: (l) => `${l.first_name} ${l.last_name}`.trim() },
            { header: 'Company', getValue: (l) => l.company_name },
            { header: 'Status', getValue: (l) => l.lead_status },
            { header: 'Source', getValue: (l) => l.lead_source },
            { header: 'Score', getValue: (l) => l.lead_score }
        ];
        dataset = data.crm.leads;
        fileName = 'sales_report';
    }

    const headerRow = columns.map(col => ({ value: col.header, fontWeight: 'bold' as const }));
    const dataRows = dataset.map(item => columns.map(col => ({ value: col.getValue(item) ?? '' })));

    const sheetData = [headerRow, ...dataRows];

    void writeXlsxFile(sheetData, {
        fileName: `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`
    });
  };

  return (
    <ShellCard className="flex flex-col min-h-[80vh]">
      {/* Unified Toolbar Header */}
    <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 rounded-t-2xl">
        {/* Segmented Control */}
        <div className="flex p-1 bg-muted rounded-lg self-start sm:self-auto">
            <button
                onClick={() => setActiveTab('fleet')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'fleet' ? 'bg-card text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
            >
                <div className="flex items-center gap-2">
                    <TruckIcon className="w-4 h-4" />
                    <span>Fleet Efficiency</span>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('financials')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'financials' ? 'bg-card text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
            >
                <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" />
                    <span>Financials</span>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-card text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
            >
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>Sales Pipeline</span>
                </div>
            </button>
        </div>

        {/* Actions */}
        <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            <span>Export Report</span>
        </Button>
      </div>

      {/* Content Area */}
    <ReportsErrorBoundary>
        <div className="p-6 flex-1 bg-muted/30">
            {!hasAnyData && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 mb-6">
                    <p className="text-base font-semibold text-slate-800">No data to report yet</p>
                    <p className="text-sm mt-1">Add vehicles, financials, or CRM activity to see charts here.</p>
                </div>
            )}
            {activeTab === 'fleet' && <FleetReport fleetData={fleetData} />}
            {activeTab === 'financials' && <FinancialsReport financialsData={financialsData} />}
            {activeTab === 'sales' && <SalesReport crmData={salesData} />}
          </div>
    </ReportsErrorBoundary>
    </ShellCard>
  );
};

export default ReportsPage;
