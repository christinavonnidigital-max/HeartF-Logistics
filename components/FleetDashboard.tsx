import React, { useState, useMemo, useEffect } from 'react';
import { mockVehicles } from '../data/mockData';
import { Vehicle } from '../types';
import VehicleDetails from './VehicleDetails';
import { PlusIcon, SearchIcon } from './icons/Icons';

const FleetDashboard: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(mockVehicles.length > 0 ? mockVehicles[0] : null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) {
      return mockVehicles;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return mockVehicles.filter(vehicle =>
      vehicle.registration_number.toLowerCase().includes(lowercasedFilter) ||
      vehicle.make.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm]);

  useEffect(() => {
    // If the currently selected vehicle is not in the filtered list, clear the selection.
    if (selectedVehicle && !filteredVehicles.find(v => v.id === selectedVehicle.id)) {
      setSelectedVehicle(null);
    }
  }, [searchTerm, selectedVehicle, filteredVehicles]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col h-[calc(100vh-100px)]">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Vehicle Fleet ({filteredVehicles.length})</h2>
            <button 
                className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                onClick={() => alert('Add Vehicle form would open here.')}
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedVehicle?.id === vehicle.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-gray-500">{vehicle.registration_number}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        vehicle.status
                      )}`}
                    >
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
                <p>No vehicles found for "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 h-[calc(100vh-100px)]">
        {selectedVehicle ? (
          <VehicleDetails vehicle={selectedVehicle} />
        ) : (
          <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md">
            <p className="text-gray-500">Select a vehicle to see details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetDashboard;