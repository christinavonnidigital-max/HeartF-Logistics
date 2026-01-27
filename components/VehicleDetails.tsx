import React, { useEffect, useMemo, useState } from "react";
import {
  Vehicle,
  VehicleExpense,
  ExpenseType,
  VehicleDocument,
  DocumentType,
  VehicleMaintenance,
  VehicleStatus,
} from "../types";
import { mockGpsLocations } from "../data/mockData";
import {
  CurrencyDollarIcon,
  GaugeIcon,
  RoadIcon,
  WrenchIcon,
  FuelIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  TicketIcon,
  UploadIcon,
} from "./icons";
import { ShellCard, SubtleCard, StatusPill, Button, IconButton, ModalShell, Input, Label } from "./UiKit";
import AddDocumentModal from "./AddDocumentModal";
import ConfirmModal from "./ConfirmModal";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";

interface VehicleDetailsProps {
  vehicle: Vehicle;
  maintenance: VehicleMaintenance[];
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
  onDeleteVehicle: () => void;
  onArchiveVehicle: () => void;
  onUpdateOdometer: (nextKm: number) => void;
}

type TabKey = "overview" | "tracking" | "maintenance" | "expenses" | "documents";

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

const getExpenseTypeUI = (type: ExpenseType) => {
  switch (type) {
    case ExpenseType.FUEL:
      return {
        icon: <FuelIcon className="w-4 h-4" />,
        badge: "Fuel",
        tone: "warn" as const,
      };
    case ExpenseType.MAINTENANCE:
      return {
        icon: <WrenchIcon className="w-4 h-4" />,
        badge: "Maintenance",
        tone: "info" as const,
      };
    case ExpenseType.INSURANCE:
      return {
        icon: <ShieldCheckIcon className="w-4 h-4" />,
        badge: "Insurance",
        tone: "success" as const,
      };
    default:
      return {
        icon: <DocumentDuplicateIcon className="w-4 h-4" />,
        badge: "Other",
        tone: "neutral" as const,
      };
  }
};

