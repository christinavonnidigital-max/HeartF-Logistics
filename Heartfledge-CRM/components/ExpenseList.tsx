
import React from 'react';
import { Expense } from '../types';
import { PlusIcon, DocumentDuplicateIcon } from './icons/Icons';
import { ShellCard, SectionHeader } from './UiKit';


interface ExpenseListProps {
  expenses: Expense[];
  onAddExpenseClick: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onAddExpenseClick }) => {
  return (
    <ShellCard className="p-4">
      <SectionHeader
        title="Recent Expenses"
        subtitle="All operational costs"
        actions={
           <button 
            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition flex-shrink-0"
            onClick={onAddExpenseClick}
            aria-label="Add new expense"
          >
            <PlusIcon className="w-5 h-5"/>
          </button>
        }
      />
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
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
                <td className="px-3 py-3 text-slate-600">{new Date(expense.expense_date + 'T00:00:00').toLocaleDateString()}</td>
                <td className="px-3 py-3 text-slate-800 font-medium text-right">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(expense.amount_in_base_currency)}</td>
                <td className="px-3 py-3 text-center">
                  {expense.receipt_url ? (
                    <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 inline-block">
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
