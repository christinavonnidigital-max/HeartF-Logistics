
import React, { useState } from 'react';
import { Route, RouteType, RoadConditions } from '../types';
import { ShellCard, Input, Select, Textarea, Button } from './UiKit';

interface AddRouteFormProps {
  onCancel: () => void;
  onAddRoute: (route: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'border_crossings' | 'toll_gates' | 'total_toll_cost' | 'is_active' | 'is_popular'> & { road_conditions: RoadConditions }) => void;
}

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onCancel, onAddRoute }) => {
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
    <ShellCard className="p-6 overflow-y-auto">
        <form onSubmit={handleSubmit}>
              <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-2xl font-bold leading-6 text-foreground">Add New Company Route</h3>
                  <p className="mt-1 text-md text-foreground-muted">Define a new route for your logistics operations.</p>
            </div>
            <main className="space-y-6">
                
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider">Basic Info</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-foreground-muted mb-1">Route Name*</label>
                                <Input type="text" name="route_name" placeholder="e.g., Harare - Bulawayo" value={formData.route_name} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Origin City*</label>
                            <Input type="text" name="origin_city" placeholder="e.g., Harare" value={formData.origin_city} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Destination City*</label>
                            <Input type="text" name="destination_city" placeholder="e.g., Bulawayo" value={formData.destination_city} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider">Logistics</label>
                    <div className="bg-muted rounded-xl p-5 border border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Distance (km)*</label>
                            <Input type="number" name="distance_km" placeholder="e.g., 440" value={formData.distance_km} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Est. Duration (hours)</label>
                            <Input type="number" name="estimated_duration_hours" placeholder="e.g., 6" value={formData.estimated_duration_hours} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Route Type</label>
                            <Select name="route_type" value={formData.route_type} onChange={handleChange} className="capitalize">
                                {Object.values(RouteType).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Road Conditions</label>
                            <Select name="road_conditions" value={formData.road_conditions} onChange={handleChange} className="capitalize">
                                {Object.values(RoadConditions).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-foreground-muted mb-1">Notes</label>
                            <Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Additional details about the route..." />
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg text-center">{error}</p>}
            </main>
            <footer className="mt-6 pt-4 border-t border-border flex justify-end space-x-3">
                <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" type="submit">Save Route</Button>
            </footer>
        </form>
    </ShellCard>
    );
};

export default AddRouteForm;
