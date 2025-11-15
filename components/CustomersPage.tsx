import React from 'react';
import EmptyState from './EmptyState';
import { UsersIcon } from './icons/Icons';

const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-md px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Customer management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Keep accounts, key contacts and contract details aligned with your fleet reality.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            CRM module • first version in progress
          </span>
        </div>
      </section>

      <section className="h-72">
        <EmptyState
          icon={<UsersIcon className="h-14 w-14" />}
          title="No customers loaded yet"
          message="Once the CRM module is finished you will be able to sync customer lists, link contacts to bookings and see revenue per client here."
        />
      </section>
    </div>
  );
};

export default CustomersPage;
