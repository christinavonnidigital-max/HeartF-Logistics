
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, VehicleExpense, ExpenseType, VehicleDocument, DocumentType, VehicleMaintenance } from '../types';
import { mockGpsLocations } from '../data/mockData';
import { CurrencyDollarIcon, GaugeIcon, RoadIcon, WrenchIcon, FuelIcon, ShieldCheckIcon, DocumentDuplicateIcon, TrashIcon, DocumentTextIcon, CalendarDaysIcon, MapPinIcon, ClipboardDocumentIcon, TicketIcon, UploadIcon } from './icons';
import { ShellCard, SubtleCard, StatusPill, Button, IconButton, ModalShell, Input, Label } from "./UiKit";
import AddDocumentModal from './AddDocumentModal';
import ConfirmModal from './ConfirmModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  maintenance: VehicleMaintenance[];
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
  onDeleteVehicle: () => void;
  onArchiveVehicle: () => void;
  onUpdateOdometer: (nextKm: number) => void;
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

const toTitle = (v: string) =>
  String(v)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getDocTone = (expiry?: string | null) => {
  if (!expiry) return "neutral" as const;
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return "neutral" as const;

  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "danger" as const;
  if (diffDays <= 30) return "warn" as const;
  return "success" as const;
};

const formatExpiryLabel = (expiry?: string | null) => {
  if (!expiry) return "No expiry";
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return "No expiry";

  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const pretty = d.toLocaleDateString();

  if (diffDays < 0) return `Expired ${pretty}`;
  if (diffDays === 0) return `Expires today (${pretty})`;
  if (diffDays === 1) return `Expires tomorrow (${pretty})`;
  if (diffDays <= 30) return `Expires in ${diffDays}d (${pretty})`;
  return `Expires ${pretty}`;
};

