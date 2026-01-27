import React, { useMemo, useState } from "react";
import { FuelType, Vehicle, VehicleStatus, VehicleType } from "../types";
import { Button, Input, ModalShell, Select, SubtleCard, Textarea } from "./UiKit";
import { toTitle } from "../utils/toTitle";

type NewVehicle = Omit<Vehicle, "id" | "created_at" | "updated_at">;

interface AddVehicleModalProps {
  onClose: () => void;
  onAddVehicle: (vehicle: NewVehicle) => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose, onAddVehicle }) => {
  const [error, setError] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    registration_number: "",
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    vehicle_type: VehicleType.DRY,
    capacity_tonnes: "",
    status: VehicleStatus.ACTIVE,

    purchase_date: today,
    purchase_cost: "",
    current_value: "",

    last_service_date: today,
    last_service_km: "",
    next_service_due_km: "",
    next_service_due_date: "",
    current_km: "",

    fuel_type: FuelType.DIESEL,
    gps_device_id: "",
    gps_device_active: false,
    notes: "",
  });

  const vt = useMemo(() => Object.values(VehicleType), []);
  const vs = useMemo(() => Object.values(VehicleStatus), []);
  const ft = useMemo(() => Object.values(FuelType), []);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((p) => ({ ...p, [k]: v as any }));
    };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.registration_number.trim()) return setError("Registration number is required.");
    if (!form.make.trim()) return setError("Make is required.");
    if (!form.model.trim()) return setError("Model is required.");
    if (!form.year) return setError("Year is required.");
    if (!form.purchase_date) return setError("Purchase date is required.");
    if (!form.purchase_cost) return setError("Purchase cost is required.");
    if (!form.last_service_date) return setError("Last service date is required.");
    if (!form.next_service_due_km) return setError("Next service due km is required.");
    if (!form.current_km) return setError("Current km is required.");

    const year = Number(form.year);
    if (!Number.isFinite(year) || year < 1900) return setError("Enter a valid year.");

    const payload: NewVehicle = {
      registration_number: form.registration_number.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year,
      vehicle_type: form.vehicle_type,
      capacity_tonnes: form.capacity_tonnes ? Number(form.capacity_tonnes) : 0,
      status: form.status,

      purchase_date: form.purchase_date,
      purchase_cost: Number(form.purchase_cost),
      current_value: form.current_value ? Number(form.current_value) : undefined,

      insurance_provider: undefined,
      insurance_policy_number: undefined,
      insurance_expiry_date: undefined,
      fitness_certificate_expiry: undefined,
      license_disc_expiry: undefined,

      last_service_date: form.last_service_date,
      last_service_km: form.last_service_km ? Number(form.last_service_km) : undefined,
      next_service_due_km: Number(form.next_service_due_km),
      next_service_due_date: form.next_service_due_date || undefined,
      current_km: Number(form.current_km),

      fuel_type: form.fuel_type,
      gps_device_id: form.gps_device_id.trim() || undefined,
      gps_device_active: Boolean(form.gps_device_active),
      notes: form.notes.trim() || undefined,
    };

    onAddVehicle(payload);
    onClose();
  };

  return (
    <ModalShell
      isOpen={true}
      title="Add vehicle"
      description="Register a vehicle and start tracking service and usage."
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-vehicle-form">
            Save vehicle
          </Button>
        </div>
      }
    >
      <form id="add-vehicle-form" onSubmit={submit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-slate-900">
            {error}
          </div>
        ) : null}

        <SubtleCard className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Basics</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Registration</label>
              <Input value={form.registration_number} onChange={set("registration_number")} placeholder="e.g. HFL-TRK-101" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Make</label>
              <Input value={form.make} onChange={set("make")} placeholder="e.g. Isuzu" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Model</label>
              <Input value={form.model} onChange={set("model")} placeholder="e.g. FTR 850" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Year</label>
              <Input type="number" min={1900} value={form.year} onChange={set("year")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Vehicle type</label>
              <Select value={form.vehicle_type} onChange={set("vehicle_type")}>
                {vt.map((v) => (
                  <option key={v} value={v}>
                    {toTitle(String(v))}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
              <Select value={form.status} onChange={set("status")}>
                {vs.map((v) => (
                  <option key={v} value={v}>
                    {toTitle(String(v))}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Capacity (tonnes)</label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.capacity_tonnes}
                onChange={set("capacity_tonnes")}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Fuel type</label>
              <Select value={form.fuel_type} onChange={set("fuel_type")}>
                {ft.map((v) => (
                  <option key={v} value={v}>
                    {toTitle(String(v))}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">GPS device ID</label>
              <Input value={form.gps_device_id} onChange={set("gps_device_id")} placeholder="Optional" />
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Service & usage</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Current km</label>
              <Input type="number" min={0} value={form.current_km} onChange={set("current_km")} placeholder="e.g. 108500" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Next service due km</label>
              <Input type="number" min={0} value={form.next_service_due_km} onChange={set("next_service_due_km")} placeholder="e.g. 120000" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Last service date</label>
              <Input type="date" value={form.last_service_date} onChange={set("last_service_date")} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Last service km</label>
              <Input type="number" min={0} value={form.last_service_km} onChange={set("last_service_km")} placeholder="Optional" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Next service due date</label>
              <Input type="date" value={form.next_service_due_date} onChange={set("next_service_due_date")} />
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Purchase</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase date</label>
              <Input type="date" value={form.purchase_date} onChange={set("purchase_date")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase cost</label>
              <Input type="number" min={0} value={form.purchase_cost} onChange={set("purchase_cost")} placeholder="e.g. 45000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Current value</label>
              <Input type="number" min={0} value={form.current_value} onChange={set("current_value")} placeholder="Optional" />
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Notes</div>
          <Textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Optional notes about this vehicle…" />
        </SubtleCard>
      </form>
    </ModalShell>
  );
};

export default AddVehicleModal;
