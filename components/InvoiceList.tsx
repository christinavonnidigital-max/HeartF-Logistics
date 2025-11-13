import React from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { PlusIcon } from './icons/Icons';

interface InvoiceListProps {
  invoices: Invoice[];
}

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.PAID: return 'bg-green-100 text-green-800';
    case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-800';
    case InvoiceStatus.PARTIAL: return 'bg-yellow-100 text-yellow-800';
    case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-800';
    case InvoiceStatus.DRAFT: return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Recent Invoices</h2>
        <button 
          className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={() => alert('Add Invoice form would open here.')}
        >
          <PlusIcon className="w-5 h-5"/>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Invoice #</th>
              <th scope="col" className="px-6 py-3">Customer ID</th>
              <th scope="col" className="px-6 py-3">Due Date</th>
              <th scope="col" className="px-6 py-3">Total</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {invoice.invoice_number}
                </td>
                <td className="px-6 py-4">{invoice.customer_id}</td>
                <td className="px-6 py-4">{new Date(invoice.due_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">${invoice.total_amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;