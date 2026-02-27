import type { Booking, Customer, Invoice } from "../types";
import type { CsvColumn } from "./toCsv";
import type { XlsxColumn } from "./toXlsx";

type InvoiceLookupMaps = {
  customerById: Record<number, Customer | undefined>;
  bookingById: Record<number, Booking | undefined>;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDateGB = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { timeZone: "Africa/Harare" });
};

const formatDateTimeGB = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value: unknown): string => toNumber(value).toFixed(2);

const sanitizeText = (value: unknown): string => {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
};

type InvoiceColumnConfig = {
  key: keyof Invoice | string;
  header: string;
  width?: number;
  format?: (value: unknown, row: Invoice) => string | number;
};

const buildColumns = (maps: InvoiceLookupMaps): InvoiceColumnConfig[] => [
  { key: "invoice_number", header: "Invoice Number", width: 22 },
  {
    key: "status",
    header: "Status",
    width: 14,
    format: (value) => sanitizeText(value).replace(/_/g, " "),
  },
  {
    key: "invoice_type",
    header: "Invoice Type",
    width: 16,
    format: (value) => sanitizeText(value).replace(/_/g, " "),
  },
  { key: "customer_id", header: "Customer ID", width: 12 },
  {
    key: "customer_name",
    header: "Customer Name",
    width: 30,
    format: (_, row) => sanitizeText(maps.customerById[row.customer_id]?.company_name || ""),
  },
  {
    key: "customer_city",
    header: "Customer City",
    width: 18,
    format: (_, row) => sanitizeText(maps.customerById[row.customer_id]?.city || ""),
  },
  {
    key: "customer_country",
    header: "Customer Country",
    width: 18,
    format: (_, row) => sanitizeText(maps.customerById[row.customer_id]?.country || ""),
  },
  { key: "booking_id", header: "Booking ID", width: 12 },
  {
    key: "booking_number",
    header: "Booking Number",
    width: 20,
    format: (_, row) =>
      row.booking_id ? sanitizeText(maps.bookingById[row.booking_id]?.booking_number || "") : "",
  },
  { key: "issue_date", header: "Issue Date (DD/MM/YYYY)", width: 20, format: formatDateGB },
  { key: "due_date", header: "Due Date (DD/MM/YYYY)", width: 20, format: formatDateGB },
  { key: "payment_terms", header: "Payment Terms (Days)", width: 20 },
  { key: "currency", header: "Currency", width: 12 },
  { key: "subtotal", header: "Subtotal", width: 14, format: formatMoney },
  { key: "tax_amount", header: "Tax / VAT Amount", width: 16, format: formatMoney },
  { key: "discount_amount", header: "Discount Amount", width: 16, format: formatMoney },
  { key: "total_amount", header: "Total Amount", width: 16, format: formatMoney },
  { key: "amount_paid", header: "Amount Paid", width: 14, format: formatMoney },
  { key: "balance_due", header: "Balance Due", width: 14, format: formatMoney },
  { key: "reminder_at", header: "Reminder Date", width: 18, format: formatDateGB },
  { key: "last_reminder_at", header: "Last Reminder Sent", width: 22, format: formatDateTimeGB },
  { key: "sent_at", header: "Sent At", width: 22, format: formatDateTimeGB },
  { key: "viewed_at", header: "Viewed At", width: 22, format: formatDateTimeGB },
  { key: "paid_at", header: "Paid At", width: 22, format: formatDateTimeGB },
  { key: "notes", header: "Internal Notes", width: 40, format: sanitizeText },
  { key: "customer_notes", header: "Client Notes", width: 40, format: sanitizeText },
  { key: "created_by", header: "Created By (User ID)", width: 20 },
  { key: "created_at", header: "Created At (Africa/Harare)", width: 24, format: formatDateTimeGB },
  { key: "updated_at", header: "Updated At (Africa/Harare)", width: 24, format: formatDateTimeGB },
];

export const buildInvoiceCsvColumns = (maps: InvoiceLookupMaps): CsvColumn<Invoice>[] =>
  buildColumns(maps).map((column) => ({
    key: column.key,
    header: column.header,
    format: column.format as CsvColumn<Invoice>["format"],
  }));

export const buildInvoiceXlsxColumns = (maps: InvoiceLookupMaps): XlsxColumn<Invoice>[] =>
  buildColumns(maps).map((column) => ({
    title: column.header,
    key: column.key,
    width: column.width ?? 18,
    format: column.format as XlsxColumn<Invoice>["format"],
  }));
