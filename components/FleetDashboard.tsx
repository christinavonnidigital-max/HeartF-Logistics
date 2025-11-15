import React, { useState, useMemo, useEffect } from 'react';
import { mockVehicles, mockExpenses } from '../data/mockData';
import { Vehicle, VehicleStatus, VehicleExpense } from '../types';
import VehicleDetails from './VehicleDetails';
import { PlusIcon, SearchIcon, IllustrationTruckIcon, CheckCircleIcon, WrenchIcon, TrashIcon, ExclamationTriangleIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import AddVehicleModal from './AddVehicleModal';

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


  const getStatusPill = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> Active</span>;
      case VehicleStatus.MAINTENANCE:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><WrenchIcon className="w-4 h-4"/> Maintenance</span>;
      case VehicleStatus.RETIRED:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 flex items-center gap-1"><TrashIcon className="w-4 h-4"/> Retired</span>;
      case VehicleStatus.OUT_OF_SERVICE:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4"/> Out of Service</span>;
      default:
        // FIX: TypeScript infers `status` as `never` because all enum cases are handled.
        // Casting to string allows the code to compile and handle any future enum values gracefully.
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">{(status as string).replace('_', ' ')}</span>;
    }
  };

  const getStatusBorder = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return 'border-green-500';
      case VehicleStatus.MAINTENANCE:
        return 'border-yellow-500';
      case VehicleStatus.RETIRED:
        return 'border-gray-400';
      case VehicleStatus.OUT_OF_SERVICE:
        return 'border-red-500';
      default:
        return 'border-transparent';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vehicle Fleet ({filteredVehicles.length})</h2>
              <button 
                  className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                  onClick={() => setIsAddVehicleModalOpen(true)}
              >
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by reg. number or make..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredVehicles.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <li
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`py-4 pr-4 pl-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${
                      selectedVehicle?.id === vehicle.id 
                        ? 'bg-orange-50 border-orange-500' 
                        : getStatusBorder(vehicle.status)
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-500">{vehicle.registration_number}</p>
                      </div>
                      {getStatusPill(vehicle.status)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                  <p>No vehicles found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedVehicle ? (
            <VehicleDetails 
                vehicle={selectedVehicle}
                expenses={expenses}
                onAddExpenseClick={() => setIsAddExpenseModalOpen(true)}
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