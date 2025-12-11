
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, VehicleStatus, VehicleExpense } from '../types';
import { useData } from '../contexts/DataContext';
import { mockExpenses } from '../data/mockData'; 
import VehicleDetails from './VehicleDetails';
import { PlusIcon, SearchIcon, IllustrationTruckIcon, GaugeIcon, TruckIcon, WrenchIcon, TrendingUpIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';
import { ShellCard, SectionHeader, StatusPill } from "./UiKit";

const FleetDashboard: React.FC = () => {
  const { vehicles, addVehicle, deleteVehicle } = useData();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState<VehicleExpense[]>(() => 
    [...mockExpenses].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  );
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) {
      return vehicles;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return vehicles.filter(vehicle =>
      vehicle.registration_number.toLowerCase().includes(lowercasedFilter) ||
      vehicle.make.toLowerCase().includes(lowercasedFilter)
    );
  }, [vehicles, searchTerm]);

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

  // Metrics
  const totalVehicles = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const utilizationPercentage = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] h-auto lg:h-[calc(100vh-8rem)]">
        {/* Left column - vehicle list */}
        <div className="flex flex-col gap-4 h-full lg:overflow-hidden">
            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <GaugeIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Utilization</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-slate-900">{utilizationPercentage}%</span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+2%</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <WrenchIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Maintenance</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-slate-900">{maintenanceCount}</span>
                        <span className="text-xs text-slate-400">Vehicles</span>
                    </div>
                </div>
            </div>

            <ShellCard className="flex-1 flex flex-col p-0 overflow-hidden min-h-[400px] lg:min-h-0">
            <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fleet Roster</h2>
                    <button
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition"
                        onClick={() => setIsAddVehicleModalOpen(true)}
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search reg, make, model..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all py-2"
                />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 custom-scrollbar">
                {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicle?.id === vehicle.id;
                    return (
                    <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`w-full text-left rounded-xl p-3 transition-all duration-200 border shadow-sm group relative ${
                        isSelected 
                            ? "bg-white border-orange-500 ring-1 ring-orange-500 z-10" 
                            : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-md"
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{vehicle.registration_number}</p>
                                <p className="text-xs text-slate-500">{vehicle.make} {vehicle.model}</p>
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
                        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2 mt-1">
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
                <div className="p-8 text-center text-slate-500">
                    <TruckIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No vehicles found.</p>
                </div>
                )}
            </div>
            </ShellCard>
        </div>

        {/* Right column - details */}
        <div className="flex flex-col h-full lg:overflow-hidden">
          {selectedVehicle ? (
            <VehicleDetails 
                vehicle={selectedVehicle}
                expenses={expenses}
                onAddExpenseClick={() => setIsAddExpenseModalOpen(true)}
                onDeleteVehicle={() => handleDeleteVehicle(selectedVehicle.id)}
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
    </>
  );
};

export default FleetDashboard;
