
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, VehicleStatus, VehicleExpense, VehicleType } from '../types';
import { useData } from '../contexts/DataContext';
import { mockExpenses } from '../data/mockData'; 
import VehicleDetails from './VehicleDetails';
import { PlusIcon, SearchIcon, GaugeIcon, TruckIcon, WrenchIcon, TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { IllustrationTruckIcon } from './icons';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';
import { SectionHeader, StatusPill, ShellCard, PageHeader, Button, StatCard } from "./UiKit";
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
  const [isRosterOpen, setIsRosterOpen] = useState(true);
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

    if (!searchTerm) {
      return list;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return list.filter(vehicle =>
      vehicle.registration_number.toLowerCase().includes(lowercasedFilter) ||
      vehicle.make.toLowerCase().includes(lowercasedFilter)
    );
  }, [vehicles, searchTerm, serviceFilter]);

  useEffect(() => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
    } else if (selectedVehicle && !filteredVehicles.find(v => v.id === selectedVehicle.id)) {
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
    setExpenses(prev => [...prev, newExpenseWithId].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()));
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
          vehicle_type: Object.values(VehicleType).includes(row.vehicle_type as VehicleType) ? (row.vehicle_type as VehicleType) : VehicleType.DRY,
          capacity_tonnes: Number(row.capacity_tonnes) || 0,
          status: Object.values(VehicleStatus).includes(row.status as VehicleStatus) ? (row.status as VehicleStatus) : VehicleStatus.ACTIVE,
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

  // Metrics
  const totalVehicles = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const utilizationPercentage = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

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
      <div className={`grid gap-8 h-auto lg:h-[calc(100vh-8rem)] transition-all duration-300 ${
        isLeftPanelCollapsed
          ? 'lg:grid-cols-[60px_minmax(0,1fr)]'
          : 'lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]'
      }`}>
        {/* Left column - vehicle list */}
        <div className={`flex flex-col gap-5 h-full lg:overflow-hidden relative transition-all duration-300 ${
          isLeftPanelCollapsed ? 'lg:w-15' : ''
        }`}>
            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                className={`hidden lg:flex items-center justify-center absolute z-20 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 transition-all duration-300 hover:bg-white hover:border-slate-300 ${
                    isLeftPanelCollapsed
                        ? 'top-4 left-1/2 -translate-x-1/2 w-8 h-8 shadow-md'
                        : 'top-3 right-3 w-7 h-7 opacity-40 hover:opacity-100 shadow-sm'
                }`}
                aria-label={isLeftPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
                {isLeftPanelCollapsed ? (
                    <ChevronRightIcon className="w-4 h-4 text-slate-600" />
                ) : (
                    <ChevronLeftIcon className="w-4 h-4 text-slate-600" />
                )}
            </button>
            {/* Metrics Row */}
            <div className={`grid grid-cols-2 gap-4 shrink-0 transition-opacity duration-300 ${
              isLeftPanelCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'
            }`}>
              <StatCard label="Utilization" value={`${utilizationPercentage}%`} hint="Vehicles active" icon={<GaugeIcon className="w-6 h-6" />} />
              <StatCard label="Maintenance" value={maintenanceCount} hint="Vehicles" icon={<WrenchIcon className="w-6 h-6" />} />
            </div>

            <ShellCard className={`flex flex-col p-0 overflow-hidden transition-opacity duration-300 ${
                isLeftPanelCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'
            } ${isRosterOpen ? 'flex-1 min-h-100 lg:min-h-0' : 'shrink-0'}`}>
            <div className="p-5 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Fleet Roster</h2>
                        <p className="text-xs text-slate-500 mt-1">{totalVehicles} total vehicles</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition text-xs font-semibold"
                            onClick={() => setIsRosterOpen(!isRosterOpen)}
                        >
                            {isRosterOpen ? 'Hide' : 'Show'}
                        </button>
                        <button
                          className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition shadow-sm"
                          onClick={() => setIsAddVehicleModalOpen(true)}
                          aria-label="Add vehicle"
                          title="Add vehicle"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {isRosterOpen && (
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                          type="text"
                          placeholder="Search reg, make, model..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all py-2.5"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setServiceFilter(serviceFilter === 'dueSoon' ? 'all' : 'dueSoon')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          serviceFilter === 'dueSoon'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600'
                        }`}
                        type="button"
                      >
                        Service due soon
                      </button>
                      <span className="text-[11px] text-slate-500">
                        {serviceFilter === 'dueSoon'
                          ? `Within ${settings.serviceDueSoonKm} km`
                          : 'Showing all'}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {isRosterOpen && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
                    {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicle?.id === vehicle.id;
                        return (
                        <button
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle)}
                            className={`w-full text-left rounded-xl p-4 transition-all duration-200 border-2 shadow-sm group relative ${
                            isSelected
                                ? "bg-linear-to-br from-white to-orange-50/30 border-orange-500 ring-2 ring-orange-500/30 shadow-lg z-10"
                                : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-md hover:bg-slate-50/50"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-slate-900 text-base">{vehicle.registration_number}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{vehicle.make} {vehicle.model}</p>
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
                            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 mt-2">
                                <div className="flex items-center gap-1">
                                    <GaugeIcon className="w-3 h-3" />
                                    <span>{vehicle.year}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${vehicle.next_service_due_km - vehicle.current_km < 1000 ? 'text-amber-600 font-medium' : ''}`}>
                                    <WrenchIcon className="w-3 h-3" />
                                    <span>Due in {(vehicle.next_service_due_km - vehicle.current_km).toLocaleString()} km</span>
                                </div>
                            </div>
                        </button>
                        )
                    })
                    ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-500">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <TruckIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No vehicles found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
                    </div>
                    )}
                </div>
            )}
            {!isRosterOpen && (
                <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-100 bg-white">
                    Roster hidden. Click “Show” to expand.
                </div>
            )}
            </ShellCard>
        </div>

        {/* Right column - details */}
        <div className="flex flex-col h-full lg:overflow-hidden">
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
               message={vehicles.length > 0 ? "Choose a vehicle from the list to view details." : "Get started by adding your first vehicle."}
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
