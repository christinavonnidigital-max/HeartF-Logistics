
import React from 'react';
import EmptyState from './EmptyState';
import { DriverIcon } from './icons/Icons';

const DriversPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-md px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Driver management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Keep an eye on documents, training and performance for every driver.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Safety focussed • tooling coming soon
          </span>
        </div>
      </section>

      <section className="h-72">
        <EmptyState
          icon={<DriverIcon className="h-14 w-14" />}
          title="No driver records yet"
          message="This will become the control room for expiries, licences, violations and availability once the data model is connected."
        />
      </section>
    </div>
  );
};

export default DriversPage;
