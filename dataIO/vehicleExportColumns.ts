import type { Booking, Driver, User, Vehicle } from "../types";
import type { CsvColumn } from "./toCsv";
import type { XlsxColumn } from "./toXlsx";

type VehicleLookupMaps = {
  activeBookingByVehicleId: Record<number, Booking | undefined>;
  driverById: Record<number, Driver | undefined>;
  userById: Record<string, User | undefined>;
};

const toNum = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const dateGB = (value: unknown): string => {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { timeZone: "Africa/Harare" });
};

const dateTimeGB = (value: unknown): string => {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const text = (value: unknown): string => {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
};

const money = (value: unknown): string => toNum(value).toFixed(2);

type VehicleColumn = {
  key: keyof Vehicle | string;
  header: string;
  width?: number;
  format?: (value: unknown, row: Vehicle) => string | number;
};

const buildColumns = (maps: VehicleLookupMaps): VehicleColumn[] => [
  { key: "registration_number", header: "Registration", width: 16 },
  { key: "status", header: "Status", width: 16, format: (v) => text(v).replace(/_/g, " ") },
  { key: "vehicle_type", header: "Vehicle Type", width: 16, format: (v) => text(v).replace(/_/g, " ") },
  { key: "make", header: "Make", width: 16 },
  { key: "model", header: "Model", width: 16 },
  { key: "year", header: "Year", width: 10 },
  { key: "capacity_tonnes", header: "Capacity (Tonnes)", width: 14, format: (v) => toNum(v).toFixed(2) },
  { key: "current_km", header: "Current KM", width: 14, format: (v) => Math.round(toNum(v)) },
  { key: "next_service_due_km", header: "Next Service KM", width: 16, format: (v) => Math.round(toNum(v)) },
  {
    key: "service_buffer_km",
    header: "Service Buffer KM",
    width: 16,
    format: (_, row) => Math.max(0, Math.round(toNum(row.next_service_due_km) - toNum(row.current_km))),
  },
  { key: "last_service_date", header: "Last Service Date", width: 18, format: dateGB },
  { key: "next_service_due_date", header: "Next Service Date", width: 18, format: dateGB },
  { key: "purchase_date", header: "Purchase Date", width: 18, format: dateGB },
  { key: "purchase_cost", header: "Purchase Cost", width: 14, format: money },
  { key: "current_value", header: "Current Value", width: 14, format: money },
  { key: "fuel_type", header: "Fuel Type", width: 12 },
  { key: "gps_device_id", header: "GPS Device ID", width: 18 },
  { key: "gps_device_active", header: "GPS Active", width: 12, format: (v) => (v ? "Yes" : "No") },
  { key: "insurance_expiry_date", header: "Insurance Expiry", width: 18, format: dateGB },
  { key: "fitness_certificate_expiry", header: "Fitness Expiry", width: 18, format: dateGB },
  { key: "license_disc_expiry", header: "License Disc Expiry", width: 18, format: dateGB },
  {
    key: "active_booking_number",
    header: "Active Booking",
    width: 20,
    format: (_, row) => text(maps.activeBookingByVehicleId[row.id]?.booking_number || ""),
  },
  {
    key: "active_booking_route",
    header: "Active Route",
    width: 28,
    format: (_, row) => {
      const booking = maps.activeBookingByVehicleId[row.id];
      if (!booking) return "";
      return `${booking.pickup_city} -> ${booking.delivery_city}`;
    },
  },
  {
    key: "assigned_driver",
    header: "Assigned Driver",
    width: 22,
    format: (_, row) => {
      const booking = maps.activeBookingByVehicleId[row.id];
      if (!booking?.driver_id) return "";
      const driver = maps.driverById[booking.driver_id];
      if (!driver) return `Driver #${booking.driver_id}`;
      const user = maps.userById[String(driver.user_id)];
      if (!user) return `Driver #${driver.id}`;
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    },
  },
  { key: "notes", header: "Notes", width: 34 },
  { key: "created_at", header: "Created At (Africa/Harare)", width: 24, format: dateTimeGB },
  { key: "updated_at", header: "Updated At (Africa/Harare)", width: 24, format: dateTimeGB },
];

export const buildVehicleCsvColumns = (maps: VehicleLookupMaps): CsvColumn<Vehicle>[] =>
  buildColumns(maps).map((c) => ({
    key: c.key,
    header: c.header,
    format: c.format as CsvColumn<Vehicle>["format"],
  }));

export const buildVehicleXlsxColumns = (maps: VehicleLookupMaps): XlsxColumn<Vehicle>[] =>
  buildColumns(maps).map((c) => ({
    title: c.header,
    key: c.key,
    width: c.width ?? 18,
    format: c.format as XlsxColumn<Vehicle>["format"],
  }));

