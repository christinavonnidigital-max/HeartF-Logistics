
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import EmptyState from './EmptyState';
import { DocumentTextIcon, MapPinIcon, TruckIcon, ClockIcon, SearchIcon } from './icons/Icons';

interface BookingsPageProps {
  bookings?: Booking[];
}

const statusToLabelAndTone = (status: Booking['status'] | string) => {
  const normalized = (status || '').toString();
  switch (normalized) {
    case 'pending':
      return { label: 'Pending', toneClass: 'bg-amber-50 text-amber-800' };
    case 'confirmed':
      return { label: 'Confirmed', toneClass: 'bg-emerald-50 text-emerald-800' };
    case 'in_transit':
      return { label: 'In transit', toneClass: 'bg-sky-50 text-sky-800' };
    case 'delivered':
      return { label: 'Delivered', toneClass: 'bg-slate-100 text-slate-800' };
    case 'cancelled':
      return { label: 'Cancelled', toneClass: 'bg-rose-50 text-rose-800' };
    default:
      return { label: normalized || 'Unknown', toneClass: 'bg-slate-50 text-slate-700' };
  }
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
}> = ({ icon, label, value, sublabel }) => {
  const formatted = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold text-slate-900">
          {formatted}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
};

type BoardColumnKey = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

const BOARD_COLUMNS: {
  key: BoardColumnKey;
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'pending',
    title: 'Planned',
    subtitle: 'Awaiting confirmation',
  },
  {
    key: 'confirmed',
    title: 'Confirmed',
    subtitle: 'Ready to dispatch',
  },
  {
    key: 'in_transit',
    title: 'In transit',
    subtitle: 'Currently on the road',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    subtitle: 'Completed drops',
  },
];

