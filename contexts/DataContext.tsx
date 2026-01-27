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

// Part 1: Persistence keys scoped per user/org to prevent data leakage between logins
const BASE_STORAGE_KEY = 'hf_global_data_v1';

function getStorageKey(user: { orgId?: string | number; userId?: string | number } | null | undefined) {
    if (!user) return null;
    const orgPart = user.orgId ?? 'no-org';
    const userPart = user.userId ?? 'no-user';
    return `${BASE_STORAGE_KEY}:${orgPart}:${userPart}`;
}

function getChannelName(user: { orgId?: string | number } | null | undefined) {
    if (!user) return null;
    const orgPart = user.orgId ?? 'no-org';
    return `hf-data-sync:${orgPart}`;
}

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

// Part 2: Safe localStorage load for a specific key
function loadState(storageKey: string) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const storageKey = useMemo(() => getStorageKey(user ? { orgId: user.orgId, userId: user.userId } : null), [user?.orgId, user?.userId]);
    const channelName = useMemo(() => getChannelName(user ? { orgId: user.orgId } : null), [user?.orgId]);

    const instanceId = useMemo(() => safeId(), []);
    const channelRef = useRef<BroadcastChannel | null>(null);

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>(mockDrivers ?? []);
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers ?? []);
    const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
    const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>(mockMaintenance ?? []);
    const [leadActivities, setLeadActivities] = useState<LeadActivity[]>(mockLeadActivities ?? []);
    const [opportunityActivities, setOpportunityActivities] = useState<OpportunityActivity[]>([]);
    const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
    const [loadingRemote, setLoadingRemote] = useState(false);
    const [remoteError, setRemoteError] = useState<string | null>(null);

    const mapDbVehicle = (v: any, idx: number): Vehicle => ({
        id: v.id ?? idx,
        registration_number: v.reg_number || v.reg_number_clean || `UNKNOWN-${idx}`,
        make: v.make || v.truck_make_short || 'Unknown',
        model: '',
        year: new Date().getFullYear(),
        vehicle_type: 'dry' as any,
        capacity_tonnes: Number(v.capacity_tonnes ?? 0),
        status: 'active' as any,
        purchase_date: v.purchase_date || new Date().toISOString().split('T')[0],
        purchase_cost: Number(v.purchase_cost_usd ?? 0),
        current_value: v.resale_value_2024_usd ? Number(v.resale_value_2024_usd) : undefined,
        insurance_provider: v.service_provider,
        insurance_policy_number: undefined,
        insurance_expiry_date: undefined,
        fitness_certificate_expiry: undefined,
        license_disc_expiry: undefined,
        last_service_date: new Date().toISOString().split('T')[0],
        last_service_km: undefined,
        next_service_due_km: Number(v.next_service_due_km ?? 0),
        next_service_due_date: undefined,
        current_km: Number(v.current_km ?? 0),
        fuel_type: 'diesel',
        gps_device_id: undefined,
        gps_device_active: false,
        notes: v.maintenance_requirements || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    const mapFuelToExpense = (row: any, idx: number): Expense => ({
        id: row.id ?? idx,
        description: row.comments || 'Fuel purchase',
        amount: Number(row.amount_usd ?? 0),
        currency: 'USD',
        vendor: row.supplier || undefined,
        category: 'fuel',
        receipt_url: row.receipt_url || undefined,
        expense_date: row.created_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.created_at || new Date().toISOString(),
    });

    const mapLead = (row: any, idx: number): Lead => ({
        id: row.id ?? idx,
        lead_source: 'web',
        lead_status: 'new',
        lead_score: 0,
        first_name: row.customer_contact || row.customer || 'Lead',
        last_name: '',
        email: row.email || '',
        phone: '',
        company_name: row.customer || 'Unknown',
        company_size: 'small',
        industry: 'other',
        position: row.position || '',
        website: '',
        address: '',
        city: '',
        country: '',
        logistics_needs: row.follow_up_action || '',
        current_provider: '',
        monthly_shipment_volume: undefined,
        preferred_routes: '',
        assigned_to: undefined,
        next_follow_up_date: row.follow_up_date || undefined,
        next_action: row.follow_up_action || undefined,
        next_action_date: row.follow_up_date || undefined,
        last_contact_date: row.action_date || undefined,
        converted_to_customer_id: undefined,
        converted_at: undefined,
        lost_reason: undefined,
        lost_at: undefined,
        notes: row.action_completed || '',
        tags: [],
        custom_fields: {},
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.created_at || new Date().toISOString(),
    });

    const mapCustomer = (row: any, idx: number): Customer => ({
        id: row.id ?? idx,
        user_id: idx,
        company_name: row.customer || 'Customer',
        company_registration: '',
        industry: '',
        address_line1: '',
        address_line2: '',
        city: '',
        country: '',
        postal_code: '',
        billing_email: row.customer_contact || '',
        billing_phone: '',
        tax_id: '',
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        total_spent: 0,
        total_bookings: 0,
        preferred_currency: 'USD',
        credit_limit: undefined,
        payment_terms: undefined,
        is_verified: false,
        notes: row.follow_up_action || '',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.created_at || new Date().toISOString(),
    });

    // Part 3: Load/reset persisted state whenever the authenticated user changes
    useEffect(() => {
        if (!storageKey) {
            // No authenticated user: reset to safe defaults and do not persist
            setVehicles([]);
            setBookings([]);
            setLeads([]);
            setOpportunities([]);
            setInvoices([]);
            setExpenses([]);
            setDrivers(mockDrivers ?? []);
            setUsers([]);
            setCustomers(mockCustomers ?? []);
            setAuditLog([]);
            setMaintenance(mockMaintenance ?? []);
            setLeadActivities(mockLeadActivities ?? []);
            setOpportunityActivities([]);
            setDeliveryProofs([]);
            return;
        }

        const persisted = loadState(storageKey);
        setVehicles(persisted?.vehicles ?? []);
        setBookings(persisted?.bookings ?? []);
        setLeads(persisted?.leads ?? []);
        setOpportunities(persisted?.opportunities ?? []);
        setInvoices(persisted?.invoices ?? []);
        setExpenses(persisted?.expenses ?? []);
        setDrivers(persisted?.drivers ?? (mockDrivers ?? []));
        setUsers(persisted?.users ?? []);
        setCustomers(persisted?.customers ?? (mockCustomers ?? []));
        setAuditLog(persisted?.auditLog ?? []);
        setMaintenance(persisted?.maintenance ?? (mockMaintenance ?? []));
        setLeadActivities(persisted?.leadActivities ?? (mockLeadActivities ?? []));
        setOpportunityActivities(persisted?.opportunityActivities ?? []);
        setDeliveryProofs(persisted?.deliveryProofs ?? []);
    }, [storageKey]);

    // Part 4: Load remote data from Neon via Netlify functions
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            setLoadingRemote(true);
            setRemoteError(null);
            try {
                const [fleetRes, crmRes] = await Promise.all([
                    fetch("/.netlify/functions/fleet-data", { credentials: "include" }),
                    fetch("/.netlify/functions/crm-data", { credentials: "include" }),
                ]);
                if (!fleetRes.ok) throw new Error(`Fleet data error: ${fleetRes.status}`);
                if (!crmRes.ok) throw new Error(`CRM data error: ${crmRes.status}`);
                const fleet = await fleetRes.json();
                const crm = await crmRes.json();

                if (cancelled) return;

                const mappedVehicles = (fleet?.vehicles ?? []).map(mapDbVehicle);
                const mappedExpenses = (fleet?.fuel ?? []).map(mapFuelToExpense);
                setVehicles(mappedVehicles);
                setExpenses(mappedExpenses);
                setLeads((crm?.leads ?? []).map(mapLead));
                setCustomers((crm?.customers ?? []).map(mapCustomer));
            } catch (err: any) {
                if (cancelled) return;
                setRemoteError(err?.message || "Failed to load remote data");
            } finally {
                if (!cancelled) setLoadingRemote(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.userId, user?.orgId]);

    const emitChange = (type: string, payload: any) => {
        if (!channelRef.current) return;
        channelRef.current.postMessage({ source: instanceId, type, payload });
    };

    useEffect(() => {
        if (!channelName) return;

        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel(channelName || 'hf-data-sync');
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
    }, [instanceId, channelName]);

    useEffect(() => {
        if (!storageKey) return;

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
            if (!storageKey) return;
            window.localStorage.setItem(storageKey, JSON.stringify(payload));
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
        storageKey,
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

                const auditEntry = makeAuditForStatusChange(existing, updated, actor as any);
                setAuditLog((prev) => [auditEntry, ...prev].slice(0, 500));

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
        maintenance,
        leadActivities,
        opportunityActivities,
        deliveryProofs,

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
