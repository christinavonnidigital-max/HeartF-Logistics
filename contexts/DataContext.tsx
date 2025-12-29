

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
    AuditLogEntry,
    AuditEvent,
    Booking,
    BookingStatusChange,
    BookingStatusEvent,
    Driver,
    Expense,
    Invoice,
    Lead,
    Opportunity,
    User,
    Customer,
    Vehicle,
} from '../types';
import { useAuth } from '../auth/AuthContext';

const STORAGE_KEY = 'hf_global_data_v1';

type DataContextValue = {
    vehicles: Vehicle[];
    bookings: Booking[];
    leads: Lead[];
    opportunities: Opportunity[];
    invoices: Invoice[];
    expenses: Expense[];
    drivers: Driver[];
    users: User[];
    customers: Customer[];
    auditLog: AuditEvent[];

    addBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => void;
    updateBooking: (booking: Booking) => void;

    addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
    updateLead: (lead: Lead) => void;
    deleteLead: (id: number) => void;

    updateOpportunity: (opportunity: Opportunity) => void;

    addInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => void;
    addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => void;

    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (id: number) => void;

    addUser: (user: Omit<User, 'id'>) => void;
    deleteUser: (id: string | number) => void;
    clearAuditLog?: () => void;
};

const DataContext = createContext<DataContextValue | null>(null);

const safeId = () => {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
};

const nowIso = () => new Date().toISOString();

// Helpers for status history and audit generation
function appendStatusHistory(prev: Booking, next: Booking, actor?: { id?: string | number; role?: string }) {
    const statusChanged = prev.status !== next.status;

    const status_history = statusChanged
        ? [
            ...(prev.status_history ?? []),
            {
                id: safeId(),
                at: nowIso(),
                from: prev.status ?? null,
                to: next.status,
                by: actor ? { id: actor.id, role: actor.role } : undefined,
            } as BookingStatusEvent,
        ]
        : (prev.status_history ?? []);

    return { statusChanged, status_history };
}

function makeAuditForStatusChange(prev: Booking, next: Booking, actor?: { id?: string | number; role?: string }) {
    const audit: AuditEvent = {
        id: safeId(),
        at: nowIso(),
        actor: actor ? { id: actor.id, role: actor.role } : undefined,
        action: 'booking.status.change',
        entity: { type: 'booking', id: prev.id, ref: prev.booking_number },
        meta: { from: prev.status, to: next.status },
    } as AuditEvent;

    return audit;
}

