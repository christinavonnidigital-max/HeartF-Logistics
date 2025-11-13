
import React, { useState } from 'react';
import { mockVehicles } from '../data/mockData';
import { Vehicle } from '../types';
import VehicleDetails from './VehicleDetails';
import FleetAssistant from './FleetAssistant';
import { PlusIcon } from './icons/Icons';

const FleetDashboard: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(mockVehicles[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col h-[calc(100vh-100px)]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Vehicle Fleet ({mockVehicles.length})</h2>
          <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition">
            <PlusIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="overflow-y-auto">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockVehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                  selectedVehicle?.id === vehicle.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.registration_number}</p>
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
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 h-[calc(100vh-100px)]">
        {selectedVehicle ? (
          <VehicleDetails vehicle={selectedVehicle} />
        ) : (
          <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <p className="text-gray-500">Select a vehicle to see details</p>
          </div>
        )}
      </div>
      <FleetAssistant />
    </div>
  );
};

export default FleetDashboard;
