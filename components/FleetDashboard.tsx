import React, { useEffect, useMemo, useState } from 'react';
import { Vehicle, VehicleStatus, VehicleExpense, VehicleType, Booking } from '../types';
import { useData } from '../contexts/DataContext';
import { mockExpenses } from '../data/mockData';
import VehicleDetails from './VehicleDetails';
import {
  SearchIcon,
  GaugeIcon,
  TruckIcon,
  WrenchIcon,
  MapPinIcon,
} from './icons';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';
import { StatusPill, Button } from "./UiKit";
import type { AppSettings } from '../App';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';
import { buildVehicleCsvColumns, buildVehicleXlsxColumns } from '../dataIO/vehicleExportColumns';

type FleetFilter = 'all' | 'in_transit' | 'maintenance' | 'available';

interface FleetDashboardProps {
  settings: AppSettings;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const toTitle = (v: string) =>
  String(v)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const FleetDashboard: React.FC<FleetDashboardProps> = ({ settings }) => {
  const {
    vehicles,
    maintenance,
    addVehicle,
    deleteVehicle,
    updateVehicle,
    logAuditEvent,
    gpsLocations,
    bookings,
    drivers,
    users,
  } = useData();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fleetFilter, setFleetFilter] = useState<FleetFilter>('all');

  const [expenses, setExpenses] = useState<VehicleExpense[]>(() =>
    [...mockExpenses].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  );

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const activeBookingByVehicleId = useMemo(() => {
    const map = new Map<number, Booking>();
    const activeStates = new Set(['pending', 'scheduled', 'confirmed', 'dispatched', 'in_transit']);

    const sorted = [...(bookings || [])].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    sorted.forEach((booking) => {
      if (!booking.vehicle_id) return;
      if (!activeStates.has(String(booking.status))) return;
      if (!map.has(booking.vehicle_id)) {
        map.set(booking.vehicle_id, booking);
      }
    });

    return map;
  }, [bookings]);

