import React from 'react';
import EmptyState from './EmptyState';
import { ClipboardDocumentIcon } from './icons/Icons';

const BookingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-md px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bookings workspace</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track loads, delivery windows and client details in one place.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Planning focussed • execution coming soon
          </span>
        </div>
      </section>

      <section className="h-72">
        <EmptyState
          icon={<ClipboardDocumentIcon className="h-14 w-14" />}
          title="No booking board yet"
          message="You will be able to create trips, assign vehicles and drivers, and see status updates here once this module is wired up."
        />
      </section>
    </div>
  );
};

export default BookingsPage;
