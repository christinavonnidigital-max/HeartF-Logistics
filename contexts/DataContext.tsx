

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
    AuditLogEntry,
    AuditEvent,
    AuditAction,
    Booking,
    BookingStatusChange,
    BookingStatusEvent,
    DeliveryProof,
    Driver,
    Expense,
    Invoice,
    InvoiceStatus,
    Lead,
    LeadActivity,
    Opportunity,
    OpportunityActivity,
    User,
    Customer,
    Currency,
    Vehicle,
    VehicleMaintenance,
    MaintenanceStatus,
    MaintenanceType,
    FileRecord,
} from '../types';
import { useAuth } from '../auth/AuthContext';
import { mockMaintenance } from '../data/mockData';
import { mockLeadActivities } from '../data/mockCrmData';
import { mockDrivers } from '../data/mockDriversData';
import { mockCustomers } from '../data/mockCrmData';
import { DEFAULT_PERMISSIONS, PERMISSIONS_STORAGE_KEY, PermissionsMatrix } from '../src/lib/permissions';

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
    maintenance: VehicleMaintenance[];
    leadActivities: LeadActivity[];
    opportunityActivities: OpportunityActivity[];
    deliveryProofs: DeliveryProof[];

    addBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => void;
    updateBooking: (booking: Booking) => void;

    addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
    updateLead: (lead: Lead) => void;
    deleteLead: (id: number) => void;

    updateOpportunity: (opportunity: Opportunity) => void;

    addInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => void;
    updateInvoice: (invoice: Invoice) => void;
    addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => void;

    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (id: number) => void;
    addMaintenance: (maintenance: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at'>) => void;
    addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (id: number) => void;

    addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'created_at'>) => void;
    addOpportunityActivity: (activity: Omit<OpportunityActivity, 'id' | 'created_at'>) => void;

    addDeliveryProof: (proof: Omit<DeliveryProof, 'id' | 'created_at'>) => void;

    addUser: (user: Omit<User, 'id'>) => void;
    deleteUser: (id: string | number) => void;
    logAuditEvent: (entry: Omit<AuditEvent, 'id' | 'at'>) => void;
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
    const instanceId = useMemo(() => safeId(), []);
    const channelRef = useRef<BroadcastChannel | null>(null);

    const [vehicles, setVehicles] = useState<Vehicle[]>(persisted?.vehicles ?? []);
    const [bookings, setBookings] = useState<Booking[]>(persisted?.bookings ?? []);
    const [leads, setLeads] = useState<Lead[]>(persisted?.leads ?? []);
    const [opportunities, setOpportunities] = useState<Opportunity[]>(persisted?.opportunities ?? []);
    const [invoices, setInvoices] = useState<Invoice[]>(persisted?.invoices ?? []);
    const [expenses, setExpenses] = useState<Expense[]>(persisted?.expenses ?? []);
    const [drivers, setDrivers] = useState<Driver[]>(persisted?.drivers ?? mockDrivers ?? []);
    const [users, setUsers] = useState<User[]>(persisted?.users ?? []);
    const [customers, setCustomers] = useState<Customer[]>(persisted?.customers ?? mockCustomers ?? []);
    const [auditLog, setAuditLog] = useState<AuditEvent[]>(persisted?.auditLog ?? []);
    const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>(persisted?.maintenance ?? mockMaintenance ?? []);
    const [leadActivities, setLeadActivities] = useState<LeadActivity[]>(persisted?.leadActivities ?? mockLeadActivities ?? []);
    const [opportunityActivities, setOpportunityActivities] = useState<OpportunityActivity[]>(persisted?.opportunityActivities ?? []);
    const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>(persisted?.deliveryProofs ?? []);

    const emitChange = (type: string, payload: any) => {
        if (!channelRef.current) return;
        channelRef.current.postMessage({ source: instanceId, type, payload });
    };

    useEffect(() => {
        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel('hf-data-sync');
        } catch {
            channel = null;
        }
        if (!channel) return;
        channelRef.current = channel;
        channel.onmessage = (event: MessageEvent) => {
            const { source, type, payload } = (event.data || {}) as { source?: string; type?: string; payload?: any };
            if (!type || source === instanceId) return;
            switch (type) {
                case 'vehicles:add':
                    setVehicles((prev) => (prev.some((v) => v.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'vehicles:update':
                    setVehicles((prev) => prev.map((v) => (v.id === payload.id ? { ...v, ...payload } : v)));
                    break;
                case 'vehicles:delete':
                    setVehicles((prev) => prev.filter((v) => v.id !== payload.id));
                    break;
                case 'bookings:add':
                    setBookings((prev) => (prev.some((b) => b.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'bookings:update':
                    setBookings((prev) => prev.map((b) => (b.id === payload.id ? { ...b, ...payload } : b)));
                    break;
                case 'leads:add':
                    setLeads((prev) => (prev.some((l) => l.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'leads:update':
                    setLeads((prev) => prev.map((l) => (l.id === payload.id ? { ...l, ...payload } : l)));
                    break;
                case 'leads:delete':
                    setLeads((prev) => prev.filter((l) => l.id !== payload.id));
                    break;
                case 'opportunities:update':
                    setOpportunities((prev) => prev.map((o) => (o.id === payload.id ? { ...o, ...payload } : o)));
                    break;
                case 'invoices:add':
                    setInvoices((prev) => (prev.some((i) => i.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'invoices:update':
                    setInvoices((prev) => prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i)));
                    break;
                case 'expenses:add':
                    setExpenses((prev) => [payload, ...prev]);
                    break;
                case 'customers:add':
                    setCustomers((prev) => (prev.some((c) => c.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'customers:update':
                    setCustomers((prev) => prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c)));
                    break;
                case 'customers:delete':
                    setCustomers((prev) => prev.filter((c) => c.id !== payload.id));
                    break;
                case 'maintenance:add':
                    setMaintenance((prev) => (prev.some((m) => m.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'leadActivities:add':
                    setLeadActivities((prev) => (prev.some((a) => a.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'opportunityActivities:add':
                    setOpportunityActivities((prev) => (prev.some((a) => a.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'deliveryProofs:add':
                    setDeliveryProofs((prev) => (prev.some((p) => p.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'users:add':
                    setUsers((prev) => (prev.some((u) => u.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'users:delete':
                    setUsers((prev) => prev.filter((u) => u.id !== payload.id));
                    break;
                case 'audit:append':
                    setAuditLog((prev) => [payload, ...prev].slice(0, 500));
                    break;
                default:
                    break;
            }
        };
        return () => {
            channel.close();
        };
    }, [instanceId]);

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
            maintenance,
            leadActivities,
            opportunityActivities,
            deliveryProofs,
            savedAt: nowIso(),
        };

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore
        }
    }, [
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
        maintenance,
        leadActivities,
        opportunityActivities,
        deliveryProofs,
    ]);

    const addAudit = (entry: Omit<AuditEvent, 'id' | 'at'>) => {
        const full: AuditEvent = { id: safeId(), at: nowIso(), ...entry };
        setAuditLog((prev) => [full, ...prev].slice(0, 500));
        emitChange('audit:append', full);
    };

    const logAuditEvent = (entry: Omit<AuditEvent, 'id' | 'at'>) => {
        const actor = entry.actor || (user ? {
            id: user.userId,
            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
            role: user.role,
        } : undefined);
        addAudit({ ...entry, actor });
    };

    const clearAuditLog = () => setAuditLog([]);

    const addBooking = (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = bookings.length ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;

        const statusChange: BookingStatusEvent = {
            at: createdAt,
            from: null,
            to: booking.status,
            by: user ? {
                id: user.userId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
                role: user.role,
            } : undefined,
        };

        const full: Booking = {
            ...booking,
            id,
            created_at: createdAt,
            updated_at: createdAt,
            status_history: [statusChange],
        } as Booking;

        setBookings((prev) => [full, ...prev]);
        emitChange('bookings:add', full);

        addAudit({
            actor: user ? {
                id: user.userId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
                role: user.role,
            } : undefined,
            action: 'booking.status.change',
            entity: { type: 'booking', id, ref: full.booking_number },
            meta: { booking_number: full.booking_number },
        });
    };

    const updateBooking = (updated: Booking) => {
        let nextState: Booking | null = null;
        setBookings((prev) => {
            const existing = prev.find((b) => b.id === updated.id);
            if (!existing) return prev;

            const didStatusChange = existing.status !== updated.status;
            const updatedAt = nowIso();

            const next: Booking = { ...existing, ...updated, updated_at: updatedAt };

            if (didStatusChange) {
                const actor = user ? { id: user.userId, role: user.role } : undefined;

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

            nextState = next;
            return prev.map((b) => (b.id === updated.id ? next : b));
        });
        if (nextState) {
            emitChange('bookings:update', nextState);
        }
    };

    const addLead = (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const id = leads.length ? Math.max(...leads.map((l) => l.id)) + 1 : 1;
        const full: Lead = { ...lead, id, created_at: createdAt, updated_at: createdAt } as Lead;
        setLeads((prev) => [full, ...prev]);
        emitChange('leads:add', full);
    };

    const updateLead = (lead: Lead) => {
        const updatedAt = nowIso();
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...lead, updated_at: updatedAt } : l)));
        emitChange('leads:update', { ...lead, updated_at: updatedAt });
    };

    const deleteLead = (id: number) => {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        emitChange('leads:delete', { id });
    };

    const updateOpportunity = (opportunity: Opportunity) => {
        setOpportunities((prev) =>
            prev.map((o) => (o.id === opportunity.id ? { ...o, ...opportunity, updated_at: nowIso() } : o))
        );
        emitChange('opportunities:update', opportunity);
    };

    const addInvoice = (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const full: Invoice = { ...invoice, created_at: createdAt, updated_at: createdAt } as Invoice;
        setInvoices((prev) => {
            const id = prev.length ? Math.max(...prev.map((i) => i.id)) + 1 : 1;
            const next = { ...full, id };
            emitChange('invoices:add', next);
            return [next, ...prev];
        });
    };

    const updateInvoice = (updated: Invoice) => {
        let nextState: Invoice | null = null;
        setInvoices((prev) => {
            const existing = prev.find((i) => i.id === updated.id);
            if (!existing) return prev;
            const updatedAt = nowIso();
            const next: Invoice = { ...existing, ...updated, updated_at: updatedAt };

            if (updated.status === InvoiceStatus.PAID) {
                if (!next.paid_at) next.paid_at = updatedAt;
                if (!Number.isFinite(next.amount_paid) || next.amount_paid <= 0) next.amount_paid = next.total_amount;
                if (!Number.isFinite(next.balance_due) || next.balance_due !== 0) next.balance_due = 0;
            }

            nextState = next;
            return prev.map((i) => (i.id === updated.id ? next : i));
        });
        if (nextState) {
            emitChange('invoices:update', nextState);
        }
    };

    const addExpense = (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const full: Expense = { ...expense, created_at: createdAt, updated_at: createdAt } as Expense;
        setExpenses((prev) => {
            const id = prev.length ? Math.max(...prev.map((e) => e.id)) + 1 : 1;
            const next = { ...full, id };
            emitChange('expenses:add', next);
            return [next, ...prev];
        });
    };

    const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const full: Vehicle = { ...vehicle, created_at: createdAt, updated_at: createdAt } as Vehicle;
        setVehicles((prev) => {
            const id = prev.length ? Math.max(...prev.map((v) => v.id)) + 1 : 1;
            const next = { ...full, id };
            emitChange('vehicles:add', next);
            return [next, ...prev];
        });
    };

    const updateVehicle = (vehicle: Vehicle) => {
        let nextState: Vehicle | null = null;
        setVehicles((prev) => {
            const existing = prev.find((v) => v.id === vehicle.id);
            if (!existing) return prev;

            const updatedAt = nowIso();
            const next: Vehicle = { ...existing, ...vehicle, updated_at: updatedAt };
            const hadBelowThreshold = (existing.current_km ?? 0) < (existing.next_service_due_km ?? 0);
            const nowAtOrAbove = (next.current_km ?? 0) >= (next.next_service_due_km ?? 0);
            const shouldSchedule = hadBelowThreshold && nowAtOrAbove;

            if (shouldSchedule) {
                setMaintenance((prevMaintenance) => {
                    const hasOpen = prevMaintenance.some(
                        (m) =>
                            m.vehicle_id === next.id &&
                            (m.status === MaintenanceStatus.SCHEDULED || m.status === MaintenanceStatus.IN_PROGRESS)
                    );
                    if (hasOpen) return prevMaintenance;

                    const id = prevMaintenance.length ? Math.max(...prevMaintenance.map((m) => m.id)) + 1 : 1;
                    const createdAt = nowIso();
                    const serviceDate = createdAt.split('T')[0];
                    const scheduled: VehicleMaintenance = {
                        id,
                        vehicle_id: next.id,
                        maintenance_type: MaintenanceType.ROUTINE,
                        description: 'Scheduled service (auto)',
                        cost: 0,
                        km_at_service: next.current_km,
                        service_date: serviceDate,
                        status: MaintenanceStatus.SCHEDULED,
                        created_by: user?.userId ? Number(user.userId) : 0,
                        created_at: createdAt,
                        updated_at: createdAt,
                    };
                    return [scheduled, ...prevMaintenance];
                });
            }

            nextState = next;
            return prev.map((v) => (v.id === vehicle.id ? next : v));
        });
        if (nextState) {
            emitChange('vehicles:update', nextState);
        }
    };

    const deleteVehicle = (id: number) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        emitChange('vehicles:delete', { id });
    };

    const addMaintenance = (item: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        setMaintenance((prev) => {
            const id = prev.length ? Math.max(...prev.map((m) => m.id)) + 1 : 1;
            const full: VehicleMaintenance = { ...item, id, created_at: createdAt, updated_at: createdAt };
            emitChange('maintenance:add', full);
            return [full, ...prev];
        });
    };

    const addCustomer = (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
        const createdAt = nowIso();
        const id = customers.length ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
        const full: Customer = {
            ...customerData,
            id,
            user_id: 0,
            loyalty_points: customerData.loyalty_points ?? 0,
            total_spent: customerData.total_spent ?? 0,
            total_bookings: customerData.total_bookings ?? 0,
            is_verified: customerData.is_verified ?? true,
            preferred_currency: (customerData as any).preferred_currency || Currency.USD,
            created_at: createdAt,
            updated_at: createdAt,
        } as Customer;
        setCustomers((prev) => [full, ...prev]);
        emitChange('customers:add', full);
    };

    const updateCustomer = (customer: Customer) => {
        const updatedAt = nowIso();
        const next = { ...customer, updated_at: updatedAt };
        setCustomers((prev) => prev.map((c) => (c.id === customer.id ? next : c)));
        emitChange('customers:update', next);
    };

    const deleteCustomer = (id: number) => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        emitChange('customers:delete', { id });
    };

    const addLeadActivity = (activity: Omit<LeadActivity, 'id' | 'created_at'>) => {
        const createdAt = nowIso();
        setLeadActivities((prev) => {
            const id = prev.length ? Math.max(...prev.map((a) => a.id)) + 1 : 1;
            const full: LeadActivity = { ...activity, id, created_at: createdAt };
            emitChange('leadActivities:add', full);
            return [full, ...prev];
        });
    };

    const addOpportunityActivity = (activity: Omit<OpportunityActivity, 'id' | 'created_at'>) => {
        const createdAt = nowIso();
        setOpportunityActivities((prev) => {
            const id = prev.length ? Math.max(...prev.map((a) => a.id)) + 1 : 1;
            const full: OpportunityActivity = { ...activity, id, created_at: createdAt };
            emitChange('opportunityActivities:add', full);
            return [full, ...prev];
        });
    };

    const addDeliveryProof = (proof: Omit<DeliveryProof, 'id' | 'created_at'>) => {
        const createdAt = nowIso();
        setDeliveryProofs((prev) => {
            const id = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
            const full: DeliveryProof = { ...proof, id, created_at: createdAt };
            emitChange('deliveryProofs:add', full);
            return [full, ...prev];
        });
    };

    const addUser = (u: Omit<User, 'id'>) => {
        const id = safeId();
        const full = { ...u, id };
        setUsers((prev) => [full, ...prev]);
        emitChange('users:add', full);
    };

    const deleteUser = (id: string | number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        emitChange('users:delete', { id });
    };

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
        updateInvoice,
        addExpense,

        addVehicle,
        updateVehicle,
        deleteVehicle,
        addMaintenance,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        addLeadActivity,
        addOpportunityActivity,

        addDeliveryProof,

        addUser,
        deleteUser,
        logAuditEvent,
        clearAuditLog,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used inside DataProvider');
    return ctx;
};
