
import React, { useState } from 'react';
import { Vehicle, VehicleType, VehicleStatus, FuelType } from '../types';
import { CloseIcon } from './icons/Icons';

interface AddVehicleModalProps {
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose, onAddVehicle }) => {
  const [formData, setFormData] = useState({
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_type: VehicleType.DRY,
    capacity_tonnes: 30,
    status: VehicleStatus.ACTIVE,
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: 0,
    current_km: 0,
    next_service_due_km: 20000,
    last_service_date: new Date().toISOString().split('T')[0],
    fuel_type: FuelType.DIESEL,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number || !formData.make || !formData.model) {
      setError('Please fill out Registration, Make, and Model.');
      return;
    }
    setError('');
    onAddVehicle(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Vehicle</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">Registration Number*</label>
                    <input type="text" name="registration_number" id="registration_number" value={formData.registration_number} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make*</label>
                    <input type="text" name="make" id="make" value={formData.make} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model*</label>
                    <input type="text" name="model" id="model" value={formData.model} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                    <input type="number" name="year" id="year" value={formData.year} onChange={handleNumberChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <select name="vehicle_type" id="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                        {Object.values(VehicleType).map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="capacity_tonnes" className="block text-sm font-medium text-gray-700">Capacity (Tonnes)</label>
                    <input type="number" name="capacity_tonnes" id="capacity_tonnes" value={formData.capacity_tonnes} onChange={handleNumberChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">Fuel Type</label>
                    <select name="fuel_type" id="fuel_type" value={formData.fuel_type} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                        {Object.values(FuelType).map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="current_km" className="block text-sm font-medium text-gray-700">Current Kilometers</label>
                    <input type="number" name="current_km" id="current_km" value={formData.current_km} onChange={handleNumberChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <input type="date" name="purchase_date" id="purchase_date" value={formData.purchase_date} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </main>
          <footer className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Add Vehicle
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal;