
import React from 'react';
import { Vehicle, VehicleMaintenance, VehicleExpense } from '../types';
import { mockMaintenance, mockExpenses } from '../data/mockData';
import { CalendarIcon, CogIcon, DollarIcon, GaugeIcon, RoadIcon, WrenchIcon } from './icons/Icons';

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center">
    <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);


const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle }) => {
  const maintenanceHistory = mockMaintenance.filter((m) => m.vehicle_id === vehicle.id);
  const expenseHistory = mockExpenses.filter((e) => e.vehicle_id === vehicle.id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-y-auto h-full">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">{vehicle.registration_number}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-5 h-5"/>} label="Current KM" value={vehicle.current_km.toLocaleString()} />
        <StatCard icon={<GaugeIcon className="w-5 h-5"/>} label="Capacity" value={`${vehicle.capacity_tonnes} tonnes`} />
        <StatCard icon={<WrenchIcon className="w-5 h-5"/>} label="Next Service" value={`${vehicle.next_service_due_km.toLocaleString()} km`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><CogIcon className="w-5 h-5 mr-2"/>Maintenance</h4>
          <div className="space-y-3">
            {maintenanceHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold">{item.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.service_date).toLocaleDateString()} - ${item.cost}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><DollarIcon className="w-5 h-5 mr-2"/>Expenses</h4>
           <div className="space-y-3">
            {expenseHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold">{item.description} ({item.expense_type})</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.expense_date).toLocaleDateString()} - {item.amount} {item.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
