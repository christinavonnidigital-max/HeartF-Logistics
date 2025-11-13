import React from 'react';
import { Expense } from '../types';
import { PlusIcon } from './icons/Icons';

interface ExpenseListProps {
  expenses: Expense[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Recent Expenses</h2>
         <button 
          className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={() => alert('Add Expense form would open here.')}
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
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {expense.expense_category.charAt(0).toUpperCase() + expense.expense_category.slice(1)}
                </td>
                <td className="px-6 py-4">{expense.description}</td>
                <td className="px-6 py-4">{new Date(expense.expense_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">${expense.amount_in_base_currency.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;