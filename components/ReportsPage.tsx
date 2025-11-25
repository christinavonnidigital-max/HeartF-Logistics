
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ShellCard, SubtleCard } from './UiKit';
import { Vehicle, VehicleMaintenance, VehicleExpense, Lead, Opportunity, Invoice, Expense, User, VehicleStatus, InvoiceStatus, OpportunityStage } from '../types';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area
} from 'recharts';
import { DownloadIcon, TruckIcon, CreditCardIcon, BriefcaseIcon } from './icons/Icons';

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

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubtleCard className="p-4 flex flex-col">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700">Maintenance Costs (Top Vehicles)</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={maintenanceCosts} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 10 }} stroke="#94a3b8"/>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} 
                                />
                                <Bar dataKey="Cost" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SubtleCard>
                <SubtleCard className="p-4 flex flex-col">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700">Fleet Status Distribution</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={statusDistribution} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{fontSize: "12px"}} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </SubtleCard>
            </div>
            <SubtleCard className="p-0 overflow-hidden">
                 <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-700">Vehicle Expense Summary</h3>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="min-w-full text-sm">
                         <thead className="text-xs uppercase text-slate-500 bg-slate-50">
                             <tr>
                                 <th className="px-4 py-3 text-left font-medium">Registration</th>
                                 <th className="px-4 py-3 text-left font-medium">Make/Model</th>
                                 <th className="px-4 py-3 text-left font-medium">Status</th>
                                 <th className="px-4 py-3 text-right font-medium">Current KM</th>
                                 <th className="px-4 py-3 text-right font-medium">Total Expenses</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {fleetSummary.map(v => (
                                 <tr key={v.id} className="hover:bg-slate-50/50">
                                     <td className="px-4 py-3 font-medium text-slate-900">{v.registration_number}</td>
                                     <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                                     <td className="px-4 py-3 capitalize text-slate-600">{v.status.replace(/_/g, ' ')}</td>
                                     <td className="px-4 py-3 text-right text-slate-600">{v.current_km.toLocaleString()}</td>
                                     <td className="px-4 py-3 text-right font-medium text-slate-900">{v.totalExpenses.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SubtleCard className="p-4 border-l-4 border-emerald-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}</p>
                </SubtleCard>
                <SubtleCard className="p-4 border-l-4 border-rose-500">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}</p>
                </SubtleCard>
                <SubtleCard className={`p-4 border-l-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-amber-500'}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Net Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netProfit)}</p>
                </SubtleCard>
            </div>

            <SubtleCard className="p-6 flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold mb-6 text-slate-700">Revenue vs Expenses (6 Months)</h3>
                <div className="flex-1">
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
                    <h3 className="text-sm font-semibold mb-4 text-slate-700">Opportunity Pipeline</h3>
                    <div className="flex-1 min-h-[300px]">
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
                    </div>
                </SubtleCard>
                
                <SubtleCard className="p-4 flex flex-col">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700">Lead Sources</h3>
                    <div className="flex-1 min-h-[300px]">
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
                    </div>
                </SubtleCard>
            </div>
        </div>
    );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('fleet');

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    let dataToExport: any[] = [];
    let fileName = 'report';

    if (activeTab === 'fleet') {
        dataToExport = data.fleet.vehicles.map(v => ({
            Registration: v.registration_number,
            Make: v.make,
            Model: v.model,
            Status: v.status,
            'Current KM': v.current_km,
            'Next Service': v.next_service_due_km
        }));
        fileName = 'fleet_report';
    } else if (activeTab === 'financials') {
        dataToExport = data.financials.invoices.map(i => ({
            'Invoice #': i.invoice_number,
            Date: i.issue_date,
            Total: i.total_amount,
            Status: i.status,
            Customer: i.customer_id
        }));
        fileName = 'financial_report';
    } else if (activeTab === 'sales') {
        dataToExport = data.crm.leads.map(l => ({
            Name: `${l.first_name} ${l.last_name}`,
            Company: l.company_name,
            Status: l.lead_status,
            Source: l.lead_source,
            Score: l.lead_score
        }));
        fileName = 'sales_report';
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <ShellCard className="flex flex-col min-h-[80vh]">
      {/* Unified Toolbar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-t-2xl">
        {/* Segmented Control */}
        <div className="flex p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            <button
                onClick={() => setActiveTab('fleet')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'fleet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <div className="flex items-center gap-2">
                    <TruckIcon className="w-4 h-4" />
                    <span>Fleet Efficiency</span>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('financials')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'financials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" />
                    <span>Financials</span>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>Sales Pipeline</span>
                </div>
            </button>
        </div>

        {/* Actions */}
        <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition shadow-sm"
        >
            <DownloadIcon className="w-4 h-4" />
            <span>Export Report</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 bg-slate-50/30">
        {activeTab === 'fleet' && <FleetReport fleetData={data.fleet} />}
        {activeTab === 'financials' && <FinancialsReport financialsData={data.financials} />}
        {activeTab === 'sales' && <SalesReport crmData={data.crm} />}
      </div>
    </ShellCard>
  );
};

export default ReportsPage;