const BookingsPage: React.FC<BookingsPageProps> = ({ bookings = [] }) => {
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Sync local state when parent bookings change
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return localBookings.filter(b => {
        // Status Filter
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        
        // Search Filter
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            b.booking_number.toLowerCase().includes(lowerTerm) ||
            b.pickup_city.toLowerCase().includes(lowerTerm) ||
            b.delivery_city.toLowerCase().includes(lowerTerm) ||
            b.cargo_description.toLowerCase().includes(lowerTerm)
        );
    });
  }, [localBookings, searchTerm, statusFilter]);

  const now = new Date();

  const safeDate = (value?: string) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const todayString = now.toISOString().slice(0, 10);
  const activeStatuses: BoardColumnKey[] = ['pending', 'confirmed', 'in_transit'];

  // Stats are calculated based on the FILTERED view to give context to search results
  const totalBookings = filteredBookings.length;
  const activeBookings = filteredBookings.filter(b =>
    activeStatuses.includes((b.status as BoardColumnKey) || 'pending'),
  );
  const deliveredBookings = filteredBookings.filter(b => (b.status as string) === 'delivered');

  const todayBookings = filteredBookings.filter(b => {
    const date = safeDate(b.pickup_date);
    if (!date) return false;
    return date.toISOString().slice(0, 10) === todayString;
  });

  const upcomingBookings = useMemo(
    () =>
      [...filteredBookings]
        .filter(b => activeStatuses.includes((b.status as BoardColumnKey) || 'pending'))
        .sort((a, b) => {
          const da = safeDate(a.pickup_date)?.getTime() ?? 0;
          const db = safeDate(b.pickup_date)?.getTime() ?? 0;
          return da - db;
        })
        .slice(0, 6),
    [filteredBookings],
  );

  const bookingsByStatus = useMemo(() => {
    const grouped: Record<BoardColumnKey, Booking[]> = {
      pending: [],
      confirmed: [],
      in_transit: [],
      delivered: [],
      cancelled: [],
    };
    for (const booking of filteredBookings) {
      const key = ((booking.status as string) || 'pending') as BoardColumnKey;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(booking);
    }
    return grouped;
  }, [filteredBookings]);

  const handleStatusChange = (bookingId: number, newStatus: BoardColumnKey) => {
    setLocalBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: newStatus as BookingStatus } : b,
      ),
    );
  };

  const hasBookings = filteredBookings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                    Bookings workspace
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                    Track loads, delivery windows and client details in one place.
                    </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Planning and execution
                </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-50">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID, City, or Cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<DocumentTextIcon className="h-4 w-4" />}
          label="Total bookings"
          value={totalBookings}
          sublabel="Matching current filters"
        />
        <StatCard
          icon={<TruckIcon className="h-4 w-4" />}
          label="Active"
          value={activeBookings.length}
          sublabel="Pending, confirmed, in transit"
        />
        <StatCard
          icon={<ClockIcon className="h-4 w-4" />}
          label="Today"
          value={todayBookings.length}
          sublabel="Pickup scheduled for today"
        />
        <StatCard
          icon={<MapPinIcon className="h-4 w-4" />}
          label="Delivered"
          value={deliveredBookings.length}
          sublabel="Completed deliveries"
        />
      </section>

      {/* Main content */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        {/* Upcoming list */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Upcoming bookings
              </h3>
              <p className="text-xs text-slate-500">
                Loads that still need to be executed.
              </p>
            </div>
            {hasBookings && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {activeBookings.length} active
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {!hasBookings && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                {localBookings.length === 0 ? "No bookings captured yet." : "No bookings match your search filters."}
              </div>
            )}

            {hasBookings && upcomingBookings.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No active bookings matching your filters.
              </div>
            )}

            {upcomingBookings.map(booking => {
              const routeLabel = `${booking.pickup_city} \u2192 ${booking.delivery_city}`;
              const { label: statusLabel, toneClass } = statusToLabelAndTone(
                booking.status as string,
              );
              const pickupDate = safeDate(booking.pickup_date);
              const pickupLabel = pickupDate
                ? pickupDate.toLocaleDateString()
                : 'Date not set';

              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {booking.booking_number || 'Booking'}
                    </p>
                    <p className="text-xs text-slate-500">{routeLabel}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pickup: {pickupLabel}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking board */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Booking board
              </h3>
              <p className="text-xs text-slate-500">
                Drag and drop is not wired, but you can update status inline.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {BOARD_COLUMNS.map(column => {
              const items = bookingsByStatus[column.key];

              return (
                <div
                  key={column.key}
                  className="flex flex-col rounded-xl bg-slate-50/80 p-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {column.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {column.subtitle}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {items.length}
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    {items.length === 0 && (
                      <p className="rounded-lg bg-slate-100 px-2 py-2 text-[11px] text-slate-500">
                        Nothing in this column yet.
                      </p>
                    )}

                    {items.map(booking => {
                      const routeLabel = `${booking.pickup_city} \u2192 ${booking.delivery_city}`;
                      const pickupDate = safeDate(booking.pickup_date);
                      const pickupLabel = pickupDate
                        ? pickupDate.toLocaleDateString()
                        : 'Date not set';

                      return (
                        <div
                          key={booking.id}
                          className="space-y-1 rounded-lg bg-white px-2.5 py-2.5 text-xs shadow-sm ring-1 ring-slate-100"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] font-semibold text-slate-900">
                              {booking.booking_number}
                            </p>
                          </div>
                          <p className="truncate text-[11px] text-slate-500">
                            {routeLabel}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pickup: {pickupLabel}
                          </p>
                          <div className="mt-2">
                            <label className="flex items-center gap-1 text-[10px] text-slate-500">
                              Status
                              <select
                                value={booking.status as string}
                                onChange={e =>
                                  handleStatusChange(
                                    booking.id,
                                    e.target.value as BoardColumnKey,
                                  )
                                }
                                className="ml-auto rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_transit">In transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!hasBookings && (
            <div className="px-4 pb-5">
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <EmptyState
                  icon={
                    <DocumentTextIcon className="h-14 w-14 text-slate-300" />
                  }
                  title="No booking board yet"
                  message={localBookings.length === 0 ? "Once you start capturing bookings, they will appear here." : "Adjust your filters to see more bookings."}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BookingsPage;
