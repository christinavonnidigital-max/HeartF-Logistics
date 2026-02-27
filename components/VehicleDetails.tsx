import React, { useEffect, useMemo, useState } from "react";
import {
  Vehicle,
  VehicleExpense,
  VehicleDocument,
  DocumentType,
  VehicleMaintenance,
  VehicleStatus,
  Booking,
} from "../types";
import { mockGpsLocations } from "../data/mockData";
import {
  GaugeIcon,
  WrenchIcon,
  FuelIcon,
  ShieldCheckIcon,
  TrashIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  TicketIcon,
  UploadIcon,
  TruckIcon,
  UserCircleIcon,
} from "./icons";
import { StatusPill, Button, IconButton, ModalShell, Input, Label, Select } from "./UiKit";
import AddDocumentModal from "./AddDocumentModal";
import ConfirmModal from "./ConfirmModal";
import { useData } from "../contexts/DataContext";
import { downloadCsv } from "../dataIO/toCsv";

interface VehicleDetailsProps {
  vehicle: Vehicle;
  maintenance: VehicleMaintenance[];
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
  onDownloadProfile?: () => void;
  onDeleteVehicle: () => void;
  onArchiveVehicle: () => void;
  onUpdateOdometer: (nextKm: number) => void;
  onUpdateVehicleDetails?: (next: Vehicle) => void;
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

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays <= 30) return `Expires in ${diffDays}d`;
  return `Valid until ${d.toLocaleDateString()}`;
};

