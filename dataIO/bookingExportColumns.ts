import type { Booking, Customer, Driver, User, Vehicle } from "../types";
import type { CsvColumn } from "./toCsv";
import type { XlsxColumn } from "./toXlsx";

type BookingLookupMaps = {
  customerById: Record<number, Customer | undefined>;
  driverById: Record<number, Driver | undefined>;
  userById: Record<string, User | undefined>;
  vehicleById: Record<number, Vehicle | undefined>;
};

const parseNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const text = (value: unknown): string => {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
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

const money = (value: unknown): string => parseNumber(value).toFixed(2);

type BookingColumn = {
  key: keyof Booking | string;
  header: string;
  width?: number;
  format?: (value: unknown, row: Booking) => string | number;
};

const buildColumns = (maps: BookingLookupMaps): BookingColumn[] => [
  { key: "booking_number", header: "Booking Number", width: 20 },
  { key: "status", header: "Status", width: 14, format: (v) => text(v).replace(/_/g, " ") },
  { key: "payment_status", header: "Payment Status", width: 16, format: (v) => text(v).replace(/_/g, " ") },
  { key: "customer_id", header: "Customer ID", width: 12 },
  {
    key: "customer_name",
    header: "Customer Name",
    width: 28,
    format: (_, row) => text(maps.customerById[row.customer_id]?.company_name || ""),
  },
  { key: "pickup_date", header: "Pickup Date (DD/MM/YYYY)", width: 22, format: dateGB },
  { key: "delivery_date", header: "Delivery Date (DD/MM/YYYY)", width: 22, format: dateGB },
  { key: "pickup_city", header: "Pickup City", width: 18 },
  { key: "pickup_country", header: "Pickup Country", width: 18 },
  { key: "delivery_city", header: "Delivery City", width: 18 },
  { key: "delivery_country", header: "Delivery Country", width: 18 },
  { key: "cargo_type", header: "Cargo Type", width: 16, format: (v) => text(v).replace(/_/g, " ") },
  { key: "cargo_description", header: "Cargo Description", width: 36 },
  { key: "weight_tonnes", header: "Weight (Tonnes)", width: 14, format: (v) => parseNumber(v).toFixed(2) },
  { key: "requires_refrigeration", header: "Requires Refrigeration", width: 20, format: (v) => (v ? "Yes" : "No") },
  { key: "temperature_min", header: "Temperature Min", width: 14, format: (v) => (v == null ? "" : parseNumber(v).toFixed(1)) },
  { key: "temperature_max", header: "Temperature Max", width: 14, format: (v) => (v == null ? "" : parseNumber(v).toFixed(1)) },
  { key: "driver_id", header: "Driver ID", width: 10 },
  {
    key: "driver_name",
    header: "Driver Name",
    width: 24,
    format: (_, row) => {
      const driver = row.driver_id ? maps.driverById[row.driver_id] : undefined;
      if (!driver) return "";
      const linked = maps.userById[String(driver.user_id)];
      return text(
        linked
          ? `${linked.first_name || ""} ${linked.last_name || ""}`.trim()
          : `Driver #${driver.id}`,
      );
    },
  },
  { key: "vehicle_id", header: "Vehicle ID", width: 10 },
  {
    key: "vehicle_registration",
    header: "Vehicle Registration",
    width: 20,
    format: (_, row) => text((row.vehicle_id ? maps.vehicleById[row.vehicle_id]?.registration_number : "") || ""),
  },
  { key: "base_price", header: "Base Price", width: 14, format: money },
  { key: "surcharges", header: "Surcharges", width: 14, format: money },
  { key: "discount", header: "Discount", width: 14, format: money },
  { key: "total_price", header: "Total Price", width: 14, format: money },
  { key: "currency", header: "Currency", width: 10 },
  { key: "special_instructions", header: "Special Instructions", width: 36 },
  { key: "notes", header: "Notes", width: 36 },
  { key: "created_at", header: "Created At (Africa/Harare)", width: 24, format: dateTimeGB },
  { key: "updated_at", header: "Updated At (Africa/Harare)", width: 24, format: dateTimeGB },
];

export const buildBookingCsvColumns = (maps: BookingLookupMaps): CsvColumn<Booking>[] =>
  buildColumns(maps).map((c) => ({
    key: c.key,
    header: c.header,
    format: c.format as CsvColumn<Booking>["format"],
  }));

export const buildBookingXlsxColumns = (maps: BookingLookupMaps): XlsxColumn<Booking>[] =>
  buildColumns(maps).map((c) => ({
    title: c.header,
    key: c.key,
    width: c.width ?? 18,
    format: c.format as XlsxColumn<Booking>["format"],
  }));