const StatLine: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-8 w-8 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
      </div>
    </div>
    <div className="text-sm font-semibold text-slate-900 truncate" title={value}>
      {value}
    </div>
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
      (active
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
    }
  >
    {icon ? <span className="opacity-90">{icon}</span> : null}
    <span>{label}</span>
  </button>
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
  const [tab, setTab] = useState<TabKey>("overview");

  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState(false);
  const [odometerValue, setOdometerValue] = useState(String(vehicle.current_km ?? ""));
  const [odometerError, setOdometerError] = useState("");

  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | "all">("all");

  const maintenanceHistory = useMemo(() => {
    return maintenance
      .filter((m) => m.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
  }, [maintenance, vehicle.id]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, vehicle.id]);

  const gpsData = useMemo(() => {
    return mockGpsLocations.find((g) => g.vehicle_id === vehicle.id);
  }, [vehicle.id]);

  const vehicleMarkerIcon = useMemo(() => {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-full border-2 border-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <rect x="3" y="9" width="10" height="5" rx="1" />
          <path d="M13 11h3.5L20 13.5V16" />
          <circle cx="7" cy="17" r="1.7" />
          <circle cx="17" cy="17" r="1.7" />
          <path d="M3 17h2" />
          <path d="M9 17h6" />
          <path d="M3 9V7h8" />
        </svg>
      </div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  const estimatedServiceDate = useMemo(() => {
    if (vehicle.next_service_due_date) return new Date(vehicle.next_service_due_date).toLocaleDateString();
    return "Calculated on usage";
  }, [vehicle]);

  const nextServiceRemainingKm = useMemo(() => {
    const due = Number(vehicle.next_service_due_km ?? 0);
    const curr = Number(vehicle.current_km ?? 0);
    if (!Number.isFinite(due) || !Number.isFinite(curr)) return 0;
    return Math.max(0, due - curr);
  }, [vehicle.current_km, vehicle.next_service_due_km]);

  const headerStatusTone = useMemo(() => {
    if (vehicle.status === VehicleStatus.ACTIVE) return "success" as const;
    if (vehicle.status === VehicleStatus.MAINTENANCE) return "warn" as const;
    if (vehicle.status === VehicleStatus.OUT_OF_SERVICE) return "danger" as const;
    return "neutral" as const;
  }, [vehicle.status]);

  const initialDocs = useMemo(() => {
    const docs: VehicleDocument[] = [];
    let idCounter = 1;

    if (vehicle.insurance_expiry_date) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.INSURANCE,
        document_name: "Insurance policy",
        file_url: "#",
        expiry_date: vehicle.insurance_expiry_date,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }
    if ((vehicle as any).fitness_certificate_expiry) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.FITNESS,
        document_name: "Fitness certificate",
        file_url: "#",
        expiry_date: (vehicle as any).fitness_certificate_expiry,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }
    if ((vehicle as any).license_disc_expiry) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.LICENSE_DISC,
        document_name: "License disc",
        file_url: "#",
        expiry_date: (vehicle as any).license_disc_expiry,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }

    return docs;
  }, [vehicle]);

  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);

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

  const handleAddDocument = (doc: Omit<VehicleDocument, "id" | "vehicle_id" | "uploaded_at" | "uploaded_by">) => {
    const newDoc: VehicleDocument = {
      ...doc,
      id: Date.now(),
      vehicle_id: vehicle.id,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 1,
    };
    setDocuments((prev) => [...prev, newDoc]);
    setIsAddDocumentModalOpen(false);
  };

  useEffect(() => {
    if (isOdometerModalOpen) {
      setOdometerValue(String(vehicle.current_km ?? ""));
      setOdometerError("");
    }
  }, [isOdometerModalOpen, vehicle.current_km]);

  const handleSaveOdometer = () => {
    const nextKm = Number(odometerValue);
    if (!Number.isFinite(nextKm) || nextKm < 0) {
      setOdometerError("Enter a valid odometer reading.");
      return;
    }
    onUpdateOdometer(nextKm);
    setIsOdometerModalOpen(false);
  };

  const header = (
    <div className="border-b border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              {vehicle.registration_number}
            </div>
            <StatusPill label={toTitle(String(vehicle.status))} tone={headerStatusTone} />
            <div className="text-xs text-slate-500">
              {vehicle.year} • {toTitle(String(vehicle.vehicle_type))} • {toTitle(String(vehicle.fuel_type))}
            </div>
          </div>

          <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900 truncate">
            {vehicle.make} {vehicle.model}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <TabButton
              active={tab === "overview"}
              onClick={() => setTab("overview")}
              icon={<ClipboardDocumentIcon className="w-3.5 h-3.5" />}
              label="Overview"
            />
            <TabButton
              active={tab === "tracking"}
              onClick={() => setTab("tracking")}
              icon={<MapPinIcon className="w-3.5 h-3.5" />}
              label="Tracking"
            />
            <TabButton
              active={tab === "maintenance"}
              onClick={() => setTab("maintenance")}
              icon={<WrenchIcon className="w-3.5 h-3.5" />}
              label="Maintenance"
            />
            <TabButton
              active={tab === "expenses"}
              onClick={() => setTab("expenses")}
              icon={<CurrencyDollarIcon className="w-3.5 h-3.5" />}
              label="Expenses"
            />
            <TabButton
              active={tab === "documents"}
              onClick={() => setTab("documents")}
              icon={<DocumentTextIcon className="w-3.5 h-3.5" />}
              label="Documents"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setIsOdometerModalOpen(true)}>
            <GaugeIcon className="w-4 h-4" />
            Odometer
          </Button>
          <Button variant="secondary" size="sm" onClick={onArchiveVehicle}>
            <DocumentTextIcon className="w-4 h-4" />
            Archive
          </Button>
          <IconButton
            onClick={() => setIsDeleteVehicleModalOpen(true)}
            title="Delete vehicle"
            aria-label="Delete vehicle"
          >
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );

  const overviewTab = (
    <div className="p-5 space-y-4">
      <ShellCard className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Service</div>
            <div className="mt-1 text-xs text-slate-500">
              Next due at {new Intl.NumberFormat().format(Number(vehicle.next_service_due_km ?? 0))} km • Estimated {estimatedServiceDate}
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            In {new Intl.NumberFormat().format(nextServiceRemainingKm)} km
          </div>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          {Number(vehicle.next_service_due_km ?? 0) > 0 ? (
            <div
              className="h-full bg-slate-900"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round((Number(vehicle.current_km ?? 0) / Number(vehicle.next_service_due_km ?? 1)) * 100)
                  )
                )}%`,
              }}
            />
          ) : (
            <div className="h-full bg-slate-300 w-[2%]" />
          )}
        </div>
      </ShellCard>

      <ShellCard className="p-4">
        <div className="text-sm font-semibold text-slate-900 mb-2">Key stats</div>
        <div className="divide-y divide-slate-100">
          <StatLine
            icon={<RoadIcon className="w-4 h-4" />}
            label="Odometer"
            value={`${new Intl.NumberFormat().format(Number(vehicle.current_km ?? 0))} km`}
          />
          <StatLine
            icon={<GaugeIcon className="w-4 h-4" />}
            label="Capacity"
            value={`${Number(vehicle.capacity_tonnes ?? 0)} t`}
          />
          <StatLine
            icon={<CalendarDaysIcon className="w-4 h-4" />}
            label="Last service date"
            value={vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : "Not set"}
          />
          <StatLine
            icon={<FuelIcon className="w-4 h-4" />}
            label="Fuel"
            value={toTitle(String(vehicle.fuel_type || "unknown"))}
          />
        </div>
      </ShellCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShellCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Maintenance</div>
              <div className="text-xs text-slate-500">{maintenanceHistory.length} records</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTab("maintenance")}>
              View
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {maintenanceHistory.slice(0, 3).map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">{m.description}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {m.service_provider} • {new Date(m.service_date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {maintenanceHistory.length === 0 ? (
              <div className="text-sm text-slate-500">No maintenance records yet.</div>
            ) : null}
          </div>
        </ShellCard>

        <ShellCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Recent expenses</div>
              <div className="text-xs text-slate-500">{filteredExpenses.length} total</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onAddExpenseClick}>
                + Add
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTab("expenses")}>
                View
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {filteredExpenses.slice(0, 3).map((e) => {
              const ui = getExpenseTypeUI(e.expense_type);
              return (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                      {ui.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{ui.badge}</div>
                      <div className="text-xs text-slate-500">{new Date(e.expense_date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: e.currency }).format(e.amount)}
                  </div>
                </div>
              );
            })}
            {filteredExpenses.length === 0 ? <div className="text-sm text-slate-500">No expenses yet.</div> : null}
          </div>
        </ShellCard>
      </div>
    </div>
  );

  const trackingTab = (
    <div className="p-5 space-y-4">
      <ShellCard className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-slate-600" />
            <div className="text-sm font-semibold text-slate-900">Live tracking</div>
          </div>

          {gpsData ? (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
              <span className="hidden sm:inline">Updated {new Date(gpsData.timestamp).toLocaleTimeString()}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No GPS data</div>
          )}
        </div>

        <div className="h-64 w-full bg-slate-50">
          {gpsData ? (
            <MapContainer
              center={[gpsData.latitude, gpsData.longitude]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              attributionControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[gpsData.latitude, gpsData.longitude]} icon={vehicleMarkerIcon}>
                <Popup>
                  <div className="text-sm font-medium">
                    <div>{vehicle.registration_number}</div>
                    <div className="text-xs text-slate-600">Speed: {gpsData.speed} km/h</div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-slate-500">
              GPS is unavailable for this vehicle.
            </div>
          )}
        </div>

        {gpsData ? (
          <div className="p-3 border-t border-slate-200 bg-white text-xs text-slate-600 flex items-center justify-between">
            <span>
              Lat {gpsData.latitude.toFixed(4)} • Lng {gpsData.longitude.toFixed(4)}
            </span>
            <span>Speed {gpsData.speed} km/h</span>
          </div>
        ) : null}
      </ShellCard>
    </div>
  );

  const maintenanceTab = (
    <div className="p-5 space-y-3">
      <ShellCard className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Maintenance log</div>
            <div className="text-xs text-slate-500">{maintenanceHistory.length} records</div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {maintenanceHistory.length === 0 ? (
            <div className="text-sm text-slate-500">No maintenance records found.</div>
          ) : (
            maintenanceHistory.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{m.description}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {m.service_provider} • {new Date(m.service_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(m.cost ?? 0))}
                </div>
              </div>
            ))
          )}
        </div>
      </ShellCard>
    </div>
  );

  const expensesTab = (
    <div className="p-5 space-y-3">
      <ShellCard className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Expenses</div>
            <div className="text-xs text-slate-500">{filteredExpenses.length} entries</div>
          </div>
          <Button variant="secondary" size="sm" onClick={onAddExpenseClick}>
            + Add expense
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {filteredExpenses.length === 0 ? (
            <div className="text-sm text-slate-500">No expenses recorded.</div>
          ) : (
            filteredExpenses.map((e) => {
              const ui = getExpenseTypeUI(e.expense_type);
              return (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                      {ui.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-slate-900 truncate">{ui.badge}</div>
                        <StatusPill label={toTitle(String(e.expense_type))} tone={ui.tone} />
                      </div>
                      <div className="text-xs text-slate-500">{new Date(e.expense_date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: e.currency }).format(e.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ShellCard>
    </div>
  );

  const documentsTab = (
    <div className="p-5 space-y-3">
      <ShellCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardDocumentIcon className="w-4 h-4 text-slate-600" />
            <div className="text-sm font-semibold text-slate-900">Documents</div>
            <div className="text-xs text-slate-500">{filteredDocuments.length} files</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter((e.target.value as any) ?? "all")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
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

        <div className="mt-3">
          {filteredDocuments.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-600">
              <DocumentTextIcon className="w-6 h-6 opacity-60 mb-2" />
              <div className="text-sm font-semibold text-slate-800">No documents uploaded</div>
              <div className="text-xs text-slate-500">Add insurance, fitness, license disc, or service records</div>
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
                      <div className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                        {icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-semibold text-slate-900 truncate">{doc.document_name}</div>
                          <StatusPill label={toTitle(String(doc.document_type))} tone={tone} />
                        </div>

                        <div className="mt-1 text-xs text-slate-500">{formatExpiryLabel(doc.expiry_date)}</div>

                        {doc.file_url && doc.file_url !== "#" ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-900 hover:underline"
                          >
                            <UploadIcon className="w-3.5 h-3.5" />
                            Open file
                          </a>
                        ) : null}
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
      </ShellCard>
    </div>
  );

  return (
    <div className="vehicle-details-root">
      <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200">
        {header}

        <div className="flex-1 overflow-y-auto bg-white">
          {tab === "overview" ? overviewTab : null}
          {tab === "tracking" ? trackingTab : null}
          {tab === "maintenance" ? maintenanceTab : null}
          {tab === "expenses" ? expensesTab : null}
          {tab === "documents" ? documentsTab : null}
        </div>
      </div>

      {isAddDocumentModalOpen ? (
        <AddDocumentModal onClose={() => setIsAddDocumentModalOpen(false)} onAddDocument={handleAddDocument} />
      ) : null}

      <ModalShell
        isOpen={isOdometerModalOpen}
        onClose={() => setIsOdometerModalOpen(false)}
        title="Update odometer"
        description="Log the latest odometer reading."
        icon={<GaugeIcon className="w-5 h-5" />}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600">{odometerError}</span>
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
          <Input type="number" min="0" value={odometerValue} onChange={(e) => setOdometerValue(e.target.value)} />
        </div>
      </ModalShell>

      <ConfirmModal
        isOpen={isDeleteVehicleModalOpen}
        onClose={() => setIsDeleteVehicleModalOpen(false)}
        onConfirm={() => {
          onDeleteVehicle();
          setIsDeleteVehicleModalOpen(false);
        }}
        title="Delete vehicle"
        message="Are you sure? This will permanently remove this vehicle and all its history."
        confirmLabel="Delete vehicle"
      />

      <ConfirmModal
        isOpen={documentToDelete !== null}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => {
          if (documentToDelete) {
            setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete));
            setDocumentToDelete(null);
          }
        }}
        title="Delete document"
        message="Are you sure you want to delete this document?"
      />
    </div>
  );
};

export default VehicleDetails;
