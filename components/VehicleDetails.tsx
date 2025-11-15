import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleExpense, ExpenseType, Currency } from '../types';
import { mockMaintenance } from '../data/mockData';
import { CogIcon, CurrencyDollarIcon, GaugeIcon, PlusIcon, RoadIcon, WrenchIcon, FuelIcon, ShieldCheckIcon, ClipboardDocumentIcon, TicketIcon, DocumentDuplicateIcon } from './icons/Icons';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <button className="bg-gray-50 p-4 rounded-lg flex items-center text-left w-full hover:bg-gray-100 transition" onClick={() => alert(`Viewing details for ${label}`)}>
    <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </button>
);

const getExpenseTypeUI = (type: ExpenseType) => {
    switch(type) {
        case ExpenseType.FUEL:
            return { icon: <FuelIcon className="w-5 h-5" />, color: 'text-red-600', bgColor: 'bg-red-100' };
        case ExpenseType.MAINTENANCE:
            return { icon: <WrenchIcon className="w-5 h-5" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        case ExpenseType.INSURANCE:
            return { icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-100' };
        case ExpenseType.LICENSE:
            return { icon: <ClipboardDocumentIcon className="w-5 h-5" />, color: 'text-indigo-600', bgColor: 'bg-indigo-100' };
        case ExpenseType.TOLLS:
        case ExpenseType.PARKING:
            return { icon: <TicketIcon className="w-5 h-5" />, color: 'text-purple-600', bgColor: 'bg-purple-100' };
        case ExpenseType.OTHER:
        default:
            return { icon: <DocumentDuplicateIcon className="w-5 h-5" />, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
}


const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, expenses, onAddExpenseClick }) => {
  const [filterType, setFilterType] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const maintenanceHistory = mockMaintenance.filter((m) => m.vehicle_id === vehicle.id);
  
  const filteredExpenses = useMemo(() => {
    const expenseHistory = expenses.filter((e) => e.vehicle_id === vehicle.id);

    if (filterType === 'all') {
      return expenseHistory;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenseHistory.filter(expense => {
      // Append T00:00:00 to parse date string in local timezone
      const expenseDate = new Date(expense.expense_date + 'T00:00:00');

      switch (filterType) {
        case '7days': {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return expenseDate >= sevenDaysAgo;
        }
        case '30days': {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return expenseDate >= thirtyDaysAgo;
        }
        case 'thisMonth': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return expenseDate >= startOfMonth;
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) return false;
          const start = new Date(customStartDate + 'T00:00:00');
          const end = new Date(customEndDate + 'T00:00:00');
          return expenseDate >= start && expenseDate <= end;
        }
        default:
          return true;
      }
    });
  }, [expenses, vehicle.id, filterType, customStartDate, customEndDate]);

  const expenseTotalByCurrency = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
        const currency = expense.currency;
        if (!acc[currency]) {
            acc[currency] = 0;
        }
        acc[currency] += expense.amount;
        return acc;
    }, {} as Record<Currency, number>);
  }, [filteredExpenses]);


  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-y-auto">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
        <p className="mt-1 text-md text-gray-500">{vehicle.registration_number}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-6 h-6"/>} label="Current KM" value={vehicle.current_km.toLocaleString()} />
        <StatCard icon={<GaugeIcon className="w-6 h-6"/>} label="Capacity" value={`${vehicle.capacity_tonnes} t`} />
        <StatCard icon={<WrenchIcon className="w-6 h-6"/>} label="Next Service" value={`${vehicle.next_service_due_km.toLocaleString()} km`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><CogIcon className="w-5 h-5 mr-2 text-gray-500"/>Maintenance</h4>
          <div className="space-y-3">
            {maintenanceHistory.length > 0 ? maintenanceHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{item.description}</p>
                <p className="text-sm text-gray-500">{new Date(item.service_date).toLocaleDateString()} - ${item.cost}</p>
              </div>
            )) : <p className="text-sm text-gray-500 p-3">No maintenance records.</p>}
          </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold flex items-center"><CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500"/>Expenses</h4>
                <button
                    onClick={onAddExpenseClick}
                    className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                    aria-label="Add Expense"
                >
                    <PlusIcon className="w-4 h-4"/>
                </button>
            </div>
             <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom Range</option>
                </select>
                {filterType === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap">
                         <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                         />
                         <span>to</span>
                         <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                         />
                    </div>
                )}
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
              <h5 className="font-semibold text-gray-700 mb-1">Total for Period</h5>
              {Object.keys(expenseTotalByCurrency).length > 0 ? (
                  Object.entries(expenseTotalByCurrency).map(([currency, total]) => (
                      <p key={currency} className="text-lg font-bold text-gray-900">
                          {total.toLocaleString(undefined, { style: 'currency', currency: currency, minimumFractionDigits: 2 })}
                      </p>
                  ))
              ) : (
                  <p className="text-gray-500 italic">No expenses in this period.</p>
              )}
            </div>
           <div className="space-y-3 mt-4">
            {filteredExpenses.length > 0 ? filteredExpenses.map((item) => {
                const ui = getExpenseTypeUI(item.expense_type);
                return (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-4">
                        <div className={`flex-shrink-0 p-2 rounded-full ${ui.bgColor} ${ui.color}`}>
                            {ui.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                              <p className="font-semibold capitalize">{item.expense_type.replace('_', ' ')}</p>
                              <p className="font-bold text-gray-800">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} {item.currency}</p>
                          </div>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(item.expense_date + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                    </div>
                )
            }) : <p className="text-sm text-gray-500 p-3 italic">No expense records for the selected period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;