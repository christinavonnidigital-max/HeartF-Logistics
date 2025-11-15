
import React, { useState } from 'react';
import { Route, RouteType, RoadConditions } from '../types';
import { CloseIcon } from './icons/Icons';

interface AddRouteModalProps {
  onClose: () => void;
  onAddRoute: (route: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'border_crossings' | 'toll_gates' | 'total_toll_cost' | 'is_active' | 'is_popular'>) => void;
}

const AddRouteModal: React.FC<AddRouteModalProps> = ({ onClose, onAddRoute }) => {
    const [formData, setFormData] = useState({
        route_name: '',
        route_code: '',
        origin_city: '',
        origin_country: 'Zimbabwe',
        destination_city: '',
        destination_country: 'Zimbabwe',
        distance_km: '',
        estimated_duration_hours: '',
        route_type: RouteType.DOMESTIC,
        road_conditions: RoadConditions.GOOD,
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.route_name || !formData.origin_city || !formData.destination_city || !formData.distance_km) {
            setError('Route Name, Origin, Destination, and Distance are required.');
            return;
        }
        setError('');
        onAddRoute({
            ...formData,
            distance_km: parseFloat(formData.distance_km),
            estimated_duration_hours: parseFloat(formData.estimated_duration_hours) || 0,
        });
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Add New Route</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="route_name" placeholder="Route Name*" value={formData.route_name} onChange={handleChange} className="md:col-span-2 mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="text" name="origin_city" placeholder="Origin City*" value={formData.origin_city} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="text" name="destination_city" placeholder="Destination City*" value={formData.destination_city} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="number" name="distance_km" placeholder="Distance (km)*" value={formData.distance_km} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="number" name="estimated_duration_hours" placeholder="Est. Duration (hours)" value={formData.estimated_duration_hours} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                         <select name="route_type" value={formData.route_type} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize">
                            {Object.values(RouteType).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select name="road_conditions" value={formData.road_conditions} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize">
                            {Object.values(RoadConditions).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </main>
                <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Add Route</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddRouteModal;