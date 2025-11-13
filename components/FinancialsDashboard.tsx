import React from 'react';
import { mockInvoices, mockAllExpenses } from '../data/mockFinancialsData';
import InvoiceList from './InvoiceList';
import ExpenseList from './ExpenseList';
import { InvoiceStatus } from '../types';
import { DollarIcon } from './icons/Icons';

const FinancialsDashboard: React.FC = () => {
    const totalRevenue = mockInvoices
        .filter(inv => inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.PARTIAL)
        .reduce((sum, inv) => sum + inv.amount_paid, 0);

    const totalExpenses = mockAllExpenses.reduce((sum, exp) => sum + exp.amount_in_base_currency, 0);
    
    const netProfit = totalRevenue - totalExpenses;

    const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <h3 className="text-gray-500 text-lg">{title}</h3>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Revenue (Paid)" 
                    value={`$${totalRevenue.toLocaleString()}`} 
                    icon={<DollarIcon className="w-6 h-6" />}
                />
                <StatCard 
                    title="Total Expenses" 
                    value={`$${totalExpenses.toLocaleString()}`}
                    icon={<DollarIcon className="w-6 h-6 text-red-500" />}
                />
                <StatCard 
                    title="Net Profit" 
                    value={`$${netProfit.toLocaleString()}`}
                    icon={<DollarIcon className={`w-6 h-6 ${netProfit > 0 ? 'text-green-500' : 'text-red-500'}`} />}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <InvoiceList invoices={mockInvoices} />
                 <ExpenseList expenses={mockAllExpenses} />
            </div>
        </div>
    );
};

export default FinancialsDashboard;