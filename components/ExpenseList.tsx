
import React from 'react';
import { Expense } from '../types';
import { PlusIcon, DocumentDuplicateIcon } from './icons/Icons';

interface ExpenseListProps {
  expenses: Expense[];
  onAddExpenseClick: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onAddExpenseClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Recent Expenses</h2>
         <button 
          className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={onAddExpenseClick}
         >
          <PlusIcon className="w-5 h-5"/>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Amount</th>
              <th scope="col" className="px-6 py-3 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {expense.expense_category.charAt(0).toUpperCase() + expense.expense_category.slice(1)}
                </td>
                <td className="px-6 py-4">{expense.description}</td>
                <td className="px-6 py-4">{new Date(expense.expense_date + 'T00:00:00').toLocaleDateString()}</td>
                <td className="px-6 py-4">${expense.amount_in_base_currency.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  {expense.receipt_url ? (
                    <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 inline-block">
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
             {expenses.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                       No expenses recorded.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
