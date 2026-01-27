import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, VehicleStatus, VehicleExpense, VehicleType } from '../types';
import { useData } from '../contexts/DataContext';
import { mockExpenses } from '../data/mockData';
import VehicleDetails from './VehicleDetails';
import {
  PlusIcon,
  SearchIcon,
  GaugeIcon,
  TruckIcon,
  WrenchIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from './icons';
import { IllustrationTruckIcon } from './icons';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';
import { StatusPill, ShellCard, PageHeader, Button } from "./UiKit";
import type { AppSettings } from '../App';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';

interface FleetDashboardProps {
  settings: AppSettings;
}

const FleetDashboard: React.FC<FleetDashboardProps> = ({ settings }) => {
  const { vehicles, maintenance, addVehicle, deleteVehicle, updateVehicle, logAuditEvent } = useData();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'dueSoon'>('all');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  const [expenses, setExpenses] = useState<VehicleExpense[]>(() =>
    [...mockExpenses].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  );

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const vehicleCsvColumns = [
    { key: 'registration_number', header: 'Registration' },
    { key: 'make', header: 'Make' },
    { key: 'model', header: 'Model' },
    { key: 'year', header: 'Year' },
    { key: 'vehicle_type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'capacity_tonnes', header: 'Capacity (t)' },
    { key: 'current_km', header: 'Current KM' },
    { key: 'next_service_due_km', header: 'Next Service KM' },
  ];

  const vehicleXlsxColumns = vehicleCsvColumns.map((col) => ({
    title: col.header,
    key: col.key,
    width: 20,
  }));

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (serviceFilter === 'dueSoon') {
      list = list.filter((vehicle) => {
        const remaining = (vehicle.next_service_due_km ?? 0) - (vehicle.current_km ?? 0);
        return remaining <= settings.serviceDueSoonKm;
      });
    }

    if (!searchTerm) return list;

    const q = searchTerm.toLowerCase();
    return list.filter(vehicle =>
      vehicle.registration_number.toLowerCase().includes(q) ||
      vehicle.make.toLowerCase().includes(q) ||
      vehicle.model.toLowerCase().includes(q)
    );
  }, [vehicles, searchTerm, serviceFilter, settings.serviceDueSoonKm]);

  useEffect(() => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
      return;
    }

    if (selectedVehicle && !filteredVehicles.find(v => v.id === selectedVehicle.id)) {
      setSelectedVehicle(filteredVehicles.length > 0 ? filteredVehicles[0] : null);
    }
  }, [searchTerm, selectedVehicle, filteredVehicles]);

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
    setExpenses(prev =>
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

  const handleExportCsv = () => downloadCsv(vehicles, vehicleCsvColumns as any, 'fleet');
  const handleExportXlsx = () => downloadXlsx(vehicles, vehicleXlsxColumns as any, 'fleet');

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

  // Metrics (keep, but make them compact)
  const totalVehicles = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const utilizationPercentage = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

  const panelCols = isLeftPanelCollapsed
    ? 'lg:grid-cols-[64px_minmax(0,1fr)]'
    : 'lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]';

  const rosterHeader = (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">Fleet roster</div>
              <div className="text-xs text-slate-500">({totalVehicles})</div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <div className="inline-flex items-center gap-1">
                <GaugeIcon className="w-3.5 h-3.5" />
                <span>{utilizationPercentage}% active</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="inline-flex items-center gap-1">
                <WrenchIcon className="w-3.5 h-3.5" />
                <span>{maintenanceCount} in maintenance</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              aria-label={isLeftPanelCollapsed ? 'Expand roster' : 'Collapse roster'}
              title={isLeftPanelCollapsed ? 'Expand roster' : 'Collapse roster'}
            >
              {isLeftPanelCollapsed ? (
                <ChevronRightIcon className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center"
              onClick={() => setIsAddVehicleModalOpen(true)}
              aria-label="Add vehicle"
              title="Add vehicle"
            >
              <PlusIcon className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Compact toolbar */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search registration, make, model…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setServiceFilter(serviceFilter === 'dueSoon' ? 'all' : 'dueSoon')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                serviceFilter === 'dueSoon'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              Service due soon
            </button>

            <div className="text-[11px] text-slate-500">
              {serviceFilter === 'dueSoon' ? `≤ ${settings.serviceDueSoonKm} km` : 'All vehicles'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rosterList = (
    <div className="flex-1 overflow-y-auto">
      {filteredVehicles.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredVehicles.map((vehicle) => {
            const isSelected = selectedVehicle?.id === vehicle.id;
            const remaining = (vehicle.next_service_due_km ?? 0) - (vehicle.current_km ?? 0);
            const isDueSoon = remaining <= settings.serviceDueSoonKm;

            return (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`w-full text-left px-4 py-3 transition ${
                  isSelected ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {vehicle.registration_number}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {vehicle.make} {vehicle.model}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <div className="inline-flex items-center gap-1">
                        <GaugeIcon className="w-3 h-3" />
                        <span>{vehicle.year}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className={`inline-flex items-center gap-1 ${isDueSoon ? 'text-amber-700' : ''}`}>
                        <WrenchIcon className="w-3 h-3" />
                        <span>Due in {Math.max(0, remaining).toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  <StatusPill
                    label={vehicle.status.replace(/_/g, ' ')}
                    tone={
                      vehicle.status === VehicleStatus.ACTIVE ? 'success'
                        : vehicle.status === VehicleStatus.MAINTENANCE ? 'warn'
                          : vehicle.status === VehicleStatus.OUT_OF_SERVICE ? 'danger'
                            : 'neutral'
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <TruckIcon className="w-7 h-7 text-slate-400" />
          </div>
          <div className="text-sm font-medium text-slate-700">No vehicles found</div>
          <div className="text-xs text-slate-500 mt-1">Try adjusting your search or filter.</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Fleet"
        subtitle="Track vehicles, status, and utilization"
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleExportCsv}>Export CSV</Button>
            <Button variant="ghost" onClick={handleExportXlsx}>Export XLSX</Button>
            <Button variant="secondary" onClick={() => setIsImportOpen(true)}>Import</Button>
            <Button variant="primary" onClick={() => setIsAddVehicleModalOpen(true)}>Add vehicle</Button>
          </div>
        }
      />

      <div className={`grid gap-6 ${panelCols} transition-all duration-200`}>
        {/* Left: roster */}
        <ShellCard className={`p-0 overflow-hidden ${isLeftPanelCollapsed ? 'hidden lg:block' : ''}`}>
          {isLeftPanelCollapsed ? (
            <div className="h-full flex flex-col items-center justify-start pt-4 gap-3">
              <button
                onClick={() => setIsLeftPanelCollapsed(false)}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center"
                aria-label="Expand roster"
                title="Expand roster"
              >
                <ChevronRightIcon className="w-4 h-4 text-slate-600" />
              </button>

              <div className="w-full px-2">
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                  <div className="text-[11px] text-slate-500">Vehicles</div>
                  <div className="text-sm font-semibold text-slate-900">{totalVehicles}</div>
                </div>
              </div>

              <button
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center"
                onClick={() => setIsAddVehicleModalOpen(true)}
                aria-label="Add vehicle"
                title="Add vehicle"
              >
                <PlusIcon className="w-5 h-5 text-slate-800" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-[calc(100vh-10.5rem)] lg:h-[calc(100vh-8rem)]">
              {rosterHeader}
              {rosterList}
            </div>
          )}
        </ShellCard>

        {/* Right: details */}
        <div className="flex flex-col min-h-[60vh]">
          {selectedVehicle ? (
            <VehicleDetails
              vehicle={selectedVehicle}
              maintenance={maintenance}
              expenses={expenses}
              onAddExpenseClick={() => setIsAddExpenseModalOpen(true)}
              onDeleteVehicle={() => handleDeleteVehicle(selectedVehicle.id)}
              onArchiveVehicle={() => handleArchiveVehicle(selectedVehicle)}
              onUpdateOdometer={(nextKm) => handleUpdateOdometer(selectedVehicle, nextKm)}
            />
          ) : (
            <EmptyState
              icon={<IllustrationTruckIcon />}
              title={vehicles.length > 0 ? "Select a Vehicle" : "No Vehicles in Fleet"}
              message={vehicles.length > 0 ? "Choose a vehicle from the roster to view details." : "Get started by adding your first vehicle."}
            />
          )}
        </div>
      </div>

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
