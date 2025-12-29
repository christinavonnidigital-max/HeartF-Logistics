
import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleExpense, ExpenseType, Currency, VehicleDocument, DocumentType } from '../types';
import { mockMaintenance, mockGpsLocations } from '../data/mockData';
import { CogIcon, CurrencyDollarIcon, GaugeIcon, PlusIcon, RoadIcon, WrenchIcon, FuelIcon, ShieldCheckIcon, ClipboardDocumentIcon, TicketIcon, DocumentDuplicateIcon, TrashIcon, UploadIcon, DocumentTextIcon, CalendarDaysIcon, MapPinIcon } from './icons';
import { ShellCard, SubtleCard, StatusPill, Button, IconButton } from "./UiKit";
import AddDocumentModal from './AddDocumentModal';
import ConfirmModal from './ConfirmModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
  onDeleteVehicle: () => void;
  onArchiveVehicle: () => void;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtext?: string }> = ({ icon, label, value, subtext }) => (
    <ShellCard className="p-5 shadow-sm hover:border-brand-200 transition-colors group min-w-0 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-muted text-foreground-muted group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0 shadow-inner">
                        {icon}
                </div>
                <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider truncate">{label}</span>
        </div>
        <p className="text-xl font-bold text-foreground truncate" title={String(value)}>{value}</p>
        {subtext && <p className="text-xs text-foreground-muted mt-1 truncate">{subtext}</p>}
    </ShellCard>
);

