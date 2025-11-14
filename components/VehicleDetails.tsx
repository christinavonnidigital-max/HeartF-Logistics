
import React from 'react';
import { Vehicle } from '../types';
import { mockMaintenance, mockExpenses } from '../data/mockData';
import { CogIcon, CurrencyDollarIcon, GaugeIcon, RoadIcon, WrenchIcon } from './icons/Icons';

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <button className="bg-gray-50 p-4 rounded-lg flex items-center text-left w-full hover:bg-gray-100 transition" onClick={() => alert(`Viewing details for ${label}`)}>
    <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </button>
);


const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle }) => {
  const maintenanceHistory = mockMaintenance.filter((m) => m.vehicle_id === vehicle.id);
  const expenseHistory = mockExpenses.filter((e) => e.vehicle_id === vehicle.id);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-y-auto">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
        <p className="mt-1 text-md text-gray-500">{vehicle.registration_number}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-6 h-6"/>} label="Current KM" value={vehicle.current_km.toLocaleString()} />
        <StatCard icon={<GaugeIcon className="w-6 h-6"/>} label="Capacity" value={`${vehicle.capacity_tonnes} t`} />
        <StatCard icon={<WrenchIcon className="w-6 h-6"/>} label="Next Service" value={`${vehicle.next_service_due_km.toLocaleString()} km`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><CogIcon className="w-5 h-5 mr-2 text-gray-500"/>Maintenance</h4>
          <div className="space-y-3">
            {maintenanceHistory.length > 0 ? maintenanceHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{item.description}</p>
                <p className="text-sm text-gray-500">{new Date(item.service_date).toLocaleDateString()} - ${item.cost}</p>
              </div>
            )) : <p className="text-sm text-gray-500 p-3">No maintenance records.</p>}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500"/>Expenses</h4>
           <div className="space-y-3">
            {expenseHistory.length > 0 ? expenseHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{item.description} ({item.expense_type})</p>
                <p className="text-sm text-gray-500">{new Date(item.expense_date).toLocaleDateString()} - {item.amount} {item.currency}</p>
              </div>
            )) : <p className="text-sm text-gray-500 p-3">No expense records.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
