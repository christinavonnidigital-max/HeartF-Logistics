
import React, { useState } from 'react';
import { Route, RouteType, RoadConditions } from '../types';
import { CloseIcon, MapPinIcon, RoadIcon, DocumentTextIcon } from './icons/Icons';

interface AddRouteModalProps {
  onClose: () => void;
  onAddRoute: (route: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'border_crossings' | 'toll_gates' | 'total_toll_cost' | 'is_active' | 'is_popular'> & { road_conditions: RoadConditions }) => void;
}

const AddRouteModal: React.FC<AddRouteModalProps> = ({ onClose, onAddRoute }) => {
    // Pre-filled demo data
    const [formData, setFormData] = useState({
        route_name: 'Harare - Lusaka (Exp)',
        route_code: 'HAR-LUN-X',
        origin_city: 'Harare',
        origin_country: 'Zimbabwe',
        destination_city: 'Lusaka',
        destination_country: 'Zambia',
        distance_km: '470',
        estimated_duration_hours: '8',
        route_type: RouteType.CROSS_BORDER,
        road_conditions: RoadConditions.FAIR,
        notes: 'Chirundu border post can be slow on weekends. Advise drivers to arrive early morning.',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        const { route_code, origin_country, destination_country, notes, ...rest } = formData;
        onAddRoute({
            ...rest,
            route_code: route_code || `${formData.origin_city.substring(0,3).toUpperCase()}-${formData.destination_city.substring(0,3).toUpperCase()}-NEW`,
            origin_country: formData.route_type === RouteType.DOMESTIC ? 'Zimbabwe' : formData.origin_country,
            destination_country: formData.route_type === RouteType.DOMESTIC ? 'Zimbabwe' : formData.destination_country,
            notes: notes || undefined,
            distance_km: parseFloat(formData.distance_km),
            estimated_duration_hours: parseFloat(formData.estimated_duration_hours) || 0,
        });
    };

    return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center md:pl-64 items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Add New Route</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Define a new logistics lane</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                <main className="p-6 space-y-8">
                    
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            Route Definition
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Route Name*</label>
                                <input type="text" name="route_name" placeholder="e.g., Harare - Bulawayo" value={formData.route_name} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Origin City*</label>
                                <input type="text" name="origin_city" placeholder="e.g., Harare" value={formData.origin_city} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Destination City*</label>
                                <input type="text" name="destination_city" placeholder="e.g., Bulawayo" value={formData.destination_city} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Logistics Panel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <RoadIcon className="w-4 h-4" />
                            Logistics & Conditions
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Distance (km)*</label>
                                <input type="number" name="distance_km" placeholder="e.g., 440" value={formData.distance_km} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Est. Duration (hours)</label>
                                <input type="number" name="estimated_duration_hours" placeholder="e.g., 6" value={formData.estimated_duration_hours} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Route Type</label>
                                <select name="route_type" value={formData.route_type} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize">
                                    {Object.values(RouteType).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Road Conditions</label>
                                <select name="road_conditions" value={formData.road_conditions} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize">
                                    {Object.values(RoadConditions).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><DocumentTextIcon className="w-3 h-3"/> Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 resize-none" placeholder="Additional details about the route..."></textarea>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg text-center">{error}</p>}
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Save Route</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddRouteModal;
