
import React, { useState } from 'react';
import { Vehicle, VehicleType, VehicleStatus, FuelType } from '../types';
import { CloseIcon, TruckIcon, FuelIcon, GaugeIcon, RoadIcon, CalendarDaysIcon, CurrencyDollarIcon } from './icons/Icons';

interface AddVehicleModalProps {
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose, onAddVehicle }) => {
  // Pre-filled demo data
  const [formData, setFormData] = useState({
    registration_number: 'AFJ 9922',
    make: 'Volvo',
    model: 'FH Globetrotter',
    year: 2023,
    vehicle_type: VehicleType.REFRIGERATED,
    capacity_tonnes: 40,
    status: VehicleStatus.ACTIVE,
    purchase_date: '2023-02-15',
    purchase_cost: 145000,
    current_km: 45000,
    next_service_due_km: 60000,
    last_service_date: '2024-01-10',
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Vehicle</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a new asset to the fleet</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="p-6 space-y-8">
            
            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TruckIcon className="w-4 h-4" />
                Vehicle Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Registration Number*</label>
                    <input 
                        type="text" 
                        name="registration_number" 
                        value={formData.registration_number} 
                        onChange={handleChange} 
                        placeholder="e.g. ABC-1234"
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors font-mono" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Make*</label>
                    <input 
                        type="text" 
                        name="make" 
                        value={formData.make} 
                        onChange={handleChange} 
                        placeholder="e.g. Scania"
                        className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Model*</label>
                    <input 
                        type="text" 
                        name="model" 
                        value={formData.model} 
                        onChange={handleChange} 
                        placeholder="e.g. R450"
                        className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                    <input 
                        type="number" 
                        name="year" 
                        value={formData.year} 
                        onChange={handleNumberChange} 
                        className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                    />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange} 
                        className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors capitalize"
                    >
                        {Object.values(VehicleStatus).map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            {/* Specs Section Panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <GaugeIcon className="w-4 h-4" />
                Technical Specs
              </h3>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select 
                        name="vehicle_type" 
                        value={formData.vehicle_type} 
                        onChange={handleChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                    >
                        {Object.values(VehicleType).map(type => (
                            <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><FuelIcon className="w-3 h-3"/> Fuel</label>
                    <select 
                        name="fuel_type" 
                        value={formData.fuel_type} 
                        onChange={handleChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                    >
                        {Object.values(FuelType).map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Capacity (t)</label>
                    <input 
                        type="number" 
                        name="capacity_tonnes" 
                        value={formData.capacity_tonnes} 
                        onChange={handleNumberChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white" 
                    />
                </div>
              </div>
            </div>

            {/* History Section Panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <RoadIcon className="w-4 h-4" />
                History & Financials
              </h3>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Current Odometer</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            name="current_km" 
                            value={formData.current_km} 
                            onChange={handleNumberChange} 
                            className="block w-full rounded-lg border-slate-200 pl-3 pr-8 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white" 
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs">km</span>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3"/> Purchase Date</label>
                    <input 
                        type="date" 
                        name="purchase_date" 
                        value={formData.purchase_date} 
                        onChange={handleChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600 bg-white" 
                    />
                </div>
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><CurrencyDollarIcon className="w-3 h-3"/> Purchase Cost</label>
                    <input 
                        type="number" 
                        name="purchase_cost" 
                        value={formData.purchase_cost} 
                        onChange={handleNumberChange} 
                        className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white" 
                    />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
          </main>
        </form>
        
        <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all"
            >
              Add Vehicle
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AddVehicleModal;
