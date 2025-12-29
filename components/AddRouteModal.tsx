
import React, { useState } from 'react';
import { Route, RouteType, RoadConditions } from '../types';
import { CloseIcon, MapPinIcon, RoadIcon, DocumentTextIcon } from './icons';
import { ModalShell } from './UiKit';
import AddRouteForm from './AddRouteForm';

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
        <ModalShell
            isOpen={true}
            onClose={onClose}
            title="Add New Route"
            description="Define a new logistics lane"
            icon={<MapPinIcon className="w-4 h-4" />}
            maxWidthClass="max-w-2xl"
        >
            <AddRouteForm onCancel={onClose} onAddRoute={onAddRoute} />
        </ModalShell>
    );
};

export default AddRouteModal;
