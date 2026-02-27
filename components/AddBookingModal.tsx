
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingStatus, CargoType, Currency, PaymentStatus, EmploymentStatus } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { SearchIcon, PlusIcon, MapPinIcon, CalendarDaysIcon, TruckIcon, CheckCircleIcon } from './icons';
import { ModalShell, Button, Input } from './UiKit';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../contexts/DataContext';

type BookingFormState = {
  customer_id: string;
  pickup_city: string;
  pickup_address: string;
  pickup_date: string;
  delivery_city: string;
  delivery_address: string;
  delivery_date: string;
  cargo_type: CargoType;
  cargo_description: string;
  weight_kg: string;
  dimensions: string;
  base_price: string;
  currency: Currency;
};

interface AddBookingModalProps {
  onClose: () => void;
  onAddBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Partial<BookingFormState>;
}

type StepKey = 1 | 2 | 3 | 4;

type SuccessState = {
  bookingNumber: string;
  driverName: string;
  vehicleLabel: string;
  pickupLabel: string;
  isDispatched: boolean;
};

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: 1, label: 'Customer Info' },
  { key: 2, label: 'Route Details' },
  { key: 3, label: 'Assignment' },
  { key: 4, label: 'Review' },
];

const cargoOptions: Array<{ type: CargoType; label: string }> = [
  { type: CargoType.GENERAL, label: 'General' },
  { type: CargoType.HAZARDOUS, label: 'Hazmat' },
  { type: CargoType.PERISHABLE, label: 'Cold Chain' },
  { type: CargoType.HEAVY, label: 'Oversized' },
];

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const parseNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const routeKm = (from: string, to: string) => {
  const seed = Math.abs([...`${from}-${to}`].reduce((a, ch) => a + ch.charCodeAt(0), 0));
  return 180 + (seed % 620);
};

const titleize = (v: string) =>
  String(v)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const DEFAULT_FORM: BookingFormState = {
  customer_id: '101',
  pickup_city: 'Los Angeles',
  pickup_address: 'Terminal 4, Port of LA',
  pickup_date: addDays(1),
  delivery_city: 'San Francisco',
  delivery_address: 'SOMA Distribution Center',
  delivery_date: addDays(2),
  cargo_type: CargoType.GENERAL,
  cargo_description: 'Electronics (High Value)',
  weight_kg: '500',
  dimensions: '120x80x100',
  base_price: '850',
  currency: Currency.USD,
};

