import { jsPDF } from "jspdf";
import type { Booking, Customer, Invoice } from "../types";

type InvoicePdfContext = {
  customer?: Customer;
  booking?: Booking;
  issuerName?: string;
  issuerAddress?: string[];
  issuerEmail?: string;
  issuerPhone?: string;
};

const dateGB = (value?: string): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { timeZone: "Africa/Harare" });
};

const money = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-ZW", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const text = (value: unknown): string => (value == null ? "" : String(value).trim());

export const downloadInvoicePdf = (invoice: Invoice, context: InvoicePdfContext = {}): void => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const margin = 44;
  const left = margin;
  const right = pageWidth - margin;
  const labelColor = "#64748b";
  const valueColor = "#0f172a";
  const accent = "#f97316";

  const issuerName = context.issuerName || "Heartfledge Logistics";
  const issuerAddress = context.issuerAddress || ["Harare, Zimbabwe", "Southern Africa Operations"];
  const issuerEmail = context.issuerEmail || "billing@heartfledge.co.zw";
  const issuerPhone = context.issuerPhone || "+263 24 270 0000";

  const customer = context.customer;
  const booking = context.booking;

  const drawLabelValue = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(labelColor);
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(valueColor);
    doc.text(value || "-", x, y + 14);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(valueColor);
  doc.text(issuerName, left, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(labelColor);
  issuerAddress.forEach((line, idx) => doc.text(line, left, 68 + idx * 13));
  doc.text(issuerEmail, left, 95);
  doc.text(issuerPhone, left, 108);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(accent);
  doc.text("INVOICE", right - 120, 52);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(labelColor);
  doc.text("Invoice Number", right - 170, 78);
  doc.text("Issue Date", right - 170, 93);
  doc.text("Due Date", right - 170, 108);
  doc.text("Status", right - 170, 123);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(valueColor);
  doc.text(text(invoice.invoice_number), right - 78, 78, { align: "right" });
  doc.text(dateGB(invoice.issue_date) || "-", right - 78, 93, { align: "right" });
  doc.text(dateGB(invoice.due_date) || "-", right - 78, 108, { align: "right" });
  doc.text(text(invoice.status).replace(/_/g, " ").toUpperCase(), right - 78, 123, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(left, 140, right, 140);

  drawLabelValue("BILL TO", `${customer?.company_name || `Customer #${invoice.customer_id}`}`, left, 162);
  drawLabelValue("BOOKING", booking?.booking_number || (invoice.booking_id ? `#${invoice.booking_id}` : "Not linked"), left + 220, 162);

  const customerLines = [
    customer?.address_line1,
    [customer?.city, customer?.country].filter(Boolean).join(", "),
    customer?.billing_email,
  ].filter(Boolean) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(valueColor);
  customerLines.forEach((line, idx) => doc.text(line, left, 191 + idx * 13));

  const bookingLines = [
    booking ? `${booking.pickup_city}, ${booking.pickup_country}` : "",
    booking ? `${booking.delivery_city}, ${booking.delivery_country}` : "",
    booking ? `Pickup: ${dateGB(booking.pickup_date)}` : "",
  ].filter(Boolean);
  bookingLines.forEach((line, idx) => doc.text(line, left + 220, 191 + idx * 13));

  const tableTop = 248;
  const col = {
    desc: left,
    qty: left + 300,
    rate: left + 370,
    amount: right - 6,
  };

  doc.setFillColor(248, 250, 252);
  doc.rect(left, tableTop - 18, right - left, 24, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(left, tableTop - 18, right - left, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(labelColor);
  doc.text("DESCRIPTION", col.desc + 6, tableTop - 3);
  doc.text("QTY", col.qty + 10, tableTop - 3);
  doc.text("RATE", col.rate + 10, tableTop - 3);
  doc.text("AMOUNT", col.amount - 4, tableTop - 3, { align: "right" });

  const lineItems = [
    { description: "Base logistics service", qty: 1, rate: invoice.subtotal, amount: invoice.subtotal },
    { description: "Tax / VAT", qty: 1, rate: invoice.tax_amount, amount: invoice.tax_amount },
    ...(invoice.discount_amount > 0
      ? [{ description: "Discount", qty: 1, rate: -invoice.discount_amount, amount: -invoice.discount_amount }]
      : []),
  ];

  let y = tableTop + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(valueColor);
  lineItems.forEach((item) => {
    doc.text(item.description, col.desc + 6, y);
    doc.text(String(item.qty), col.qty + 18, y);
    doc.text(money(item.rate, invoice.currency), col.rate + 58, y, { align: "right" });
    doc.text(money(item.amount, invoice.currency), col.amount - 4, y, { align: "right" });
    y += 22;
    doc.setDrawColor(241, 245, 249);
    doc.line(left, y - 10, right, y - 10);
  });

  const summaryX = right - 210;
  const summaryY = y + 10;
  drawLabelValue("Subtotal", money(invoice.subtotal, invoice.currency), summaryX, summaryY);
  drawLabelValue("Tax / VAT", money(invoice.tax_amount, invoice.currency), summaryX, summaryY + 36);
  drawLabelValue("Discount", money(invoice.discount_amount, invoice.currency), summaryX, summaryY + 72);

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX, summaryY + 96, right, summaryY + 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(labelColor);
  doc.text("Total Amount", summaryX, summaryY + 116);
  doc.setFontSize(13);
  doc.setTextColor(accent);
  doc.text(money(invoice.total_amount, invoice.currency), right, summaryY + 116, { align: "right" });

  const footerY = 742;
  doc.setDrawColor(226, 232, 240);
  doc.line(left, footerY - 18, right, footerY - 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(labelColor);
  doc.text(`Payment terms: Net ${invoice.payment_terms || 30} days`, left, footerY);
  doc.text(`Generated: ${dateGB(new Date().toISOString())} (Africa/Harare)`, right, footerY, { align: "right" });

  if (invoice.customer_notes) {
    const noteY = footerY - 44;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(labelColor);
    doc.text("Client Notes", left, noteY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(valueColor);
    const wrapped = doc.splitTextToSize(invoice.customer_notes, right - left);
    doc.text(wrapped, left, noteY + 14);
  }

  const fileSafeNumber = text(invoice.invoice_number).replace(/[^\w\-]+/g, "_") || `invoice_${invoice.id}`;
  doc.save(`${fileSafeNumber}.pdf`);
};

