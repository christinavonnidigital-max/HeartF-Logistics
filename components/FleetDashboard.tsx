
import React, { useState, useMemo, useEffect } from 'react';
import { mockVehicles, mockExpenses } from '../data/mockData';
import { Vehicle, VehicleStatus, VehicleExpense } from '../types';
import VehicleDetails from './VehicleDetails';
import { PlusIcon, SearchIcon, IllustrationTruckIcon, GaugeIcon, TruckIcon, WrenchIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';
import { ShellCard, SectionHeader, StatusPill, SubtleCard } from "./UiKit";

const FleetDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles.length > 0 ? vehicles[0] : null);
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
      id: Date.now(), // Simple unique ID for mock data
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setVehicles(prev => [newVehicle, ...prev]);
    setIsAddVehicleModalOpen(false);
    setSelectedVehicle(newVehicle);
  };
  
  const handleDeleteVehicle = (id: number) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
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
        recorded_by: 1, // Assuming user ID 1 is recording
        created_at: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpenseWithId].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()));
    setIsAddExpenseModalOpen(false);
  };

  // Metrics calculation
  const totalVehicles = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const utilizationPercentage = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Left column - vehicle list */}
        <ShellCard className="flex flex-col p-4">
          <SectionHeader
            title={`Vehicle fleet (${filteredVehicles.length})`}
            subtitle="Tap a truck to see its details"
            actions={
              <button
                className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition flex-shrink-0"
                onClick={() => setIsAddVehicleModalOpen(true)}
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            }
          />

          <div className="mt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Filter by reg. number or make..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="mt-3 -mx-2 px-2 flex-1 space-y-1 overflow-y-auto">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => {
                 const isSelected = selectedVehicle?.id === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 transition ${
                      isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-gray-900 truncate">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-500">{vehicle.registration_number}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <StatusPill
                          label={vehicle.status.replace(/_/g, ' ')}
                          tone={
                            vehicle.status === VehicleStatus.ACTIVE ? 'success'
                            : vehicle.status === VehicleStatus.MAINTENANCE ? 'warn'
                            : vehicle.status === VehicleStatus.OUT_OF_SERVICE ? 'danger'
                            : 'neutral'
                          }
                        />
                        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            Due: {new Intl.NumberFormat().format(vehicle.next_service_due_km)} km
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                  <p>No vehicles found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
              </div>
            )}
          </div>
        </ShellCard>

        {/* Right column - details */}
        <div className="flex flex-col gap-6">
           {/* Utilization Metrics Section */}
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SubtleCard className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <GaugeIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Utilization</p>
                      <p className="text-xl font-bold text-slate-900">{utilizationPercentage}%</p>
                  </div>
              </SubtleCard>
              <SubtleCard className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <TruckIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Active Fleet</p>
                      <p className="text-xl font-bold text-slate-900">{activeVehiclesCount} <span className="text-sm font-normal text-slate-400">/ {totalVehicles}</span></p>
                  </div>
              </SubtleCard>
              <SubtleCard className="p-4 flex items-center gap-3 hidden md:flex">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <WrenchIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Maintenance</p>
                      <p className="text-xl font-bold text-slate-900">{maintenanceCount}</p>
                  </div>
              </SubtleCard>
           </div>

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
               message={vehicles.length > 0 ? "Choose a vehicle from the list to view its details, maintenance history, and expenses." : "Get started by adding your first vehicle to the fleet."}
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
