
import React from 'react';
import { Expense } from '../types';
import { PlusIcon, DocumentDuplicateIcon } from './icons';
import { ShellCard, SectionHeader } from './UiKit';


interface ExpenseListProps {
  expenses: Expense[];
  onAddExpenseClick: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onAddExpenseClick }) => {
  const formatDateGB = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Harare' });
  };

  const formatMoneyZW = (value: number, currency: string) =>
    new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value || 0);

  return (
    <ShellCard className="p-4">
      <SectionHeader
        title="Recent Expenses"
        subtitle="Operating costs across Zimbabwe and regional routes"
        actions={
           <button 
            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition shrink-0"
            onClick={onAddExpenseClick}
            aria-label="Add new expense"
          >
            <PlusIcon className="w-5 h-5"/>
          </button>
        }
      />
      <div className="mt-2 overflow-x-auto">
        <div className="sm:hidden space-y-2">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{expense.expense_type}</div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatMoneyZW(expense.amount, expense.currency)}
                </div>
              </div>
              <div className="text-xs text-slate-500">{expense.description}</div>
              <div className="text-xs text-slate-500 mt-1">{formatDateGB(expense.expense_date)}</div>
            </div>
          ))}
        </div>
        <table className="min-w-full text-left text-sm hidden sm:table">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2">Category</th>
              <th scope="col" className="px-3 py-2">Description</th>
              <th scope="col" className="px-3 py-2">Date</th>
              <th scope="col" className="px-3 py-2 text-right">Amount</th>
              <th scope="col" className="px-3 py-2 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap capitalize">
                    {expense.expense_category.replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-3 text-slate-600">{expense.description}</td>
                <td className="px-3 py-3 text-slate-600">{formatDateGB(expense.expense_date)}</td>
                <td className="px-3 py-3 text-slate-800 font-medium text-right">{formatMoneyZW(expense.amount_in_base_currency, 'USD')}</td>
                <td className="px-3 py-3 text-center">
                    {expense.receipt_url ? (
                    <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 inline-block" aria-label="View receipt">
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
             {expenses.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                       No expenses recorded.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </ShellCard>
  );
};

export default ExpenseList;