const getExpenseTypeUI = (type: ExpenseType) => {
    switch(type) {
        case ExpenseType.FUEL: return { icon: <FuelIcon className="w-4 h-4" />, color: 'text-danger-600', bgColor: 'bg-danger-50', borderColor: 'border-danger-100' };
        case ExpenseType.MAINTENANCE: return { icon: <WrenchIcon className="w-4 h-4" />, color: 'text-warn-600', bgColor: 'bg-warn-50', borderColor: 'border-warn-100' };
        case ExpenseType.INSURANCE: return { icon: <ShieldCheckIcon className="w-4 h-4" />, color: 'text-info-600', bgColor: 'bg-info-50', borderColor: 'border-info-100' };
        default: return { icon: <DocumentDuplicateIcon className="w-4 h-4" />, color: 'text-foreground-muted', bgColor: 'bg-muted', borderColor: 'border-border' };
    }
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  expenses,
  onAddExpenseClick,
  onDeleteVehicle,
  onArchiveVehicle = () => {},
}) => {
  const [filterType, setFilterType] = useState('all');
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    const docs: VehicleDocument[] = [];
    let idCounter = 1;
    if (vehicle.insurance_expiry_date) {
        docs.push({ id: idCounter++, vehicle_id: vehicle.id, document_type: DocumentType.INSURANCE, document_name: `Insurance Policy`, file_url: '#', expiry_date: vehicle.insurance_expiry_date, uploaded_at: vehicle.updated_at, uploaded_by: 1 });
    }
    return docs;
  });
  
  const maintenanceHistory = mockMaintenance.filter((m) => m.vehicle_id === vehicle.id);
  const serviceProgress = useMemo(() => {
    if (!vehicle.next_service_due_km) return 0;
    return Math.min(100, Math.max(0, Math.round((vehicle.current_km / vehicle.next_service_due_km) * 100)));
  }, [vehicle]);
  
  const filteredExpenses = useMemo(() => {
    const expenseHistory = expenses.filter((e) => e.vehicle_id === vehicle.id);
    if (filterType === 'all') return expenseHistory;
    return expenseHistory; 
  }, [expenses, vehicle.id, filterType]);

  // Estimate next service date based on average usage
  const estimatedServiceDate = useMemo(() => {
    if (vehicle.next_service_due_date) return new Date(vehicle.next_service_due_date).toLocaleDateString();
    return 'Calculated on usage';
  }, [vehicle]);

  const gpsData = useMemo(() => {
      return mockGpsLocations.find(g => g.vehicle_id === vehicle.id);
  }, [vehicle.id]);

  const vehicleMarkerIcon = useMemo(() => {
      return L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 bg-brand-600 text-white rounded-full border-2 border-white shadow-md"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="3" y="9" width="10" height="5" rx="1" /><path d="M13 11h3.5L20 13.5V16" /><circle cx="7" cy="17" r="1.7" /><circle cx="17" cy="17" r="1.7" /><path d="M3 17h2" /><path d="M9 17h6" /><path d="M3 9V7h8" /></svg></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
      });
  }, []);

  const handleAddDocument = (doc: Omit<VehicleDocument, 'id' | 'vehicle_id' | 'uploaded_at' | 'uploaded_by'>) => {
    const newDoc: VehicleDocument = {
        ...doc,
        id: Date.now(),
        vehicle_id: vehicle.id,
        uploaded_at: new Date().toISOString(),
        uploaded_by: 1 
    };
    setDocuments(prev => [...prev, newDoc]);
    setIsAddDocumentModalOpen(false);
  };

    return (
        <div className="vehicle-details-root">
    <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden shadow-md border border-border">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 opacity-95" />
            <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-card/10 rounded-full blur-3xl" />
            <div className="absolute -left-16 -top-20 w-72 h-72 bg-warn-50 rounded-full blur-3xl" />
        <div className="relative z-10 p-7 text-white flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 rounded bg-card/10 text-foreground-muted text-xs font-mono">{vehicle.registration_number}</span>
                    <StatusPill 
                        label={vehicle.status.replace('_', ' ')} 
                        tone={vehicle.status === 'active' ? 'success' : vehicle.status === 'maintenance' ? 'warn' : 'danger'} 
                    />
                </div>
                <h3 className="text-3xl font-bold">{vehicle.make} {vehicle.model}</h3>
                <div className="flex items-center gap-4 mt-2 text-foreground-muted text-sm">
                    <span className="flex items-center gap-1"><CalendarDaysIcon className="w-4 h-4"/> {vehicle.year}</span>
                    <span>•</span>
                    <span className="capitalize">{vehicle.vehicle_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{vehicle.fuel_type}</span>
                </div>
            </div>
                <div className="flex gap-2">
                <IconButton onClick={onArchiveVehicle} title="Archive Vehicle" aria-label="Archive Vehicle">
                    <DocumentTextIcon className="w-5 h-5" />
                </IconButton>
                <IconButton onClick={() => setIsDeleteVehicleModalOpen(true)} title="Delete Vehicle" aria-label="Delete Vehicle">
                    <TrashIcon className="w-5 h-5" />
                </IconButton>
            </div>
        </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-7 space-y-8">

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatItem icon={<RoadIcon className="w-5 h-5"/>} label="Odometer" value={new Intl.NumberFormat().format(vehicle.current_km)} subtext="Kilometers" />
                <StatItem icon={<GaugeIcon className="w-5 h-5"/>} label="Capacity" value={`${vehicle.capacity_tonnes} t`} subtext="Max Load" />
                <StatItem icon={<WrenchIcon className="w-5 h-5"/>} label="Next Service" value={new Intl.NumberFormat().format(vehicle.next_service_due_km)} subtext="Due at KM" />
                <StatItem icon={<CalendarDaysIcon className="w-5 h-5"/>} label="Service Date" value={estimatedServiceDate} subtext="Estimated" />
            </div>

                        {/* Service Progress (temporarily simplified while fixing JSX) */}
                        <ShellCard className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <WrenchIcon className="w-5 h-5 text-warn-600" />
                                    <span className="text-sm font-semibold text-foreground">Next service due</span>
                                </div>
                                <span className="text-sm font-medium text-warn-700">In {(vehicle.next_service_due_km - vehicle.current_km).toLocaleString()} km</span>
                            </div>
                        </ShellCard>

            {/* Live Tracking Map */}
            <ShellCard>
                <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-foreground-muted" />
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Live Tracking</h4>
                    </div>
                    {gpsData && (
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <div className="flex items-center gap-1 bg-success-50 text-success-700 px-2 py-0.5 rounded border border-success-100">
                                <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></span>
                                Online
                            </div>
                            <span>Last updated: {new Date(gpsData.timestamp).toLocaleTimeString()}</span>
                        </div>
                    )}
                </div>
                <div className="h-64 w-full bg-muted relative">
                    {gpsData ? (
                        <MapContainer 
                            center={[gpsData.latitude, gpsData.longitude]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            attributionControl={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[gpsData.latitude, gpsData.longitude]} icon={vehicleMarkerIcon}>
                                <Popup>
                                    <div className="text-sm font-medium">
                                        <p>{vehicle.registration_number}</p>
                                        <p className="text-foreground-muted text-xs">Speed: {gpsData.speed} km/h</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground-muted flex-col gap-2">
                            <MapPinIcon className="w-8 h-8 opacity-50" />
                            <span className="text-sm">No GPS signal available</span>
                        </div>
                    )}
                </div>
                {gpsData && (
                    <div className="p-3 bg-muted border-t border-border flex justify-between text-xs text-foreground-muted">
                        <span>Lat: {gpsData.latitude.toFixed(4)}, Long: {gpsData.longitude.toFixed(4)}</span>
                        <span>Speed: {gpsData.speed} km/h</span>
                    </div>
                )}
            </ShellCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Maintenance Panel */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <WrenchIcon className="w-4 h-4 text-foreground-muted" />
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Maintenance Log</h4>
                        </div>
                        <span className="text-[11px] font-semibold text-foreground-muted">{maintenanceHistory.length} records</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {maintenanceHistory.length > 0 ? maintenanceHistory.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border border-info-100 bg-info-50/60 hover:bg-info-50 transition-colors shadow-sm">
                            <div className="p-2 rounded-lg bg-card text-info-600 border border-info-100 shadow-inner">
                                <WrenchIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{item.description}</p>
                                <p className="text-xs text-foreground-muted mt-0.5">{item.service_provider} • {new Date(item.service_date).toLocaleDateString()}</p>
                            </div>
                            <div className="ml-auto font-semibold text-sm text-foreground">
                                ${item.cost}
                            </div>
                        </div>
                        )) : <p className="text-sm text-foreground-muted italic text-center py-4">No maintenance records found.</p>}
                    </div>
                </div>
                
                {/* Expenses Panel */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-border bg-muted/40 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-4 h-4 text-foreground-muted" />
                            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Expenses</h4>
                        </div>
                            <Button variant="ghost" size="sm" onClick={onAddExpenseClick}>+ Add</Button>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {filteredExpenses.length > 0 ? filteredExpenses.slice(0, 5).map((item) => {
                            const ui = getExpenseTypeUI(item.expense_type);
                                return (
                                <div key={item.id} className={`flex items-center justify-between p-4 rounded-lg border ${ui.borderColor} ${ui.bgColor} bg-opacity-70 hover:bg-opacity-90 transition shadow-sm`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-card ${ui.color} border ${ui.borderColor} shadow-inner`}>
                                            {ui.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground capitalize truncate">{item.expense_type.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-foreground-muted">{new Date(item.expense_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-foreground">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency }).format(item.amount)}
                                    </span>
                                </div>
                            )
                        }) : <p className="text-sm text-foreground-muted italic text-center py-4">No recent expenses.</p>}
                    </div>
                </div>
            </div>

            {/* Documents Panel (temporarily removed to isolate JSX error) */}
            <ShellCard className="p-4">
                <div className="text-sm text-foreground-muted">Documents panel temporarily disabled for compilation fixes.</div>
            </ShellCard>
        </div>
    </div>

    {isAddDocumentModalOpen && (
        <AddDocumentModal onClose={() => setIsAddDocumentModalOpen(false)} onAddDocument={handleAddDocument} />
    )}
    
    <ConfirmModal 
        isOpen={isDeleteVehicleModalOpen}
        onClose={() => setIsDeleteVehicleModalOpen(false)}
        onConfirm={() => { onDeleteVehicle(); setIsDeleteVehicleModalOpen(false); }}
        title="Delete Vehicle"
        message="Are you sure? This will permanently remove this vehicle and all its history."
        confirmLabel="Delete Vehicle"
    />

    <ConfirmModal 
        isOpen={documentToDelete !== null}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => { if(documentToDelete) { setDocuments(prev => prev.filter(d => d.id !== documentToDelete)); setDocumentToDelete(null); } }}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
    />
        </div>
  );
};

export default VehicleDetails;