const getHeaderStatusTone = (status: VehicleStatus) => {
  if (status === VehicleStatus.ACTIVE) return "success" as const;
  if (status === VehicleStatus.MAINTENANCE) return "warn" as const;
  if (status === VehicleStatus.OUT_OF_SERVICE) return "danger" as const;
  return "neutral" as const;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const formatEta = (deliveryDate?: string) => {
  if (!deliveryDate) return "ETA unavailable";
  const eta = new Date(deliveryDate);
  if (Number.isNaN(eta.getTime())) return "ETA unavailable";

  const diffMs = eta.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 0) return "ETA due";
  if (diffHours < 24) return `ETA: ${diffHours}h`;

  const days = Math.ceil(diffHours / 24);
  return `ETA: ${days}d`;
};

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  maintenance = [],
  expenses = [],
  onAddExpenseClick,
  onDownloadProfile,
  onDeleteVehicle,
  onArchiveVehicle = () => {},
  onUpdateOdometer,
  onUpdateVehicleDetails,
}) => {
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const { gpsLocations, bookings } = useData();

  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState(false);
  const [odometerValue, setOdometerValue] = useState(String(vehicle.current_km ?? ""));
  const [odometerError, setOdometerError] = useState("");
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [vehicleFormError, setVehicleFormError] = useState("");
  const [vehicleForm, setVehicleForm] = useState({
    registration_number: vehicle.registration_number || "",
    make: vehicle.make || "",
    model: vehicle.model || "",
    year: String(vehicle.year || ""),
    status: vehicle.status,
    next_service_due_km: String(vehicle.next_service_due_km || ""),
    license_disc_expiry: vehicle.license_disc_expiry || "",
    insurance_expiry_date: vehicle.insurance_expiry_date || "",
  });

  const maintenanceHistory = useMemo(() => {
    return maintenance
      .filter((m) => m.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
  }, [maintenance, vehicle.id]);

  const vehicleExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, vehicle.id]);

  const gpsData = gpsLocations[vehicle.id] || mockGpsLocations.find((g) => g.vehicle_id === vehicle.id);

  const initialDocs = useMemo(() => {
    const docs: VehicleDocument[] = [];
    let idCounter = vehicle.id * 100000;

    if (vehicle.insurance_expiry_date) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.INSURANCE,
        document_name: "Insurance Policy.pdf",
        file_url: "#",
        expiry_date: vehicle.insurance_expiry_date,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }
    if (vehicle.fitness_certificate_expiry) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.FITNESS,
        document_name: "Fitness Certificate.pdf",
        file_url: "#",
        expiry_date: vehicle.fitness_certificate_expiry,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }
    if (vehicle.license_disc_expiry) {
      docs.push({
        id: idCounter++,
        vehicle_id: vehicle.id,
        document_type: DocumentType.LICENSE_DISC,
        document_name: "Registration.pdf",
        file_url: "#",
        expiry_date: vehicle.license_disc_expiry,
        uploaded_at: vehicle.updated_at,
        uploaded_by: 1,
      });
    }

    return docs;
  }, [vehicle]);

  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);

  useEffect(() => {
    setDocuments((prev) => {
      if (prev.some((d) => d.vehicle_id === vehicle.id)) return prev;
      return [...prev, ...initialDocs];
    });
  }, [vehicle.id, initialDocs]);

  useEffect(() => {
    if (isOdometerModalOpen) {
      setOdometerValue(String(vehicle.current_km ?? ""));
      setOdometerError("");
    }
  }, [isOdometerModalOpen, vehicle.current_km]);

  useEffect(() => {
    setVehicleForm({
      registration_number: vehicle.registration_number || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: String(vehicle.year || ""),
      status: vehicle.status,
      next_service_due_km: String(vehicle.next_service_due_km || ""),
      license_disc_expiry: vehicle.license_disc_expiry || "",
      insurance_expiry_date: vehicle.insurance_expiry_date || "",
    });
    setVehicleFormError("");
  }, [
    vehicle.id,
    vehicle.registration_number,
    vehicle.make,
    vehicle.model,
    vehicle.year,
    vehicle.status,
    vehicle.next_service_due_km,
    vehicle.license_disc_expiry,
    vehicle.insurance_expiry_date,
  ]);

  const handleSaveOdometer = () => {
    const nextKm = Number(odometerValue);
    if (!Number.isFinite(nextKm) || nextKm < 0) {
      setOdometerError("Enter a valid odometer reading.");
      return;
    }
    onUpdateOdometer(nextKm);
    setIsOdometerModalOpen(false);
  };

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

  const handleSaveVehicleDetails = () => {
    if (!onUpdateVehicleDetails) {
      setIsEditVehicleOpen(false);
      return;
    }

    if (!vehicleForm.registration_number.trim() || !vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      setVehicleFormError("Registration, make, and model are required.");
      return;
    }

    const year = Number(vehicleForm.year);
    const nextServiceKm = Number(vehicleForm.next_service_due_km);

    if (!Number.isFinite(year) || year < 1980 || year > 2100) {
      setVehicleFormError("Enter a valid vehicle year.");
      return;
    }

    if (!Number.isFinite(nextServiceKm) || nextServiceKm < 0) {
      setVehicleFormError("Enter a valid next service kilometer.");
      return;
    }

    const updated: Vehicle = {
      ...vehicle,
      registration_number: vehicleForm.registration_number.trim(),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      year,
      status: vehicleForm.status as VehicleStatus,
      next_service_due_km: nextServiceKm,
      license_disc_expiry: vehicleForm.license_disc_expiry || undefined,
      insurance_expiry_date: vehicleForm.insurance_expiry_date || undefined,
      updated_at: new Date().toISOString(),
    };

    onUpdateVehicleDetails(updated);
    setIsEditVehicleOpen(false);
  };

  const currentVehicleDocs = useMemo(() => {
    const docs = documents.filter((d) => d.vehicle_id === vehicle.id);
    return [...docs].sort((a, b) => {
      const aExp = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
      const bExp = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
      return aExp - bExp;
    });
  }, [documents, vehicle.id]);

  const activeBooking = useMemo(() => {
    const byVehicle = (bookings || [])
      .filter((b) => b.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return (
      byVehicle.find((b) => ["pending", "scheduled", "confirmed", "dispatched", "in_transit"].includes(b.status)) ||
      byVehicle[0] ||
      null
    );
  }, [bookings, vehicle.id]);

  const nextServiceRemainingKm = Math.max(0, Number(vehicle.next_service_due_km ?? 0) - Number(vehicle.current_km ?? 0));
  const serviceDueLabel = nextServiceRemainingKm <= 0 ? "Overdue" : `In ${new Intl.NumberFormat().format(nextServiceRemainingKm)} km`;

  const fuelLevel = clamp(100 - Math.round((nextServiceRemainingKm / Math.max(1, vehicle.next_service_due_km || 1)) * 55), 25, 98);
  const batteryLevel = clamp(Number(gpsData?.battery_level ?? 94), 40, 100);
  const pressureOk = vehicle.status !== VehicleStatus.MAINTENANCE;

  const maintenanceCostTotal = maintenanceHistory.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const expenseTotal = vehicleExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const updatedLabel = gpsData?.timestamp
    ? `${Math.max(1, Math.floor((Date.now() - new Date(gpsData.timestamp).getTime()) / (1000 * 60)))} min ago`
    : "no live ping";

  const maintenanceCsvColumns = [
    { key: "service_date", header: "Date" },
    { key: "maintenance_type", header: "Service Type", format: (v: any) => toTitle(String(v || "")) },
    { key: "parts_replaced", header: "Parts Replaced" },
    { key: "cost", header: "Cost" },
    { key: "notes", header: "Mechanic Notes" },
  ];

  return (
    <div className="vehicle-details-root">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm text-slate-500">Fleet &gt; {vehicle.registration_number}</p>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <TruckIcon className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Truck {vehicle.registration_number}</h2>
                  <StatusPill label={toTitle(String(vehicle.status))} tone={getHeaderStatusTone(vehicle.status)} />
                </div>
                <p className="mt-1 text-lg text-slate-600">
                  {vehicle.make} {vehicle.model} • {vehicle.year}
                </p>
                <p className="text-sm text-slate-500">
                  Last service: {vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : "Not set"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={onAddExpenseClick}>
                <WrenchIcon className="w-4 h-4" />
                Schedule Maintenance
              </Button>
              <Button variant="secondary" onClick={onDownloadProfile}>
                Download Profile
              </Button>
              <Button variant="secondary" onClick={() => setIsEditVehicleOpen(true)}>
                Edit Details
              </Button>
              <Button variant="secondary" onClick={() => setIsOdometerModalOpen(true)}>
                <GaugeIcon className="w-4 h-4" />
                Update Odometer
              </Button>
              <Button variant="secondary" onClick={onArchiveVehicle}>
                Archive
              </Button>
              <IconButton onClick={() => setIsDeleteVehicleModalOpen(true)} title="Delete vehicle" aria-label="Delete vehicle">
                <TrashIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                <div className="relative min-h-[290px] bg-gradient-to-br from-sky-200 via-slate-100 to-sky-50">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.9),transparent_40%)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                    <TruckIcon className="h-40 w-40 opacity-70" />
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                    Updated: {updatedLabel}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentIcon className="h-5 w-5 text-orange-500" />
                    <h3 className="text-xl font-semibold text-slate-900">Vehicle Specifications</h3>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Make / Model</p>
                      <p className="mt-1 font-medium text-slate-900">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</p>
                      <p className="mt-1 font-medium text-slate-900">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">VIN</p>
                      <p className="mt-1 font-medium text-slate-900">{vehicle.registration_number}-{vehicle.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Odometer</p>
                      <p className="mt-1 font-medium text-slate-900">{new Intl.NumberFormat().format(vehicle.current_km || 0)} km</p>
                    </div>
                  </div>

                  <div className="mt-7">
                    <h4 className="text-lg font-semibold text-slate-900">Live Telematics</h4>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                        <FuelIcon className="mx-auto h-5 w-5 text-amber-600" />
                        <p className="mt-2 text-xl font-semibold text-slate-900">{fuelLevel}%</p>
                        <p className="text-xs text-slate-600">Fuel Level</p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
                        <GaugeIcon className="mx-auto h-5 w-5 text-blue-600" />
                        <p className="mt-2 text-xl font-semibold text-slate-900">{batteryLevel}%</p>
                        <p className="text-xs text-slate-600">Battery</p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                        <MapPinIcon className="mx-auto h-5 w-5 text-emerald-600" />
                        <p className="mt-2 text-xl font-semibold text-slate-900">{pressureOk ? "OK" : "Check"}</p>
                        <p className="text-xs text-slate-600">Pressure</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Service due: <span className="font-semibold text-slate-800">{serviceDueLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Maintenance History</h3>
                  <p className="text-xs text-slate-500">{maintenanceHistory.length} records • Total {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(maintenanceCostTotal)}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadCsv(maintenanceHistory as any, maintenanceCsvColumns as any, `${vehicle.registration_number}-maintenance`)}
                >
                  Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Service Type</th>
                      <th className="px-5 py-3 font-medium">Parts Replaced</th>
                      <th className="px-5 py-3 font-medium">Cost</th>
                      <th className="px-5 py-3 font-medium">Mechanic Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No maintenance records found.
                        </td>
                      </tr>
                    ) : (
                      maintenanceHistory.slice(0, 6).map((m) => (
                        <tr key={m.id} className="border-t border-slate-200 text-slate-800">
                          <td className="px-5 py-3">{new Date(m.service_date).toLocaleDateString()}</td>
                          <td className="px-5 py-3">{toTitle(String(m.maintenance_type))}</td>
                          <td className="px-5 py-3 text-slate-600">{m.parts_replaced || "N/A"}</td>
                          <td className="px-5 py-3 font-medium">{new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(m.cost || 0))}</td>
                          <td className="px-5 py-3 text-slate-600">{m.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                Vehicle expenses total: <span className="font-semibold text-slate-900">{new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(expenseTotal)}</span>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-orange-500" />
                <h3 className="text-xl font-semibold text-slate-900">Current Assignment</h3>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Driver</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-300 bg-white text-slate-700">
                    <UserCircleIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{activeBooking?.driver_id ? `Driver #${activeBooking.driver_id}` : "Unassigned"}</p>
                    <p className="text-xs text-slate-500">{activeBooking ? `Booking ${activeBooking.booking_number}` : "No active booking"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm text-slate-600">Origin</p>
                    <p className="text-lg sm:text-base font-semibold text-slate-900">{activeBooking?.pickup_city || "Not assigned"}</p>
                    <p className="text-xs text-slate-500">{activeBooking?.pickup_date ? new Date(activeBooking.pickup_date).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                <div className="ml-[4px] h-7 w-px bg-slate-200" />
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <div>
                    <p className="text-sm text-slate-600">Destination</p>
                    <p className="text-lg sm:text-base font-semibold text-slate-900">{activeBooking?.delivery_city || "Not assigned"}</p>
                    <p className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {formatEta(activeBooking?.delivery_date)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={!activeBooking?.driver_id}
                type="button"
              >
                Message Driver
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-semibold text-slate-900">Documents</h3>
                </div>
                <IconButton onClick={() => setIsAddDocumentModalOpen(true)} title="Upload document" aria-label="Upload document">
                  <UploadIcon className="w-4 h-4" />
                </IconButton>
              </div>

              <div className="mt-4 space-y-3">
                {currentVehicleDocs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No documents uploaded yet.</div>
                ) : (
                  currentVehicleDocs.slice(0, 4).map((doc) => {
                    const tone = getDocTone(doc.expiry_date);
                    const icon =
                      doc.document_type === DocumentType.INSURANCE ? (
                        <ShieldCheckIcon className="w-4 h-4" />
                      ) : doc.document_type === DocumentType.LICENSE_DISC ? (
                        <TicketIcon className="w-4 h-4" />
                      ) : doc.document_type === DocumentType.FITNESS ? (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      ) : (
                        <DocumentTextIcon className="w-4 h-4" />
                      );

                    return (
                      <div key={doc.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{doc.document_name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <StatusPill label={toTitle(String(doc.document_type))} tone={tone} />
                              <span className="text-xs text-slate-500">{formatExpiryLabel(doc.expiry_date)}</span>
                            </div>
                          </div>
                        </div>
                        <IconButton onClick={() => setDocumentToDelete(doc.id)} title="Delete document" aria-label="Delete document">
                          <TrashIcon className="w-4 h-4" />
                        </IconButton>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-slate-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">Note</p>
              <p className="mt-2 text-base leading-relaxed">
                {vehicle.notes?.trim() || "Don't forget to check the alternator belt tension during the next scheduled maintenance."}
              </p>
              <div className="mt-4 text-xs text-slate-300">Added by Fleet Admin</div>
            </section>
          </div>
        </div>
      </div>

      {isAddDocumentModalOpen ? (
        <AddDocumentModal onClose={() => setIsAddDocumentModalOpen(false)} onAddDocument={handleAddDocument} />
      ) : null}

      <ModalShell
        isOpen={isEditVehicleOpen}
        onClose={() => setIsEditVehicleOpen(false)}
        title="Edit Vehicle Details"
        description="Update core vehicle profile and compliance dates."
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-rose-600">{vehicleFormError}</span>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditVehicleOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={handleSaveVehicleDetails}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Registration Number</Label>
            <Input
              value={vehicleForm.registration_number}
              onChange={(e) => setVehicleForm((p) => ({ ...p, registration_number: e.target.value }))}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={vehicleForm.status}
              onChange={(e) => setVehicleForm((p) => ({ ...p, status: e.target.value as VehicleStatus }))}
            >
              {Object.values(VehicleStatus).map((s) => (
                <option key={s} value={s}>
                  {toTitle(String(s))}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Make</Label>
            <Input value={vehicleForm.make} onChange={(e) => setVehicleForm((p) => ({ ...p, make: e.target.value }))} />
          </div>
          <div>
            <Label>Model</Label>
            <Input value={vehicleForm.model} onChange={(e) => setVehicleForm((p) => ({ ...p, model: e.target.value }))} />
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm((p) => ({ ...p, year: e.target.value }))} />
          </div>
          <div>
            <Label>Next Service Due (km)</Label>
            <Input
              type="number"
              value={vehicleForm.next_service_due_km}
              onChange={(e) => setVehicleForm((p) => ({ ...p, next_service_due_km: e.target.value }))}
            />
          </div>
          <div>
            <Label>License Disc Expiry</Label>
            <Input
              type="date"
              value={vehicleForm.license_disc_expiry}
              onChange={(e) => setVehicleForm((p) => ({ ...p, license_disc_expiry: e.target.value }))}
            />
          </div>
          <div>
            <Label>Insurance Expiry</Label>
            <Input
              type="date"
              value={vehicleForm.insurance_expiry_date}
              onChange={(e) => setVehicleForm((p) => ({ ...p, insurance_expiry_date: e.target.value }))}
            />
          </div>
        </div>
      </ModalShell>

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
          }
        }}
        title="Delete document"
        message="Are you sure you want to delete this document?"
      />
    </div>
  );
};

export default VehicleDetails;