const VehicleHero: React.FC<{
  vehicle: Vehicle;
  onUpdateOdometer: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ vehicle, onUpdateOdometer, onArchive, onDelete }) => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 opacity-95" />
    <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-card/10 rounded-full blur-3xl" />
    <div className="absolute -left-16 -top-20 w-72 h-72 bg-warn-50 rounded-full blur-3xl" />
    <div className="relative z-10 p-7 text-white flex justify-between items-start">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-1 rounded bg-card/10 text-foreground-muted text-xs font-mono">
            {vehicle.registration_number}
          </span>
          <StatusPill
            label={vehicle.status.replace("_", " ")}
            tone={vehicle.status === "active" ? "success" : vehicle.status === "maintenance" ? "warn" : "danger"}
          />
        </div>
        <h3 className="text-3xl font-bold">
          {vehicle.make} {vehicle.model}
        </h3>
        <div className="flex items-center gap-4 mt-2 text-foreground-muted text-sm">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="w-4 h-4" /> {vehicle.year}
          </span>
          <span>&gt;</span>
          <span className="capitalize">{vehicle.vehicle_type.replace("_", " ")}</span>
          <span>&gt;</span>
          <span className="capitalize">{vehicle.fuel_type}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <IconButton onClick={onUpdateOdometer} title="Update odometer" aria-label="Update odometer">
          <GaugeIcon className="w-5 h-5" />
        </IconButton>
        <IconButton onClick={onArchive} title="Archive vehicle" aria-label="Archive vehicle">
          <DocumentTextIcon className="w-5 h-5" />
        </IconButton>
        <IconButton onClick={onDelete} title="Delete vehicle" aria-label="Delete vehicle">
          <TrashIcon className="w-5 h-5" />
        </IconButton>
      </div>
    </div>
  </div>
);

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  maintenance = [],
  expenses = [],
  onAddExpenseClick,
  onDeleteVehicle,
  onArchiveVehicle = () => {},
  onUpdateOdometer,
}) => {
  const [filterType, setFilterType] = useState('all');
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState(false);
  const [odometerValue, setOdometerValue] = useState(String(vehicle.current_km ?? ''));
  const [odometerError, setOdometerError] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | "all">("all");

  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    const docs: VehicleDocument[] = [];
    let idCounter = 1;
    if (vehicle.insurance_expiry_date) {
        docs.push({ id: idCounter++, vehicle_id: vehicle.id, document_type: DocumentType.INSURANCE, document_name: `Insurance Policy`, file_url: '#', expiry_date: vehicle.insurance_expiry_date, uploaded_at: vehicle.updated_at, uploaded_by: 1 });
    }
    return docs;
  });
  
  const maintenanceHistory = useMemo(() => {
    return maintenance
      .filter((m) => m.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
  }, [maintenance, vehicle.id]);
  const serviceProgress = useMemo(() => {
    if (!vehicle.next_service_due_km) return 0;
    return Math.min(100, Math.max(0, Math.round((vehicle.current_km / vehicle.next_service_due_km) * 100)));
  }, [vehicle]);
  
  const filteredExpenses = useMemo(() => {
    const expenseHistory = expenses.filter((e) => e.vehicle_id === vehicle.id);
    if (filterType === 'all') return expenseHistory;
    return expenseHistory; 
  }, [expenses, vehicle.id, filterType]);

  const filteredDocuments = useMemo(() => {
    const base = documents.filter((d) => d.vehicle_id === vehicle.id);
    const subset = docTypeFilter === "all" ? base : base.filter((d) => d.document_type === docTypeFilter);

    return [...subset].sort((a, b) => {
      const aExp = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
      const bExp = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
      if (aExp !== bExp) return aExp - bExp;

      const aUp = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const bUp = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return bUp - aUp;
    });
  }, [documents, vehicle.id, docTypeFilter]);

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

  useEffect(() => {
    if (isOdometerModalOpen) {
      setOdometerValue(String(vehicle.current_km ?? ''));
      setOdometerError('');
    }
  }, [isOdometerModalOpen, vehicle.current_km]);

  const handleSaveOdometer = () => {
    const nextKm = Number(odometerValue);
    if (!Number.isFinite(nextKm) || nextKm < 0) {
      setOdometerError('Enter a valid odometer reading.');
      return;
    }
    onUpdateOdometer(nextKm);
    setIsOdometerModalOpen(false);
  };

    return (
        <div className="vehicle-details-root">
    <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden shadow-md border border-border">
        {/* Hero Header */}
        <VehicleHero
          vehicle={vehicle}
          onUpdateOdometer={() => setIsOdometerModalOpen(true)}
          onArchive={onArchiveVehicle}
          onDelete={() => setIsDeleteVehicleModalOpen(true)}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-7 space-y-8">

            {/* Key Stats */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatItem icon={<RoadIcon className="w-5 h-5"/>} label="Odometer" value={new Intl.NumberFormat().format(vehicle.current_km)} subtext="Kilometers" />
                  <StatItem icon={<GaugeIcon className="w-5 h-5"/>} label="Capacity" value={`${vehicle.capacity_tonnes} t`} subtext="Max Load" />
                  <StatItem icon={<WrenchIcon className="w-5 h-5"/>} label="Next Service" value={new Intl.NumberFormat().format(vehicle.next_service_due_km)} subtext="Due at KM" />
                  <StatItem icon={<CalendarDaysIcon className="w-5 h-5"/>} label="Service Date" value={estimatedServiceDate} subtext="Estimated" />
              </div>
            </div>

                        {/* Service Progress (temporarily simplified while fixing JSX) */}
                        <ShellCard className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <WrenchIcon className="w-5 h-5 text-warn-600" />
                                    <span className="text-sm font-semibold text-foreground">Next service due</span>
                                </div>
                                <span className="text-sm font-medium text-warn-700">In {(vehicle.next_service_due_km - vehicle.current_km).toLocaleString()} km</span>
                            </div>
                        </ShellCard>

            {/* Live Tracking Map */}
            <ShellCard className="animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="animate-pulse w-full h-full bg-muted rounded-lg" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                                <p className="text-xs text-foreground-muted mt-0.5">{item.service_provider} - {new Date(item.service_date).toLocaleDateString()}</p>
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

          {/* Documents Panel */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ClipboardDocumentIcon className="w-4 h-4 text-foreground-muted" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Documents
                </h4>
                <span className="text-[11px] font-semibold text-foreground-muted">
                  {filteredDocuments.length} files
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter((e.target.value as any) ?? "all")}
                  className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All types</option>
                  {Object.values(DocumentType).map((t) => (
                    <option key={String(t)} value={String(t)}>
                      {toTitle(String(t))}
                    </option>
                  ))}
                </select>

                <Button variant="secondary" size="sm" onClick={() => setIsAddDocumentModalOpen(true)}>
                  <UploadIcon className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="p-4">
              {filteredDocuments.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-foreground-muted">
                  <DocumentTextIcon className="w-6 h-6 opacity-60 mb-2" />
                  <div className="text-sm font-medium">No documents uploaded</div>
                  <div className="text-xs">Add insurance, fitness, license disc, or service records</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredDocuments.map((doc) => {
                    const tone = getDocTone(doc.expiry_date);
                    const icon =
                      doc.document_type === DocumentType.INSURANCE ? (
                        <ShieldCheckIcon className="w-4 h-4" />
                      ) : doc.document_type === DocumentType.LICENSE_DISC ? (
                        <TicketIcon className="w-4 h-4" />
                      ) : doc.document_type === DocumentType.SERVICE_RECORD ? (
                        <WrenchIcon className="w-4 h-4" />
                      ) : doc.document_type === DocumentType.FITNESS ? (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      ) : (
                        <DocumentTextIcon className="w-4 h-4" />
                      );

                    return (
                      <SubtleCard key={doc.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-card border border-border text-foreground-muted shadow-inner shrink-0">
                            {icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-semibold text-foreground truncate">
                                {doc.document_name}
                              </div>
                              <StatusPill label={toTitle(String(doc.document_type))} tone={tone} />
                            </div>

                            <div className="mt-1 text-xs text-foreground-muted">
                              {formatExpiryLabel(doc.expiry_date)}
                            </div>

                            {doc.file_url && doc.file_url !== "#" && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-brand-700 hover:underline"
                              >
                                <UploadIcon className="w-3.5 h-3.5" />
                                Open file
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <IconButton
                            onClick={() => setDocumentToDelete(doc.id)}
                            title="Delete document"
                            aria-label="Delete document"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </SubtleCard>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>

    {isAddDocumentModalOpen && (
        <AddDocumentModal onClose={() => setIsAddDocumentModalOpen(false)} onAddDocument={handleAddDocument} />
    )}

    <ModalShell
        isOpen={isOdometerModalOpen}
        onClose={() => setIsOdometerModalOpen(false)}
        title="Update odometer"
        description="Log the latest odometer reading. If the vehicle passes its service threshold, a maintenance task is scheduled automatically."
        icon={<GaugeIcon className="w-5 h-5" />}
        maxWidthClass="max-w-md"
        footer={
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-foreground-muted">{odometerError}</span>
                <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={() => setIsOdometerModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="button" onClick={handleSaveOdometer}>
                        Save
                    </Button>
                </div>
            </div>
        }
    >
        <div className="space-y-3">
            <Label>Current odometer (km)</Label>
            <Input
                type="number"
                min="0"
                value={odometerValue}
                onChange={(e) => setOdometerValue(e.target.value)}
            />
        </div>
    </ModalShell>
    
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