  const driverNameById = useMemo(() => {
    const userById = new Map<string, any>();
    users.forEach((u) => userById.set(String(u.id), u));

    const out = new Map<number, string>();
    drivers.forEach((d) => {
      const u = userById.get(String(d.user_id));
      const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '';
      out.set(d.id, name || `Driver #${d.id}`);
    });

    return out;
  }, [drivers, users]);

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
      users.reduce<Record<string, (typeof users)[number] | undefined>>((acc, user) => {
        acc[String(user.id)] = user;
        return acc;
      }, {}),
    [users],
  );

  const activeBookingByVehicleIdRecord = useMemo(() => {
    const record: Record<number, Booking | undefined> = {};
    activeBookingByVehicleId.forEach((booking, vehicleId) => {
      record[vehicleId] = booking;
    });
    return record;
  }, [activeBookingByVehicleId]);

  const vehicleCsvColumns = useMemo(
    () =>
      buildVehicleCsvColumns({
        activeBookingByVehicleId: activeBookingByVehicleIdRecord,
        driverById,
        userById: userByIdRecord,
      }),
    [activeBookingByVehicleIdRecord, driverById, userByIdRecord],
  );

  const vehicleXlsxColumns = useMemo(
    () =>
      buildVehicleXlsxColumns({
        activeBookingByVehicleId: activeBookingByVehicleIdRecord,
        driverById,
        userById: userByIdRecord,
      }),
    [activeBookingByVehicleIdRecord, driverById, userByIdRecord],
  );

  const classifyVehicle = (vehicle: Vehicle): FleetFilter => {
    if ([VehicleStatus.MAINTENANCE, VehicleStatus.OUT_OF_SERVICE].includes(vehicle.status)) {
      return 'maintenance';
    }

    const activeBooking = activeBookingByVehicleId.get(vehicle.id);
    if (activeBooking && ['dispatched', 'in_transit'].includes(String(activeBooking.status))) {
      return 'in_transit';
    }

    if (!activeBooking && vehicle.status === VehicleStatus.ACTIVE) {
      return 'available';
    }

    return 'all';
  };

  const counts = useMemo(() => {
    const all = vehicles.length;
    const inTransit = vehicles.filter((v) => classifyVehicle(v) === 'in_transit').length;
    const inMaintenance = vehicles.filter((v) => classifyVehicle(v) === 'maintenance').length;
    const available = vehicles.filter((v) => classifyVehicle(v) === 'available').length;
    return { all, inTransit, inMaintenance, available };
  }, [vehicles, activeBookingByVehicleId]);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (fleetFilter !== 'all') {
      list = list.filter((v) => classifyVehicle(v) === fleetFilter);
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((vehicle) => {
      const booking = activeBookingByVehicleId.get(vehicle.id);
      const driverName = booking?.driver_id ? driverNameById.get(booking.driver_id) || '' : '';
      return (
        vehicle.registration_number.toLowerCase().includes(q) ||
        vehicle.make.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q) ||
        driverName.toLowerCase().includes(q) ||
        (booking?.pickup_city || '').toLowerCase().includes(q) ||
        (booking?.delivery_city || '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, searchTerm, fleetFilter, activeBookingByVehicleId, driverNameById]);

  useEffect(() => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
      return;
    }

    if (selectedVehicle && !filteredVehicles.find((v) => v.id === selectedVehicle.id)) {
      setSelectedVehicle(filteredVehicles.length > 0 ? filteredVehicles[0] : null);
    }
  }, [selectedVehicle, filteredVehicles]);

  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addVehicle(newVehicle);
    setIsAddVehicleModalOpen(false);
    setSelectedVehicle(newVehicle);
  };

  const handleDeleteVehicle = (id: number) => {
    deleteVehicle(id);
    if (selectedVehicle?.id === id) {
      setSelectedVehicle(null);
    }
  };

  const handleAddExpense = (newExpense: Omit<VehicleExpense, 'id' | 'vehicle_id' | 'created_at' | 'recorded_by'>) => {
    if (!selectedVehicle) return;
    const newExpenseWithId: VehicleExpense = {
      ...newExpense,
      id: Date.now(),
      vehicle_id: selectedVehicle.id,
      recorded_by: 1,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) =>
      [...prev, newExpenseWithId].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
    );
    setIsAddExpenseModalOpen(false);
  };

  const handleUpdateOdometer = (vehicle: Vehicle, nextKm: number) => {
    if (!Number.isFinite(nextKm) || nextKm < 0) return;
    updateVehicle({ ...vehicle, current_km: nextKm });
    setSelectedVehicle((prev) => (prev?.id === vehicle.id ? { ...prev, current_km: nextKm } : prev));
  };

  const handleArchiveVehicle = (vehicle: Vehicle) => {
    updateVehicle({
      ...vehicle,
      status: VehicleStatus.OUT_OF_SERVICE,
      updated_at: new Date().toISOString(),
    });
    setSelectedVehicle({ ...vehicle, status: VehicleStatus.OUT_OF_SERVICE });
  };

  const handleUpdateVehicleDetails = (next: Vehicle) => {
    updateVehicle(next);
    setSelectedVehicle(next);
  };

  const todayStamp = new Date().toISOString().slice(0, 10);
  const handleExportCsv = () => downloadCsv(vehicles, vehicleCsvColumns as any, `fleet-${todayStamp}`);
  const handleExportXlsx = () => downloadXlsx(vehicles, vehicleXlsxColumns as any, `fleet-${todayStamp}`);
  const handleExportVehicleRow = (vehicle: Vehicle) =>
    downloadCsv([vehicle], vehicleCsvColumns as any, `${vehicle.registration_number || `vehicle-${vehicle.id}`}-${todayStamp}`);

  const handleImportVehicles = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
    let success = 0;
    let failed = 0;

    rows.forEach((row) => {
      try {
        const vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> = {
          registration_number: row.registration_number || `NEW-${Date.now()}`,
          make: row.make || 'Unknown',
          model: row.model || 'Unknown',
          year: Number(row.year) || new Date().getFullYear(),
          vehicle_type: Object.values(VehicleType).includes(row.vehicle_type as VehicleType)
            ? (row.vehicle_type as VehicleType)
            : VehicleType.DRY,
          capacity_tonnes: Number(row.capacity_tonnes) || 0,
          status: Object.values(VehicleStatus).includes(row.status as VehicleStatus)
            ? (row.status as VehicleStatus)
            : VehicleStatus.ACTIVE,
          purchase_date: row.purchase_date || new Date().toISOString().split('T')[0],
          purchase_cost: Number(row.purchase_cost) || 0,
          current_value: row.current_value ? Number(row.current_value) : undefined,
          current_km: Number(row.current_km) || 0,
          next_service_due_km: Number(row.next_service_due_km) || 0,
          fuel_type: row.fuel_type || 'diesel',
          last_service_date: row.last_service_date || new Date().toISOString().split('T')[0],
          notes: row.notes || '',
        } as any;

        addVehicle(vehicle);
        success += 1;
      } catch {
        failed += 1;
      }
    });

    logAuditEvent({
      action: 'data.import',
      entity: { type: 'vehicle' },
      meta: { imported: success, failed: failed || meta.failed, source: 'fleet.import' },
    });
  };

  const capacityLbs = vehicles.reduce((sum, v) => sum + Number(v.capacity_tonnes || 0), 0) * 2204.62;
  const activeVehiclesCount = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE).length;
  const readinessPct = vehicles.length ? Math.round((activeVehiclesCount / vehicles.length) * 100) : 0;
  const avgServiceBufferKm = vehicles.length
    ? Math.round(
        vehicles.reduce((sum, v) => sum + Math.max(0, Number(v.next_service_due_km || 0) - Number(v.current_km || 0)), 0) /
          vehicles.length
      )
    : 0;

  const filterTabs: Array<{ key: FleetFilter; label: string; count: number }> = [
    { key: 'all', label: 'All Vehicles', count: counts.all },
    { key: 'in_transit', label: 'In Transit', count: counts.inTransit },
    { key: 'maintenance', label: 'In Maintenance', count: counts.inMaintenance },
    { key: 'available', label: 'Available', count: counts.available },
  ];

  return (
    <>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Dashboard / Fleet Management</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Fleet Management</h1>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-[360px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search vehicle, driver, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <Button variant="primary" onClick={() => setIsAddVehicleModalOpen(true)}>Add New Vehicle</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFleetFilter(tab.key)}
                className={`inline-flex items-center gap-2 border-b-2 pb-2 text-sm font-semibold transition ${
                  fleetFilter === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${fleetFilter === tab.key ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleExportCsv}>Export CSV</Button>
            <Button variant="ghost" onClick={handleExportXlsx}>Export XLSX</Button>
            <Button variant="secondary" onClick={() => setIsImportOpen(true)}>Import</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Total Fleet Capacity</p>
              <div className="rounded-xl bg-blue-100 p-2 text-blue-700"><TruckIcon className="h-4 w-4" /></div>
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{Math.round(capacityLbs).toLocaleString()} <span className="text-lg text-slate-500">lbs</span></p>
            <p className="mt-2 text-xs text-emerald-700">+2.4% vs last month</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Avg. Service Buffer</p>
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700"><WrenchIcon className="h-4 w-4" /></div>
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{avgServiceBufferKm.toLocaleString()} <span className="text-lg text-slate-500">km</span></p>
            <p className="mt-2 text-xs text-slate-500">Before next scheduled service</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Fleet Readiness</p>
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><GaugeIcon className="h-4 w-4" /></div>
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{readinessPct}%</p>
            <p className="mt-2 text-xs text-slate-500">Active and available vehicles</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Next Service</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Telematics</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No vehicles match this filter.
                  </td>
                </tr>
              )}

              {filteredVehicles.map((vehicle) => {
                const booking = activeBookingByVehicleId.get(vehicle.id);
                const driverName = booking?.driver_id ? driverNameById.get(booking.driver_id) || `Driver #${booking.driver_id}` : 'Unassigned';

                const remainingKm = Math.max(0, Number(vehicle.next_service_due_km || 0) - Number(vehicle.current_km || 0));
                const serviceDate = vehicle.next_service_due_date ? new Date(vehicle.next_service_due_date).toLocaleDateString() : 'Not scheduled';
                const serviceLabel = remainingKm === 0 ? 'Due now' : `In ${remainingKm.toLocaleString()} km`;

                const statusKey = booking?.status ? String(booking.status) : String(vehicle.status);
                const statusTone =
                  statusKey === 'in_transit' || statusKey === 'dispatched'
                    ? 'info'
                    : statusKey === 'maintenance' || statusKey === 'out_of_service'
                    ? 'warn'
                    : statusKey === 'active' || statusKey === 'available'
                    ? 'success'
                    : 'neutral';

                const gps = gpsLocations[vehicle.id];
                const locationLabel = booking
                  ? `${booking.delivery_city}, ${booking.delivery_country || ''}`.trim().replace(/,\s*$/, '')
                  : gps
                  ? `${gps.latitude.toFixed(2)}, ${gps.longitude.toFixed(2)}`
                  : 'HQ Depot';

                const fuelPct = clamp(
                  Number(vehicle.next_service_due_km || 0) > 0
                    ? Math.round((1 - Number(vehicle.current_km || 0) / Number(vehicle.next_service_due_km || 1)) * 100)
                    : 60,
                  8,
                  100
                );
                const batteryPct = clamp(Number(gps?.battery_level ?? 92), 20, 100);

                const isSelected = selectedVehicle?.id === vehicle.id;

                return (
                  <tr
                    key={vehicle.id}
                    className={`border-t border-slate-200 text-slate-800 transition ${isSelected ? 'bg-orange-50/50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <td className="px-5 py-4">
                      <button type="button" className="flex items-center gap-3 text-left" onClick={() => setSelectedVehicle(vehicle)}>
                        <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                          <TruckIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{vehicle.registration_number}</div>
                          <div className="text-sm text-slate-500">{vehicle.make} {vehicle.model} • {vehicle.year}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill label={toTitle(statusKey)} tone={statusTone as any} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{driverName}</div>
                      <div className="text-xs text-slate-500">{booking ? booking.booking_number : 'No assignment'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{serviceDate}</div>
                      <div className={`text-xs ${remainingKm === 0 ? 'text-rose-600' : 'text-slate-500'}`}>{serviceLabel}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 text-slate-700">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        <span>{locationLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] w-10 text-slate-500">Fuel</span>
                          <div className="h-2 w-20 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${fuelPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{fuelPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] w-10 text-slate-500">Batt</span>
                          <div className="h-2 w-20 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${batteryPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{batteryPct}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportVehicleRow(vehicle)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>
            Showing <span className="font-semibold text-slate-900">{filteredVehicles.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{vehicles.length}</span> vehicles
          </p>
          <div className="hidden sm:flex items-center gap-2">
            <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-500" disabled>
              Previous
            </button>
            <button className="rounded-xl bg-slate-900 px-3 py-1.5 text-white">Next</button>
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Vehicle Detail</h2>
            <Button variant="ghost" onClick={() => setSelectedVehicle(null)}>Hide detail</Button>
          </div>

          <VehicleDetails
            vehicle={selectedVehicle}
            maintenance={maintenance}
            expenses={expenses}
            onAddExpenseClick={() => setIsAddExpenseModalOpen(true)}
            onDownloadProfile={() => handleExportVehicleRow(selectedVehicle)}
            onDeleteVehicle={() => handleDeleteVehicle(selectedVehicle.id)}
            onArchiveVehicle={() => handleArchiveVehicle(selectedVehicle)}
            onUpdateOdometer={(nextKm) => handleUpdateOdometer(selectedVehicle, nextKm)}
            onUpdateVehicleDetails={handleUpdateVehicleDetails}
          />
        </div>
      )}

      {isAddExpenseModalOpen && selectedVehicle && (
        <AddExpenseModal
          onClose={() => setIsAddExpenseModalOpen(false)}
          onAddExpense={handleAddExpense}
        />
      )}

      {isAddVehicleModalOpen && (
        <AddVehicleModal
          onClose={() => setIsAddVehicleModalOpen(false)}
          onAddVehicle={handleAddVehicle}
        />
      )}

      {isImportOpen && (
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import vehicles"
          description="Upload a CSV with vehicle details and map columns to fleet fields."
          targetFields={[
            { key: 'registration_number', label: 'Registration', required: true },
            { key: 'make', label: 'Make', required: true },
            { key: 'model', label: 'Model', required: true },
            { key: 'year', label: 'Year' },
            { key: 'vehicle_type', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'capacity_tonnes', label: 'Capacity (t)' },
            { key: 'current_km', label: 'Current KM' },
            { key: 'next_service_due_km', label: 'Next Service KM' },
          ]}
          onImport={handleImportVehicles}
        />
      )}
    </>
  );
};

export default FleetDashboard;

