
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingStatus, EmploymentStatus } from '../types';
import {
  DocumentTextIcon,
  SearchIcon,
  PlusIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from './icons';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../contexts/DataContext';
import AddBookingModal from './AddBookingModal';
import BookingDetailsModal from './BookingDetailsModal';
import { Button, StatusPill } from './UiKit';
import type { AppSettings } from '../App';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import { buildBookingCsvColumns, buildBookingXlsxColumns } from '../dataIO/bookingExportColumns';

type BookingTabKey = 'all' | 'new_orders' | 'awaiting_dispatch' | 'in_transit' | 'completed';
type BookingsViewMode = 'dispatch' | 'tracking';

interface BookingsPageProps {
  settings: AppSettings;
}

type DriverRecommendation = {
  driverId: number;
  name: string;
  rating: number;
  distanceMiles: number;
  hoursLeft: number;
  vehicleType: string;
  vehicleId?: number;
  score: number;
};

const toTitle = (v: string) =>
  String(v)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const dateKey = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const sameDay = (iso: string, todayKey: string) => dateKey(iso) === todayKey;

const toneForStatus = (status: BookingStatus) => {
  if (status === BookingStatus.DELIVERED || status === BookingStatus.CLOSED) return 'success' as const;
  if (status === BookingStatus.CANCELLED) return 'danger' as const;
  if (status === BookingStatus.IN_TRANSIT || status === BookingStatus.DISPATCHED) return 'info' as const;
  if (status === BookingStatus.CONFIRMED || status === BookingStatus.SCHEDULED) return 'warn' as const;
  return 'neutral' as const;
};

const statusInTab = (status: BookingStatus, tab: BookingTabKey) => {
  switch (tab) {
    case 'new_orders':
      return [BookingStatus.DRAFT, BookingStatus.PENDING].includes(status);
    case 'awaiting_dispatch':
      return [BookingStatus.CONFIRMED, BookingStatus.SCHEDULED].includes(status);
    case 'in_transit':
      return [BookingStatus.DISPATCHED, BookingStatus.IN_TRANSIT].includes(status);
    case 'completed':
      return [BookingStatus.DELIVERED, BookingStatus.CLOSED].includes(status);
    default:
      return true;
  }
};

const typePill = (booking: Booking) => {
  if (booking.requires_refrigeration) return { label: 'Temp Controlled', cls: 'bg-blue-100 text-blue-700' };
  if (booking.cargo_type === 'hazardous') return { label: 'Hazmat', cls: 'bg-amber-100 text-amber-700' };
  if (booking.cargo_type === 'heavy') return { label: 'Oversized', cls: 'bg-violet-100 text-violet-700' };
  return { label: 'Standard', cls: 'bg-slate-100 text-slate-700' };
};

const BookingsPage: React.FC<BookingsPageProps> = ({ settings }) => {
  const { user } = useAuth();
  const { bookings, addBooking, updateBooking, customers, drivers, users, vehicles } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<BookingTabKey>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [focusedBookingId, setFocusedBookingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<BookingsViewMode>('dispatch');

  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target as HTMLElement | null)?.isContentEditable;

      if (isTyping) return;

      if (e.key.toLowerCase() === 'n') {
        setIsAddModalOpen(true);
      }

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('booking-search')?.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail as { bookingId?: number } | undefined;
        if (detail?.bookingId != null) setSelectedBookingId(Number(detail.bookingId));
      } catch {
        // ignore invalid custom events
      }
    };

    window.addEventListener('hf:open-booking', handler as EventListener);
    return () => window.removeEventListener('hf:open-booking', handler as EventListener);
  }, []);

  const roleScopedBookings = useMemo(() => {
    if (!isCustomer) return bookings;
    const customerId = Number((user as any)?.userId ?? (user as any)?.id);
    if (Number.isNaN(customerId)) return [];
    return bookings.filter((b) => b.customer_id === customerId);
  }, [bookings, isCustomer, user]);

  const filteredBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return roleScopedBookings
      .filter((b) => statusInTab(b.status, activeTab))
      .filter((b) => {
        if (!q) return true;
        return (
          String(b.booking_number).toLowerCase().includes(q) ||
          String(b.pickup_city).toLowerCase().includes(q) ||
          String(b.delivery_city).toLowerCase().includes(q) ||
          String(b.cargo_description).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime());
  }, [roleScopedBookings, activeTab, searchTerm]);

  const trackingBookings = useMemo(() => {
    return roleScopedBookings
      .filter((b) =>
        [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.SCHEDULED, BookingStatus.DISPATCHED, BookingStatus.IN_TRANSIT].includes(
          b.status
        )
      )
      .sort((a, b) => new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime());
  }, [roleScopedBookings]);

  const todayKey = dateKey(new Date().toISOString());

  const metrics = useMemo(() => {
    const todayTotal = roleScopedBookings.filter((b) => sameDay(b.pickup_date, todayKey)).length;

    const pendingDispatch = roleScopedBookings.filter((b) =>
      [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.SCHEDULED].includes(b.status)
    ).length;

    const inTransit = roleScopedBookings.filter((b) => [BookingStatus.DISPATCHED, BookingStatus.IN_TRANSIT].includes(b.status)).length;

    return { todayTotal, pendingDispatch, inTransit };
  }, [roleScopedBookings, todayKey]);

  const tabCounts = useMemo(() => {
    const count = (tab: BookingTabKey) =>
      tab === 'all' ? roleScopedBookings.length : roleScopedBookings.filter((b) => statusInTab(b.status, tab)).length;

    return {
      all: count('all'),
      new_orders: count('new_orders'),
      awaiting_dispatch: count('awaiting_dispatch'),
      in_transit: count('in_transit'),
      completed: count('completed'),
    };
  }, [roleScopedBookings]);
  useEffect(() => {
    const source = viewMode === 'tracking' ? trackingBookings : filteredBookings;

    if (!focusedBookingId && source.length > 0) {
      setFocusedBookingId(source[0].id);
      return;
    }

    if (focusedBookingId && !source.some((b) => b.id === focusedBookingId)) {
      setFocusedBookingId(source[0]?.id ?? null);
    }
  }, [filteredBookings, trackingBookings, focusedBookingId, viewMode]);

  const customerNameById = useMemo(() => {
    const map = new Map<number, string>();
    customers.forEach((c) => map.set(c.id, c.company_name));
    return map;
  }, [customers]);

  const customerById = useMemo(
    () =>
      customers.reduce<Record<number, (typeof customers)[number] | undefined>>((acc, customer) => {
        acc[customer.id] = customer;
        return acc;
      }, {}),
    [customers],
  );

  const driverById = useMemo(
    () =>
      drivers.reduce<Record<number, (typeof drivers)[number] | undefined>>((acc, driver) => {
        acc[driver.id] = driver;
        return acc;
      }, {}),
    [drivers],
  );

  const userByIdRecord = useMemo(
    () =>
      users.reduce<Record<string, (typeof users)[number] | undefined>>((acc, record) => {
        acc[String(record.id)] = record;
        return acc;
      }, {}),
    [users],
  );

  const vehicleById = useMemo(
    () =>
      vehicles.reduce<Record<number, (typeof vehicles)[number] | undefined>>((acc, vehicle) => {
        acc[vehicle.id] = vehicle;
        return acc;
      }, {}),
    [vehicles],
  );

  const bookingCsvColumns = useMemo(
    () => buildBookingCsvColumns({ customerById, driverById, userById: userByIdRecord, vehicleById }),
    [customerById, driverById, userByIdRecord, vehicleById],
  );

  const bookingXlsxColumns = useMemo(
    () => buildBookingXlsxColumns({ customerById, driverById, userById: userByIdRecord, vehicleById }),
    [customerById, driverById, userByIdRecord, vehicleById],
  );

  const todayStamp = new Date().toISOString().slice(0, 10);

  const exportBookingsCsv = (rows: Booking[], suffix: string) =>
    downloadCsv(rows, bookingCsvColumns as any, `bookings-${suffix}-${todayStamp}`);
  const exportBookingsXlsx = (rows: Booking[], suffix: string) =>
    downloadXlsx(rows, bookingXlsxColumns as any, `bookings-${suffix}-${todayStamp}`);

  const userById = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>();
    users.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [users]);

  const selectedForAssistant = useMemo(() => {
    const focused = roleScopedBookings.find((b) => b.id === focusedBookingId);
    if (focused) return focused;

    const awaiting = roleScopedBookings.find((b) =>
      [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.SCHEDULED].includes(b.status)
    );

    return awaiting || filteredBookings[0] || null;
  }, [roleScopedBookings, filteredBookings, focusedBookingId]);

  const recommendations = useMemo<DriverRecommendation[]>(() => {
    if (!selectedForAssistant) return [];

    const activeDrivers = drivers.filter((d) => d.employment_status === EmploymentStatus.ACTIVE);

    return activeDrivers
      .map((driver) => {
        const linkedUser = userById.get(String(driver.user_id));
        const name = `${linkedUser?.first_name || ''} ${linkedUser?.last_name || ''}`.trim() || `Driver #${driver.id}`;

        const preferredVehicle = vehicles.find((v, index) => {
          const cargoFit = selectedForAssistant.requires_refrigeration ? v.vehicle_type === 'refrigerated' : true;
          return v.status === 'active' && cargoFit && (index + driver.id) % 2 === 0;
        });

        const fallbackVehicle = vehicles.find((v) => v.status === 'active');
        const chosenVehicle = preferredVehicle || fallbackVehicle;

        const rating = Number(driver.rating || 4.4);
        const distanceMiles = Number((((driver.id * 13 + selectedForAssistant.id * 7) % 66) / 10 + 0.8).toFixed(1));
        const hoursLeft = Number((8 + ((driver.id * 3 + selectedForAssistant.id) % 8) + rating / 10).toFixed(1));

        const vehicleType = chosenVehicle
          ? `${toTitle(chosenVehicle.vehicle_type)} ${chosenVehicle.registration_number}`
          : selectedForAssistant.requires_refrigeration
          ? "Reefer 53'"
          : "Dry Van 53'";

        const score = rating * 18 + Math.max(0, 12 - distanceMiles) * 4 + Math.max(0, hoursLeft - 8);

        return {
          driverId: driver.id,
          name,
          rating,
          distanceMiles,
          hoursLeft,
          vehicleType,
          vehicleId: chosenVehicle?.id,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [selectedForAssistant, drivers, userById, vehicles]);

  const handleAssignDriver = (rec: DriverRecommendation) => {
    if (!selectedForAssistant) return;

    const nextStatus =
      selectedForAssistant.status === BookingStatus.PENDING
        ? BookingStatus.CONFIRMED
        : selectedForAssistant.status === BookingStatus.SCHEDULED
        ? BookingStatus.DISPATCHED
        : selectedForAssistant.status;

    void updateBooking({
      ...selectedForAssistant,
      driver_id: rec.driverId,
      vehicle_id: rec.vehicleId ?? selectedForAssistant.vehicle_id,
      status: nextStatus,
    });
  };

  const tabs: Array<{ key: BookingTabKey; label: string; count: number }> = [
    { key: 'all', label: 'All Bookings', count: tabCounts.all },
    { key: 'new_orders', label: 'New Orders', count: tabCounts.new_orders },
    { key: 'awaiting_dispatch', label: 'Awaiting Dispatch', count: tabCounts.awaiting_dispatch },
    { key: 'in_transit', label: 'In Transit', count: tabCounts.in_transit },
    { key: 'completed', label: 'Completed', count: tabCounts.completed },
  ];

  const trackingSelected = trackingBookings.find((b) => b.id === focusedBookingId) || trackingBookings[0] || null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bookings and Dispatch</h1>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[420px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              id="booking-search"
              type="text"
              placeholder="Search Order ID, customer, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {!isCustomer && (
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('dispatch')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'dispatch' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Dispatch View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tracking')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'tracking' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Live Tracking
              </button>
            </div>
          )}

          <Button variant="ghost" onClick={() => exportBookingsCsv(filteredBookings, activeTab)}>
            Export CSV
          </Button>
          <Button variant="ghost" onClick={() => exportBookingsXlsx(filteredBookings, activeTab)}>
            Export XLSX
          </Button>

          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            {isCustomer ? 'Request Booking' : 'New Booking'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Today's Total Bookings</p>
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700"><DocumentTextIcon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{metrics.todayTotal}</p>
          <p className="mt-2 text-xs text-emerald-700">+12% vs yesterday</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Pending Dispatch</p>
            <span className="rounded-xl bg-orange-100 p-2 text-orange-700"><ExclamationTriangleIcon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{metrics.pendingDispatch}</p>
          <p className="mt-2 text-xs text-orange-700">Requires immediate attention</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Shipments In Transit</p>
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><CheckCircleIcon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{metrics.inTransit}</p>
          <p className="mt-2 text-xs text-slate-500">On schedule</p>
        </div>
      </div>
      {!isCustomer && viewMode === 'tracking' ? (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Active Deliveries</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">{trackingBookings.length} in transit</span>
              </div>
              <div className="mt-3 inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <span className="rounded-md bg-slate-900 px-3 py-1 text-white">Live</span>
                <span className="px-3 py-1 text-slate-600">History</span>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {trackingBookings.length === 0 && <p className="px-4 py-8 text-sm text-slate-500">No active deliveries.</p>}
              {trackingBookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setFocusedBookingId(b.id)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${focusedBookingId === b.id ? 'bg-orange-50/50' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-slate-900">{b.booking_number}</p>
                    <span className={`text-xs font-semibold ${b.status === BookingStatus.IN_TRANSIT || b.status === BookingStatus.DISPATCHED ? 'text-emerald-700' : 'text-orange-700'}`}>{toTitle(b.status)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{b.pickup_city} Terminal</p>
                  <p className="text-xs text-slate-500">ETA {new Date(b.delivery_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </button>
              ))}
            </div>

            <div className="p-4">
              <button
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => exportBookingsCsv(trackingBookings, 'tracking')}
                type="button"
              >
                Export Tracking Data
              </button>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,#dbeafe,transparent_28%),radial-gradient(circle_at_90%_70%,#dcfce7,transparent_30%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />

            <div className="relative z-10 flex h-[640px] flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
                <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white">All</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Active</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Delayed</span>
                <span className="ml-auto rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Traffic</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Weather</span>
              </div>

              {trackingSelected && (
                <div className="relative flex-1 p-4">
                  <div className="absolute left-[14%] top-[42%] h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                  <div className="absolute left-[76%] top-[26%] h-3 w-3 rounded-full bg-slate-900 ring-4 ring-white" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M18,55 C42,18 63,38 78,28" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" />
                  </svg>

                  <div className="absolute bottom-6 left-6 w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-3xl font-semibold text-slate-900">{trackingSelected.booking_number}</h4>
                      <StatusPill label={toTitle(trackingSelected.status)} tone={toneForStatus(trackingSelected.status)} />
                    </div>
                    <p className="mt-1 text-slate-600">In transit to {trackingSelected.delivery_city}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-slate-100 px-3 py-2"><p className="text-xs text-slate-500">Speed</p><p className="font-semibold text-slate-900">68 km/h</p></div>
                      <div className="rounded-lg bg-slate-100 px-3 py-2"><p className="text-xs text-slate-500">Fuel</p><p className="font-semibold text-slate-900">82%</p></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{trackingSelected.driver_id ? `Driver #${trackingSelected.driver_id}` : 'Unassigned'}</p>
                        <p className="text-xs text-slate-500">Route {trackingSelected.pickup_city} -&gt; {trackingSelected.delivery_city}</p>
                      </div>
                      <button className="rounded-lg bg-orange-500 px-2.5 py-2 text-sm font-semibold text-white">Call</button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setSelectedBookingId(trackingSelected.id)} className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">View Details</button>
                      <button className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Re-route</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className={`grid gap-4 ${isCustomer ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_340px]'}`}>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-5 border-b border-slate-200 px-5 py-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 border-b-2 pb-2 text-sm font-semibold transition ${activeTab === tab.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                >
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Scheduled Time</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No bookings found for this filter.</td></tr>}

                  {filteredBookings.map((booking) => {
                    const badge = typePill(booking);
                    const isFocused = focusedBookingId === booking.id;
                    const customerName = customerNameById.get(booking.customer_id) || `Customer #${booking.customer_id}`;

                    return (
                      <tr key={booking.id} className={`border-t border-slate-200 transition ${isFocused ? 'bg-orange-50/50' : 'bg-white hover:bg-slate-50'}`} onClick={() => setFocusedBookingId(booking.id)}>
                        <td className="px-5 py-4 font-semibold text-slate-900">{booking.booking_number}</td>
                        <td className="px-5 py-4"><div className="text-base font-medium text-slate-900">{customerName}</div><div className="text-xs text-slate-500">{booking.cargo_description || 'No description'}</div></td>
                        <td className="px-5 py-4"><div className="font-medium text-slate-900">{booking.pickup_city} <span className="mx-1 text-slate-400">-&gt;</span> {booking.delivery_city}</div></td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                        <td className="px-5 py-4"><div className="inline-flex items-center gap-1.5 text-slate-700"><ClockIcon className="h-4 w-4 text-slate-400" /><span>{new Date(booking.pickup_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div></td>
                        <td className="px-5 py-4"><StatusPill label={toTitle(booking.status)} tone={toneForStatus(booking.status)} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportBookingsCsv([booking], booking.booking_number || `booking-${booking.id}`);
                              }}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Download
                            </button>
                            {!isCustomer && recommendations.length > 0 && selectedForAssistant?.id === booking.id && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleAssignDriver(recommendations[0]); }} className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100">Assign</button>
                            )}
                            <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedBookingId(booking.id); }} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">Showing {filteredBookings.length} of {roleScopedBookings.length} bookings</div>
          </section>
          {!isCustomer && (
            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Dispatch Assistant</h3>
                  <button className="text-slate-400 hover:text-slate-600" type="button" aria-label="Close assistant">x</button>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-orange-50/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Context</p>
                  {selectedForAssistant ? (
                    <p className="mt-1 text-sm text-slate-700">Matching drivers for <span className="font-semibold text-slate-900">{selectedForAssistant.booking_number}</span> ({selectedForAssistant.pickup_city} -&gt; {selectedForAssistant.delivery_city})</p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Select a booking row to see recommendations.</p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {recommendations.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No active driver recommendations yet.</div>}

                  {recommendations.map((rec, idx) => (
                    <div key={rec.driverId} className={`rounded-2xl border p-3 ${idx === 0 ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{rec.name}</p>
                          <p className="text-xs text-emerald-700">{rec.distanceMiles} miles away</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Rating {rec.rating.toFixed(1)}</p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-100 px-2 py-1.5 text-slate-700"><p className="text-slate-500">Truck Type</p><p className="font-semibold text-slate-900">{rec.vehicleType}</p></div>
                        <div className="rounded-xl bg-slate-100 px-2 py-1.5 text-slate-700"><p className="text-slate-500">Hours Left</p><p className="font-semibold text-slate-900">{rec.hoursLeft.toFixed(1)} hrs</p></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAssignDriver(rec)}
                        className={`mt-3 w-full rounded-full px-3 py-2 text-sm font-semibold ${idx === 0 ? 'bg-orange-500 text-white hover:bg-orange-600' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {idx === 0 ? 'Assign to Order' : 'Quick Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
                <p className="text-sm font-semibold text-orange-700">Match Tip</p>
                <p className="mt-1 text-sm text-slate-700">Prioritize drivers with high rating and low distance for faster dispatch acceptance.</p>
              </div>
            </aside>
          )}
        </div>
      )}

      {isAddModalOpen && (
        <AddBookingModal
          onClose={() => setIsAddModalOpen(false)}
          onAddBooking={(b) => {
            void addBooking(b);
          }}
        />
      )}

      {(selectedBookingId == null ? null : bookings.find((b) => b.id === selectedBookingId) ?? null) && (
        <BookingDetailsModal
          booking={bookings.find((b) => b.id === selectedBookingId) as Booking}
          onClose={() => setSelectedBookingId(null)}
          onUpdateBooking={updateBooking}
          userRole={user?.role}
          proofMaxMb={settings.proofMaxMb}
        />
      )}
    </div>
  );
};

export default BookingsPage;