function loadState() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const persisted = useMemo(() => loadState(), []);

    const [vehicles, setVehicles] = useState<Vehicle[]>(persisted?.vehicles ?? []);
    const [bookings, setBookings] = useState<Booking[]>(persisted?.bookings ?? []);
    const [leads, setLeads] = useState<Lead[]>(persisted?.leads ?? []);
    const [opportunities, setOpportunities] = useState<Opportunity[]>(persisted?.opportunities ?? []);
    const [invoices, setInvoices] = useState<Invoice[]>(persisted?.invoices ?? []);
    const [expenses, setExpenses] = useState<Expense[]>(persisted?.expenses ?? []);
    const [drivers, setDrivers] = useState<Driver[]>(persisted?.drivers ?? []);
    const [users, setUsers] = useState<User[]>(persisted?.users ?? []);
    const [customers, setCustomers] = useState<Customer[]>(persisted?.customers ?? []);
    const [auditLog, setAuditLog] = useState<AuditEvent[]>(persisted?.auditLog ?? []);

    useEffect(() => {
        const payload = {
            vehicles,
            bookings,
            leads,
            opportunities,
            invoices,
            expenses,
            drivers,
            users,
            customers,
            auditLog,
            savedAt: nowIso(),
        };

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore
        }
    }, [vehicles, bookings, leads, opportunities, invoices, expenses, drivers, users, customers, auditLog]);

    const addAudit = (entry: Omit<AuditEvent, 'id' | 'at'>) => {
        const full: AuditEvent = { id: safeId(), at: nowIso(), ...entry };
        setAuditLog((prev) => [full, ...prev].slice(0, 500));
    };

    const clearAuditLog = () => setAuditLog([]);

    const addBooking = (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = bookings.length ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;

        const statusChange: BookingStatusEvent = {
            at: createdAt,
            from: null,
            to: booking.status,
            by: user ? { id: user.id, name: (user as any).name, role: (user as any).role } : undefined,
        };

        const full: Booking = {
            ...booking,
            id,
            created_at: createdAt,
            updated_at: createdAt,
            status_history: [statusChange],
        } as Booking;

        setBookings((prev) => [full, ...prev]);

        addAudit({
            actor: user ? { id: user.id, name: (user as any).name, role: (user as any).role } : undefined,
            action: 'booking.status.change',
            entity: { type: 'booking', id, ref: full.booking_number },
            meta: { booking_number: full.booking_number },
        });
    };

    const updateBooking = (updated: Booking) => {
        setBookings((prev) => {
            const existing = prev.find((b) => b.id === updated.id);
            if (!existing) return prev;

            const didStatusChange = existing.status !== updated.status;
            const updatedAt = nowIso();

            const next: Booking = { ...existing, ...updated, updated_at: updatedAt };

            if (didStatusChange) {
                const actor = user ? { id: user.id, role: (user as any).role } : undefined;

                const { status_history } = appendStatusHistory(existing, updated, actor as any);
                next.status_history = status_history;

                // Add audit entry
                const auditEntry = makeAuditForStatusChange(existing, updated, actor as any);
                setAuditLog((prev) => [auditEntry, ...prev].slice(0, 500));

                // set canonical timestamps for lifecycle events
                if (updated.status === 'confirmed') next.confirmed_at = updatedAt;
                if (updated.status === 'in_transit' || updated.status === 'dispatched') next.started_at = updatedAt;
                if (updated.status === 'delivered') next.delivered_at = updatedAt;
                if (updated.status === 'cancelled') next.cancelled_at = updatedAt;
            }

            return prev.map((b) => (b.id === updated.id ? next : b));
        });
    };

    const addLead = (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = leads.length ? Math.max(...leads.map((l) => l.id)) + 1 : 1;
        const full: Lead = { ...lead, id, created_at: createdAt, updated_at: createdAt } as Lead;
        setLeads((prev) => [full, ...prev]);
    };

    const updateLead = (lead: Lead) => {
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...lead, updated_at: nowIso() } : l)));
    };

    const deleteLead = (id: number) => setLeads((prev) => prev.filter((l) => l.id !== id));

    const updateOpportunity = (opportunity: Opportunity) => {
        setOpportunities((prev) => prev.map((o) => (o.id === opportunity.id ? { ...o, ...opportunity } : o)));
    };

    const addInvoice = (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = invoices.length ? Math.max(...invoices.map((i) => i.id)) + 1 : 1;
        const full: Invoice = { ...invoice, id, created_at: createdAt, updated_at: createdAt } as Invoice;
        setInvoices((prev) => [full, ...prev]);
    };

    const addExpense = (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = expenses.length ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;
        const full: Expense = { ...expense, id, created_at: createdAt, updated_at: createdAt } as Expense;
        setExpenses((prev) => [full, ...prev]);
    };

    const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = vehicles.length ? Math.max(...vehicles.map((v) => v.id)) + 1 : 1;
        const full: Vehicle = { ...vehicle, id, created_at: createdAt, updated_at: createdAt } as Vehicle;
        setVehicles((prev) => [full, ...prev]);
    };

    const updateVehicle = (vehicle: Vehicle) => {
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? { ...v, ...vehicle, updated_at: nowIso() } : v)));
    };

    const deleteVehicle = (id: number) => setVehicles((prev) => prev.filter((v) => v.id !== id));

    const addUser = (u: Omit<User, 'id'>) => {
        const id = safeId();
        setUsers((prev) => [{ ...u, id }, ...prev]);
    };

    const deleteUser = (id: string | number) => setUsers((prev) => prev.filter((u) => u.id !== id));

    const value: DataContextValue = {
        vehicles,
        bookings,
        leads,
        opportunities,
        invoices,
        expenses,
        drivers,
        users,
        customers,
        auditLog,

        addBooking,
        updateBooking,

        addLead,
        updateLead,
        deleteLead,

        updateOpportunity,

        addInvoice,
        addExpense,

        addVehicle,
        updateVehicle,
        deleteVehicle,

        addUser,
        deleteUser,
        clearAuditLog,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used inside DataProvider');
    return ctx;
};
