import React, { useEffect, useMemo, useState } from "react";
import { ShellCard, SectionHeader, StatusPill } from "./UiKit";
import { useData } from "../contexts/DataContext";
import { Booking, Invoice, Customer } from "../types";

type ValidationResult = { ok: true; customerId: string; email: string } | { ok: false; error: string };

const parseToken = () => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
};

const CustomerPortalPage: React.FC = () => {
  const { bookings, invoices, customers } = useData();
  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = parseToken();
    if (!token) {
      setStatus("error");
      setError("Missing token. Use the magic link from your email.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/customer-portal/validate?token=${encodeURIComponent(token)}`);
        const data: ValidationResult = await res.json();
        if (!res.ok || !data || (data as any).ok !== true) {
          throw new Error((data as any)?.error || "Invalid or expired link");
        }
        setCustomerId((data as any).customerId);
        setEmail((data as any).email);
        setStatus("ready");
      } catch (e: any) {
        setError(e?.message || "Invalid or expired link");
        setStatus("error");
      }
    })();
  }, []);

  const portalCustomer: Customer | undefined = useMemo(() => {
    if (!customerId) return undefined;
    return customers.find((c) => String(c.id) === String(customerId));
  }, [customerId, customers]);

  const customerBookings: Booking[] = useMemo(() => {
    if (!customerId) return [];
    return bookings.filter((b) => String((b as any).customer_id ?? "") === String(customerId));
  }, [bookings, customerId]);

  const customerInvoices: Invoice[] = useMemo(() => {
    if (!customerId) return [];
    return invoices.filter((i) => String((i as any).customer_id ?? "") === String(customerId));
  }, [invoices, customerId]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <StatusPill tone="info" label="Verifying your link..." />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <ShellCard className="max-w-lg w-full p-6 text-center">
          <StatusPill tone="warn" label={error || "Link invalid or expired"} />
          <p className="mt-3 text-sm text-slate-600">Request a new link from your dispatcher.</p>
        </ShellCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6 px-1 sm:px-0">
        <ShellCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">CUSTOMER PORTAL</div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1 truncate">Welcome{portalCustomer ? `, ${portalCustomer.company_name}` : ""}</h1>
              <div className="text-sm text-slate-600 truncate">Signed in via secure magic link {email ? `for ${email}` : ""}</div>
            </div>
            <StatusPill tone="success" label="Magic link verified" className="mt-2 sm:mt-0" />
          </div>
        </ShellCard>

        <div className="grid gap-4 md:grid-cols-2">
          <ShellCard className="p-5">
            <SectionHeader title="Bookings & Deliveries" subtitle="Live status for your loads." />
            {customerBookings.length === 0 ? (
              <p className="text-sm text-slate-600 mt-3">No bookings yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {customerBookings.map((b) => (
                  <div key={b.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span>{(b as any).booking_number || `Booking #${b.id}`}</span>
                      <StatusPill tone="info" label={b.status || "pending"} />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {((b as any).origin || "Origin")} → {((b as any).destination || "Destination")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>

          <ShellCard className="p-5">
            <SectionHeader title="Invoices" subtitle="Recent billing for your account." />
            {customerInvoices.length === 0 ? (
              <p className="text-sm text-slate-600 mt-3">No invoices yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {customerInvoices.map((inv) => (
                  <div key={inv.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 overflow-hidden">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span>{(inv as any).invoice_number || `Invoice #${inv.id}`}</span>
                      <StatusPill tone={inv.status === "paid" ? "success" : "warn"} label={inv.status || "open"} />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Amount: {(inv as any).amount || (inv as any).total_amount || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>
        </div>

        <ShellCard className="p-5">
          <SectionHeader title="Account details" subtitle="Your company profile." />
          {portalCustomer ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-800">
              <div>
                <div className="text-slate-500 text-xs">Company</div>
                <div className="font-semibold">{portalCustomer.company_name}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Billing email</div>
                <div className="font-semibold">{portalCustomer.billing_email}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">City</div>
                <div className="font-semibold">{portalCustomer.city}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Country</div>
                <div className="font-semibold">{portalCustomer.country}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 mt-2">Account details unavailable for this link.</p>
          )}
        </ShellCard>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