const AddBookingModal: React.FC<AddBookingModalProps> = ({ onClose, onAddBooking, initialData }) => {
  const { user } = useAuth();
  const { customers, drivers, users, vehicles } = useData();
  const isCustomer = user?.role === 'customer';

  const [step, setStep] = useState<StepKey>(1);
  const [query, setQuery] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<number | undefined>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>();
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [special, setSpecial] = useState({ tailgate: false, multiStop: false, weekend: false });
  const [form, setForm] = useState<BookingFormState>(DEFAULT_FORM);

  const customerList = useMemo(() => (customers.length > 0 ? customers : mockCustomers), [customers]);

  useEffect(() => {
    if (!initialData) return;
    setForm((p) => ({ ...p, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    if (isCustomer && user?.userId) setForm((p) => ({ ...p, customer_id: String(user.userId) }));
  }, [isCustomer, user]);

  const selectedCustomer = useMemo(
    () => customerList.find((c) => String(c.id) === form.customer_id),
    [customerList, form.customer_id]
  );

  const matchingCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customerList.slice(0, 6);
    return customerList.filter((c) => c.company_name.toLowerCase().includes(q)).slice(0, 6);
  }, [customerList, query]);

  const userById = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>();
    users.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [users]);

  const distanceKm = useMemo(() => routeKm(form.pickup_city, form.delivery_city), [form.pickup_city, form.delivery_city]);
  const etaHours = useMemo(() => Math.max(4, Math.round(distanceKm / 72)), [distanceKm]);
  const suggestions = useMemo(() => {
    return drivers
      .filter((d) => d.employment_status === EmploymentStatus.ACTIVE)
      .map((d) => {
        const linked = userById.get(String(d.user_id));
        const name = `${linked?.first_name || ''} ${linked?.last_name || ''}`.trim() || `Driver #${d.id}`;
        const preferred = vehicles.find((v, i) => {
          const cargoFit = form.cargo_type === CargoType.PERISHABLE ? v.vehicle_type === 'refrigerated' : true;
          return v.status === 'active' && cargoFit && (i + d.id) % 2 === 0;
        });
        const fallback = vehicles.find((v) => v.status === 'active');
        const vehicle = preferred || fallback;
        const rating = Number(d.rating || 4.5);
        const awayKm = Number((((d.id * 17 + distanceKm) % 84) / 10 + 2).toFixed(1));
        const availability = Math.max(68, 100 - ((d.id * 13) % 20));
        const score = rating * 20 + availability - awayKm * 1.6;
        return { driver: d, name, rating, awayKm, availability, vehicle, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [drivers, userById, vehicles, form.cargo_type, distanceKm]);

  useEffect(() => {
    if (!autoDispatch || selectedDriverId || suggestions.length === 0) return;
    setSelectedDriverId(suggestions[0].driver.id);
    setSelectedVehicleId(suggestions[0].vehicle?.id);
  }, [autoDispatch, selectedDriverId, suggestions]);

  const estimatedCost = useMemo(() => {
    const base = parseNum(form.base_price);
    const weight = parseNum(form.weight_kg);
    const fuelAdj = (distanceKm / 100) * 12;
    const handling = weight > 20000 ? 180 : weight > 12000 ? 95 : 40;
    const extra = (special.tailgate ? 35 : 0) + (special.multiStop ? 80 : 0) + (special.weekend ? 60 : 0);
    return Math.round(base + fuelAdj + handling + extra);
  }, [form.base_price, form.weight_kg, distanceKm, special]);

  const canProceed = useMemo(() => {
    if (step === 1) return Boolean(form.customer_id && form.cargo_description && parseNum(form.weight_kg) > 0);
    if (step === 2) return Boolean(form.pickup_city && form.delivery_city && form.pickup_date && form.delivery_date);
    return true;
  }, [step, form]);

  const setField = (key: keyof BookingFormState, value: string) => {
    setError('');
    setForm((p) => ({ ...p, [key]: value }));
  };

  const next = () => {
    if (!canProceed) {
      setError('Complete required fields before continuing.');
      return;
    }
    setError('');
    setStep((p) => (p < 4 ? ((p + 1) as StepKey) : p));
  };

  const back = () => {
    setError('');
    setStep((p) => (p > 1 ? ((p - 1) as StepKey) : p));
  };

  const resetWizard = () => {
    setSuccess(null);
    setError('');
    setStep(1);
    setQuery('');
    setSelectedDriverId(undefined);
    setSelectedVehicleId(undefined);
    setAutoDispatch(true);
    setSpecial({ tailgate: false, multiStop: false, weekend: false });
    setForm(DEFAULT_FORM);
  };

  const create = () => {
    if (!canProceed) {
      setError('Complete required fields before creating this booking.');
      return;
    }

    const bookingNumber = `BK-${Date.now().toString().slice(-4)}`;
    const weightTonnes = Number((parseNum(form.weight_kg) / 1000).toFixed(2));
    const status = selectedDriverId ? (autoDispatch ? BookingStatus.SCHEDULED : BookingStatus.CONFIRMED) : BookingStatus.PENDING;

    const notes = [
      form.dimensions ? `Dims: ${form.dimensions} cm` : '',
      special.tailgate ? 'Tailgate lift required' : '',
      special.multiStop ? 'Multi-stop delivery' : '',
      special.weekend ? 'Weekend delivery window' : '',
    ]
      .filter(Boolean)
      .join(' | ');

    onAddBooking({
      booking_number: bookingNumber,
      customer_id: Number(form.customer_id),
      pickup_location: form.pickup_city,
      pickup_address: form.pickup_address,
      pickup_city: form.pickup_city,
      pickup_country: selectedCustomer?.country || 'USA',
      pickup_date: form.pickup_date,
      delivery_location: form.delivery_city,
      delivery_address: form.delivery_address,
      delivery_city: form.delivery_city,
      delivery_country: selectedCustomer?.country || 'USA',
      delivery_date: form.delivery_date,
      cargo_type: form.cargo_type,
      cargo_description: form.cargo_description,
      weight_tonnes: weightTonnes,
      requires_refrigeration: form.cargo_type === CargoType.PERISHABLE,
      vehicle_id: selectedVehicleId,
      driver_id: selectedDriverId,
      status,
      base_price: parseNum(form.base_price),
      total_price: estimatedCost,
      currency: form.currency,
      payment_status: PaymentStatus.UNPAID,
      notes: notes || undefined,
    });

    const selectedDriver = suggestions.find((s) => s.driver.id === selectedDriverId);
    const selectedVehicle = suggestions.find((s) => s.vehicle?.id === selectedVehicleId)?.vehicle ||
      vehicles.find((v) => v.id === selectedVehicleId);

    setSuccess({
      bookingNumber,
      driverName: selectedDriver?.name || 'Unassigned',
      vehicleLabel: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registration_number})` : 'Unassigned vehicle',
      pickupLabel: new Date(form.pickup_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      isDispatched: Boolean(selectedDriverId),
    });
  };

  const stepDescription =
    step === 1
      ? 'Step 1 of 4: Shipment Details'
      : step === 2
      ? 'Step 2 of 4: Route Information'
      : step === 3
      ? 'Step 3 of 4: Driver and Vehicle Assignment'
      : 'Step 4 of 4: Review and Confirm';

  const footer = success ? (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" type="button" onClick={resetWizard}>New Booking</Button>
      <Button variant="primary" type="button" onClick={onClose}>Close</Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-slate-500">{error ? <span className="text-rose-600">{error}</span> : 'Saving progress automatically...'}</div>
      <div className="flex items-center gap-2">
        {step > 1 && <Button variant="secondary" type="button" onClick={back}>Back</Button>}
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        {step < 4 ? <Button variant="primary" type="button" onClick={next}>Continue</Button> : <Button variant="primary" type="button" onClick={create}>Confirm and Dispatch</Button>}
      </div>
    </div>
  );

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={success ? 'Dispatch Complete' : 'Create New Booking'}
      description={success ? 'Booking dispatched and shared with assigned driver.' : stepDescription}
      icon={<TruckIcon className="h-5 w-5" />}
      maxWidthClass={success ? 'max-w-5xl' : 'max-w-6xl'}
      footer={footer}
    >
      {success ? (
        <div className="space-y-6 py-4 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircleIcon className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-5xl font-semibold text-slate-900">{success.isDispatched ? 'Booking Successfully Dispatched!' : 'Booking Created Successfully!'}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-xl text-slate-600">Order <span className="font-semibold text-slate-900">{success.bookingNumber}</span> is now live. Driver notification has been queued.</p>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order Summary</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <p><span className="text-slate-500">Tracking ID:</span> <span className="font-semibold text-slate-900">{success.bookingNumber}</span></p>
              <p><span className="text-slate-500">Vehicle:</span> <span className="font-semibold text-slate-900">{success.vehicleLabel}</span></p>
              <p><span className="text-slate-500">Assigned Driver:</span> <span className="font-semibold text-slate-900">{success.driverName}</span></p>
              <p><span className="text-slate-500">Pickup:</span> <span className="font-semibold text-slate-900">{success.pickupLabel}</span></p>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <button className="rounded-2xl bg-orange-500 px-4 py-4 text-sm font-semibold text-white" onClick={onClose}>Track Shipment</button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700">Bill of Lading</button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700" onClick={resetWizard}>New Booking</button>
          </div>

          <button className="text-sm font-semibold text-slate-500 hover:text-slate-700" onClick={onClose}>Return to dashboard</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:grid-cols-4">
            {STEPS.map((s) => {
              const active = s.key === step;
              const done = s.key < step;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {done ? <CheckCircleIcon className="h-4 w-4" /> : s.key}
                  </div>
                  <p className={`text-sm font-semibold ${active ? 'text-orange-600' : 'text-slate-700'}`}>{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="space-y-4">
              {step === 1 && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold text-slate-900">Customer Information</h3><button type="button" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"><PlusIcon className="h-4 w-4" />Add New</button></div>
                    <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><SearchIcon className="h-4 w-4" /></div><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search existing customers..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200" /></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">{matchingCustomers.map((c) => (<button key={c.id} type="button" onClick={() => setField('customer_id', String(c.id))} className={`rounded-xl border px-3 py-2 text-left text-sm ${String(c.id) === form.customer_id ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{c.company_name}</button>))}</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-4 text-xl font-semibold text-slate-900">Cargo Information</h3>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cargoOptions.map((cargo) => (<button key={cargo.type} type="button" onClick={() => setField('cargo_type', cargo.type)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${form.cargo_type === cargo.type ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{cargo.label}</button>))}</div>
                    <textarea value={form.cargo_description} onChange={(e) => setField('cargo_description', e.target.value)} placeholder="Describe the items being shipped..." className="mt-4 min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200" />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input type="number" value={form.weight_kg} onChange={(e) => setField('weight_kg', e.target.value)} placeholder="Total Weight (kg)" /><Input value={form.dimensions} onChange={(e) => setField('dimensions', e.target.value)} placeholder="Dimensions (LxWxH cm)" /></div>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-4 text-xl font-semibold text-slate-900">Route and Schedule</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><h4 className="font-semibold text-slate-800">Pickup</h4><div className="relative"><MapPinIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={form.pickup_city} onChange={(e) => setField('pickup_city', e.target.value)} className="pl-9" placeholder="Pickup city" /></div><Input value={form.pickup_address} onChange={(e) => setField('pickup_address', e.target.value)} placeholder="Pickup address" /><div className="relative"><CalendarDaysIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input type="date" value={form.pickup_date} onChange={(e) => setField('pickup_date', e.target.value)} className="pl-9" /></div></div>
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><h4 className="font-semibold text-slate-800">Delivery</h4><div className="relative"><MapPinIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={form.delivery_city} onChange={(e) => setField('delivery_city', e.target.value)} className="pl-9" placeholder="Delivery city" /></div><Input value={form.delivery_address} onChange={(e) => setField('delivery_address', e.target.value)} placeholder="Delivery address" /><div className="relative"><CalendarDaysIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input type="date" value={form.delivery_date} onChange={(e) => setField('delivery_date', e.target.value)} className="pl-9" /></div></div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">Route preview: <span className="font-semibold">{form.pickup_city} -&gt; {form.delivery_city}</span> • {distanceKm} km • ETA {etaHours}h</div>
                </div>
              )}
              {step === 3 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold text-slate-900">Driver and Vehicle Assignment</h3><button type="button" onClick={() => setAutoDispatch((v) => !v)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${autoDispatch ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-300 bg-white text-slate-600'}`}>Auto-dispatch {autoDispatch ? 'On' : 'Off'}</button></div>

                  <div className="grid gap-3 lg:grid-cols-3">{suggestions.slice(0, 3).map((m, idx) => { const active = selectedDriverId === m.driver.id; return (<button key={m.driver.id} type="button" onClick={() => { setSelectedDriverId(m.driver.id); setSelectedVehicleId(m.vehicle?.id); }} className={`rounded-2xl border p-4 text-left ${active ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className="flex items-center justify-between"><p className="text-base font-semibold text-slate-900">{m.name}</p>{idx === 0 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">Suggested</span>}</div><p className="mt-1 text-xs text-slate-500">Rating {m.rating.toFixed(1)}</p><div className="mt-3 space-y-1 text-xs text-slate-600"><p>Vehicle: <span className="font-semibold text-slate-800">{m.vehicle?.registration_number || 'Unassigned'}</span></p><p>Capacity: <span className="font-semibold text-slate-800">{m.availability}% available</span></p><p>Distance: <span className="font-semibold text-slate-800">{m.awayKm} km away</span></p></div></button>); })}</div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-3xl font-semibold text-slate-900">Review and Confirm</h3>
                  <p className="text-slate-600">Please verify shipment details before dispatching the driver.</p>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between"><h4 className="text-xl font-semibold text-slate-900">Shipment Summary</h4><button className="text-sm font-semibold text-orange-600" onClick={() => setStep(1)}>Edit</button></div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm"><p><span className="text-slate-500">Customer:</span> <span className="font-semibold text-slate-900">{selectedCustomer?.company_name || 'Unselected'}</span></p><p><span className="text-slate-500">Cargo Type:</span> <span className="font-semibold text-slate-900">{titleize(form.cargo_type)}</span></p><p><span className="text-slate-500">Total Weight:</span> <span className="font-semibold text-slate-900">{parseNum(form.weight_kg)} kg</span></p><p><span className="text-slate-500">Reference:</span> <span className="font-semibold text-slate-900">#{form.customer_id}-{distanceKm}</span></p></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between"><h4 className="text-xl font-semibold text-slate-900">Route Details</h4><button className="text-sm font-semibold text-orange-600" onClick={() => setStep(2)}>Edit</button></div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm"><p><span className="text-slate-500">Pickup:</span> <span className="font-semibold text-slate-900">{form.pickup_city}</span></p><p><span className="text-slate-500">Drop-off:</span> <span className="font-semibold text-slate-900">{form.delivery_city}</span></p><p><span className="text-slate-500">Distance:</span> <span className="font-semibold text-slate-900">{distanceKm} km</span></p><p><span className="text-slate-500">Est Duration:</span> <span className="font-semibold text-slate-900">{etaHours}h</span></p></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between"><h4 className="text-xl font-semibold text-slate-900">Assignment</h4><button className="text-sm font-semibold text-orange-600" onClick={() => setStep(3)}>Edit</button></div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm"><p><span className="text-slate-500">Driver:</span> <span className="font-semibold text-slate-900">{suggestions.find((m) => m.driver.id === selectedDriverId)?.name || 'Not assigned'}</span></p><p><span className="text-slate-500">Vehicle:</span> <span className="font-semibold text-slate-900">{suggestions.find((m) => m.vehicle?.id === selectedVehicleId)?.vehicle?.registration_number || 'Not assigned'}</span></p></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between"><h4 className="text-xl font-semibold text-slate-900">Financial Breakdown</h4><button className="text-sm font-semibold text-orange-600" onClick={() => setStep(1)}>Edit</button></div>
                    <div className="space-y-2 text-sm"><p className="flex justify-between"><span className="text-slate-500">Base Freight Rate</span><span className="font-semibold text-slate-900">{new Intl.NumberFormat(undefined, { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(parseNum(form.base_price))}</span></p><p className="flex justify-between"><span className="text-slate-500">Fuel Surcharge</span><span className="font-semibold text-slate-900">{new Intl.NumberFormat(undefined, { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(Math.round((distanceKm / 100) * 12))}</span></p><p className="flex justify-between"><span className="text-slate-500">Insurance and Fees</span><span className="font-semibold text-slate-900">$0.00</span></p><p className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-lg"><span className="font-semibold text-slate-900">Total Quote</span><span className="font-semibold text-orange-700">{new Intl.NumberFormat(undefined, { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(estimatedCost)}</span></p></div>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-lg font-semibold text-slate-900">Live Summary</h4>
                <div className="mt-3 space-y-3 text-sm">
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Customer</p><p className="font-medium text-slate-900">{selectedCustomer?.company_name || 'No customer selected yet'}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Cargo Type</p><p className="font-medium text-slate-900">{titleize(form.cargo_type)}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Total Weight</p><p className="font-medium text-slate-900">{parseNum(form.weight_kg).toLocaleString()} kg</p></div>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-sm text-slate-600">Estimated Cost</p><p className="text-3xl font-semibold text-orange-700">{new Intl.NumberFormat(undefined, { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(estimatedCost)}</p></div>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 text-sm">
                <p className="font-semibold text-orange-700">Need help?</p>
                <p className="mt-1 text-slate-700">If you cannot find a customer, create them first in CRM.</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={special.tailgate} onChange={(e) => setSpecial((p) => ({ ...p, tailgate: e.target.checked }))} />Tailgate Lift</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={special.multiStop} onChange={(e) => setSpecial((p) => ({ ...p, multiStop: e.target.checked }))} />Multi-stop</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={special.weekend} onChange={(e) => setSpecial((p) => ({ ...p, weekend: e.target.checked }))} />Weekend delivery</label>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </ModalShell>
  );
};

export default AddBookingModal;
