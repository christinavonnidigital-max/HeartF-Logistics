import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
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
    Notification,
    GpsLocation,
} from '../types';
import { useAuth } from '../auth/AuthContext';
import { mockMaintenance } from '../data/mockData';
import { mockLeadActivities } from '../data/mockCrmData';
import { mockDrivers, mockUsersForDrivers } from '../data/mockDriversData';
import { mockCustomers } from '../data/mockCrmData';
import { DEFAULT_PERMISSIONS, PERMISSIONS_STORAGE_KEY, PermissionsMatrix } from '../src/lib/permissions';
import {
    vehiclesApi,
    customersApi,
    bookingsApi,
    driversApi,
    leadsApi,
    invoicesApi,
    expensesApi,
    opportunitiesApi,
    usersApi,
    notificationsApi,
} from '../src/services/dbApi';
import { openEventStream, publishEvent } from '../src/services/eventsApi';

// Persistence is now in the database; no localStorage scoping needed
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
    notifications: Notification[];
    gpsLocations: Record<number, GpsLocation>;
    auditLog: AuditEvent[];
    maintenance: VehicleMaintenance[];
    leadActivities: LeadActivity[];
    opportunityActivities: OpportunityActivity[];
    deliveryProofs: DeliveryProof[];

    addBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateBooking: (booking: Booking) => Promise<void>;

    addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateLead: (lead: Lead) => Promise<void>;
    deleteLead: (id: number) => Promise<void>;

    updateOpportunity: (opportunity: Opportunity) => Promise<void>;

    addInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateInvoice: (invoice: Invoice) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;

    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateVehicle: (vehicle: Vehicle) => Promise<void>;
    deleteVehicle: (id: number) => Promise<void>;
    addDriver: (driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) => Promise<Driver>;
    updateDriver: (driver: Driver) => Promise<void>;
    deleteDriver: (id: number) => Promise<void>;
    addMaintenance: (maintenance: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at'>) => void;
    addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (id: number) => void;

    addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'created_at'>) => void;
    addOpportunityActivity: (activity: Omit<OpportunityActivity, 'id' | 'created_at'>) => void;

    addDeliveryProof: (proof: Omit<DeliveryProof, 'id' | 'created_at'>) => void;

    addUser: (user: Omit<User, 'id'>) => Promise<User>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string | number) => Promise<void>;
    addNotification?: (n: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
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

const getStorageKey = (user: { orgId?: string | number; userId?: string | number } | null) => {
    if (!user) return null;
    const org = user.orgId ?? 'no-org';
    const uid = user.userId ?? 'anon';
    return `hf:data:v2:${org}:${uid}`;
};

// --- DB mappers (camelCase from API -> snake_case app types) ---
const fromDbVehicle = (v: any): Vehicle => ({
    id: v.id,
    registration_number: v.registrationNumber || v.registration_number || '',
    make: v.make || '',
    model: v.model || '',
    year: Number(v.year || new Date().getFullYear()),
    vehicle_type: (v.vehicleType || v.vehicle_type || 'dry') as any,
    capacity_tonnes: Number(v.capacityTonnes ?? v.capacity_tonnes ?? 0),
    status: (v.status || 'active') as any,
    purchase_date: v.purchaseDate || v.purchase_date || nowIso(),
    purchase_cost: Number(v.purchaseCost ?? v.purchase_cost ?? 0),
    current_value: v.currentValue ?? v.current_value,
    insurance_provider: v.insuranceProvider ?? v.insurance_provider,
    insurance_policy_number: v.insurancePolicyNumber ?? v.insurance_policy_number,
    insurance_expiry_date: v.insuranceExpiryDate ?? v.insurance_expiry_date,
    fitness_certificate_expiry: v.fitnessCertificateExpiry ?? v.fitness_certificate_expiry,
    license_disc_expiry: v.licenseDiscExpiry ?? v.license_disc_expiry,
    last_service_date: v.lastServiceDate ?? v.last_service_date ?? nowIso(),
    last_service_km: v.lastServiceKm ?? v.last_service_km,
    next_service_due_km: Number(v.nextServiceDueKm ?? v.next_service_due_km ?? 0),
    next_service_due_date: v.nextServiceDueDate ?? v.next_service_due_date,
    current_km: Number(v.currentKm ?? v.current_km ?? 0),
    fuel_type: (v.fuelType ?? v.fuel_type ?? 'diesel') as any,
    gps_device_id: v.gpsDeviceId ?? v.gps_device_id,
    gps_device_active: Boolean(v.gpsDeviceActive ?? v.gps_device_active ?? false),
    notes: v.notes ?? '',
    created_at: v.createdAt ?? v.created_at ?? nowIso(),
    updated_at: v.updatedAt ?? v.updated_at ?? nowIso(),
});

const toDbVehicle = (v: Partial<Vehicle>) => ({
    registrationNumber: v.registration_number,
    make: v.make,
    model: v.model,
    year: v.year,
    vehicleType: v.vehicle_type,
    capacityTonnes: v.capacity_tonnes,
    status: v.status,
    purchaseDate: v.purchase_date,
    purchaseCost: v.purchase_cost,
    currentValue: v.current_value,
    insuranceProvider: v.insurance_provider,
    insurancePolicyNumber: v.insurance_policy_number,
    insuranceExpiryDate: v.insurance_expiry_date,
    fitnessCertificateExpiry: v.fitness_certificate_expiry,
    licenseDiscExpiry: v.license_disc_expiry,
    lastServiceDate: v.last_service_date,
    lastServiceKm: v.last_service_km,
    nextServiceDueKm: v.next_service_due_km,
    nextServiceDueDate: v.next_service_due_date,
    currentKm: v.current_km,
    fuelType: v.fuel_type,
    gpsDeviceId: v.gps_device_id,
    gpsDeviceActive: v.gps_device_active,
    notes: v.notes,
});

const fromDbCustomer = (c: any): Customer => ({
    id: c.id,
    user_id: c.userId ?? c.user_id ?? 0,
    company_name: c.companyName ?? c.company_name ?? '',
    company_registration: c.companyRegistration ?? c.company_registration ?? '',
    industry: c.industry ?? '',
    address_line1: c.addressLine1 ?? c.address_line1 ?? '',
    address_line2: c.addressLine2 ?? c.address_line2 ?? '',
    city: c.city ?? '',
    country: c.country ?? '',
    postal_code: c.postalCode ?? c.postal_code ?? '',
    billing_email: c.billingEmail ?? c.billing_email ?? '',
    billing_phone: c.billingPhone ?? c.billing_phone ?? '',
    tax_id: c.taxId ?? c.tax_id ?? '',
    loyalty_points: Number(c.loyaltyPoints ?? c.loyalty_points ?? 0),
        loyalty_tier: (c.loyaltyTier ?? c.loyalty_tier ?? 'bronze') as any,
    total_spent: Number(c.totalSpent ?? c.total_spent ?? 0),
    total_bookings: Number(c.totalBookings ?? c.total_bookings ?? 0),
    preferred_currency: (c.preferredCurrency ?? c.preferred_currency ?? 'USD') as any,
    credit_limit: c.creditLimit ?? c.credit_limit,
    payment_terms: c.paymentTerms ?? c.payment_terms,
    is_verified: Boolean(c.isVerified ?? c.is_verified ?? true),
    notes: c.notes ?? '',
    created_at: c.createdAt ?? c.created_at ?? nowIso(),
    updated_at: c.updatedAt ?? c.updated_at ?? nowIso(),
});

const fromDbUser = (u: any): User => ({
    id: u.id,
    email: u.email,
    role: u.role || 'pending',
    first_name: u.firstName || u.first_name || '',
    last_name: u.lastName || u.last_name || '',
    phone: u.phone || '',
    avatar_url: u.avatarUrl || u.avatar_url || '',
    is_active: u.isActive ?? u.is_active ?? true,
    email_verified: u.emailVerified ?? u.email_verified ?? false,
    created_at: u.createdAt ?? u.created_at ?? nowIso(),
    updated_at: u.updatedAt ?? u.updated_at ?? nowIso(),
    last_login_at: u.lastLoginAt ?? u.last_login_at,
});

const toDbUser = (u: Partial<User>) => ({
    email: u.email,
    role: u.role,
    firstName: (u as any).first_name ?? (u as any).firstName,
    lastName: (u as any).last_name ?? (u as any).lastName,
    phone: (u as any).phone,
    avatarUrl: (u as any).avatar_url ?? (u as any).avatarUrl,
    isActive: (u as any).is_active ?? (u as any).isActive,
    emailVerified: (u as any).email_verified ?? (u as any).emailVerified,
});

const toDbCustomer = (c: Partial<Customer>) => ({
    userId: c.user_id,
    companyName: c.company_name,
    companyRegistration: c.company_registration,
    industry: c.industry,
    addressLine1: c.address_line1,
    addressLine2: c.address_line2,
    city: c.city,
    country: c.country,
    postalCode: c.postal_code,
    billingEmail: c.billing_email,
    billingPhone: c.billing_phone,
    taxId: c.tax_id,
    loyaltyPoints: c.loyalty_points,
    loyaltyTier: c.loyalty_tier,
    totalSpent: c.total_spent,
    totalBookings: c.total_bookings,
    preferredCurrency: c.preferred_currency,
    creditLimit: c.credit_limit,
    paymentTerms: c.payment_terms,
    isVerified: c.is_verified,
    notes: c.notes,
});

const fromDbBooking = (b: any): Booking => ({
    id: b.id,
    booking_number: b.bookingNumber ?? b.booking_number ?? `B-${b.id}`,
    customer_id: b.customerId ?? b.customer_id ?? 0,
    pickup_location: b.pickupLocation ?? '',
    pickup_address: b.pickupAddress ?? '',
    pickup_city: b.pickupCity ?? '',
    pickup_country: b.pickupCountry ?? '',
    delivery_location: b.deliveryLocation ?? '',
    delivery_address: b.deliveryAddress ?? '',
    delivery_city: b.deliveryCity ?? '',
    delivery_country: b.deliveryCountry ?? '',
    pickup_date: b.pickupDate ?? nowIso(),
    delivery_date: b.deliveryDate ?? nowIso(),
    cargo_type: b.cargoType ?? 'general',
    cargo_description: b.cargoDescription ?? '',
    weight_tonnes: Number(b.weightTonnes ?? 0),
    requires_refrigeration: Boolean(b.requiresRefrigeration ?? false),
    vehicle_id: b.vehicleId ?? null,
    driver_id: b.driverId ?? null,
    status: b.status ?? 'pending',
    base_price: Number(b.basePrice ?? 0),
    surcharges: Number(b.surcharges ?? 0),
    discount: Number(b.discount ?? 0),
    total_price: Number(b.totalPrice ?? 0),
    currency: b.currency ?? 'USD',
    payment_status: b.paymentStatus ?? 'unpaid',
    payment_method: b.paymentMethod ?? null,
    loyalty_points_earned: b.loyaltyPointsEarned ?? 0,
    special_instructions: b.specialInstructions ?? '',
    notes: b.notes ?? '',
    status_history: b.statusHistory ?? [],
    created_at: b.createdAt ?? nowIso(),
    updated_at: b.updatedAt ?? nowIso(),
    confirmed_at: b.confirmedAt ?? null,
    started_at: b.startedAt ?? null,
    delivered_at: b.deliveredAt ?? null,
    cancelled_at: b.cancelledAt ?? null,
});

const toDbBooking = (b: Partial<Booking>) => ({
    bookingNumber: b.booking_number,
    customerId: b.customer_id,
    pickupLocation: b.pickup_location,
    pickupAddress: b.pickup_address,
    pickupCity: b.pickup_city,
    pickupCountry: b.pickup_country,
    deliveryLocation: b.delivery_location,
    deliveryAddress: b.delivery_address,
    deliveryCity: b.delivery_city,
    deliveryCountry: b.delivery_country,
    pickupDate: b.pickup_date,
    deliveryDate: b.delivery_date,
    cargoType: b.cargo_type,
    cargoDescription: b.cargo_description,
    weightTonnes: b.weight_tonnes,
    requiresRefrigeration: b.requires_refrigeration,
    vehicleId: b.vehicle_id,
    driverId: b.driver_id,
    status: b.status,
    basePrice: b.base_price,
    surcharges: b.surcharges,
    discount: b.discount,
    totalPrice: b.total_price,
    currency: b.currency,
    paymentStatus: b.payment_status,
    paymentMethod: b.payment_method,
    loyaltyPointsEarned: b.loyalty_points_earned,
    specialInstructions: b.special_instructions,
    notes: b.notes,
    statusHistory: b.status_history,
    confirmedAt: b.confirmed_at,
    startedAt: b.started_at,
    deliveredAt: b.delivered_at,
    cancelledAt: b.cancelled_at,
});

const fromDbDriver = (d: any): Driver => ({
    id: d.id,
    user_id: d.userId ?? d.user_id ?? 0,
    license_number: d.licenseNumber ?? d.license_number ?? '',
    license_type: d.licenseType ?? d.license_type ?? '',
    license_expiry_date: d.licenseExpiryDate ?? d.license_expiry_date ?? nowIso(),
    date_of_birth: d.dateOfBirth ?? d.date_of_birth ?? nowIso(),
    national_id: d.nationalId ?? d.national_id ?? '',
    emergency_contact_name: d.emergencyContactName ?? d.emergency_contact_name ?? '',
    emergency_contact_phone: d.emergencyContactPhone ?? d.emergency_contact_phone ?? '',
    address: d.address ?? '',
    city: d.city ?? '',
    country: d.country ?? '',
    hire_date: d.hireDate ?? d.hire_date ?? nowIso(),
    employment_status: d.employmentStatus ?? d.employment_status ?? 'active',
    salary: Number(d.salary ?? 0),
    medical_certificate_expiry: d.medicalCertificateExpiry ?? d.medical_certificate_expiry ?? null,
    background_check_date: d.backgroundCheckDate ?? d.background_check_date ?? null,
    background_check_status: d.backgroundCheckStatus ?? d.background_check_status ?? 'pending',
    rating: d.rating ?? null,
    total_deliveries: d.totalDeliveries ?? d.total_deliveries ?? 0,
    notes: d.notes ?? '',
    created_at: d.createdAt ?? d.created_at ?? nowIso(),
    updated_at: d.updatedAt ?? d.updated_at ?? nowIso(),
});

const toDbDriver = (d: Partial<Driver>) => ({
    userId: d.user_id,
    licenseNumber: d.license_number,
    licenseType: d.license_type,
    licenseExpiryDate: d.license_expiry_date,
    dateOfBirth: d.date_of_birth,
    nationalId: d.national_id,
    emergencyContactName: d.emergency_contact_name,
    emergencyContactPhone: d.emergency_contact_phone,
    address: d.address,
    city: d.city,
    country: d.country,
    hireDate: d.hire_date,
    employmentStatus: d.employment_status,
    salary: d.salary,
    medicalCertificateExpiry: d.medical_certificate_expiry,
    backgroundCheckDate: d.background_check_date,
    backgroundCheckStatus: d.background_check_status,
    rating: d.rating,
    totalDeliveries: d.total_deliveries,
    notes: d.notes,
});

const fromDbLead = (l: any): Lead => ({
    id: l.id,
    lead_source: l.leadSource ?? l.lead_source ?? 'website',
    lead_status: l.leadStatus ?? l.lead_status ?? 'new',
    lead_score: Number(l.leadScore ?? l.lead_score ?? 0),
    first_name: l.firstName ?? l.first_name ?? '',
    last_name: l.lastName ?? l.last_name ?? '',
    email: l.email ?? '',
    phone: l.phone ?? '',
    company_name: l.companyName ?? l.company_name ?? '',
    company_size: l.companySize ?? l.company_size ?? 'medium',
    industry: l.industry ?? 'other',
    position: l.position ?? '',
    website: l.website ?? '',
    address: l.address ?? '',
    city: l.city ?? '',
    country: l.country ?? '',
    logistics_needs: l.logisticsNeeds ?? l.logistics_needs ?? '',
    current_provider: l.currentProvider ?? l.current_provider ?? '',
    monthly_shipment_volume: l.monthlyShipmentVolume ?? l.monthly_shipment_volume ?? null,
    preferred_routes: l.preferredRoutes ?? l.preferred_routes ?? '',
    assigned_to: l.assignedTo ?? l.assigned_to ?? null,
    next_follow_up_date: l.nextFollowUpDate ?? l.next_follow_up_date ?? null,
    next_action: l.nextAction ?? l.next_action ?? '',
    next_action_date: l.nextActionDate ?? l.next_action_date ?? null,
    last_contact_date: l.lastContactDate ?? l.last_contact_date ?? null,
    converted_to_customer_id: l.convertedToCustomerId ?? l.converted_to_customer_id ?? null,
    converted_at: l.convertedAt ?? l.converted_at ?? null,
    lost_reason: l.lostReason ?? l.lost_reason ?? null,
    lost_at: l.lostAt ?? l.lost_at ?? null,
    notes: l.notes ?? '',
    tags: (() => {
        const raw = l.tags;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                // fall through
            }
            return raw.split(',').map((t) => t.trim()).filter(Boolean);
        }
        return [];
    })(),
    custom_fields: (() => {
        const raw = l.customFields ?? l.custom_fields;
        if (!raw) return {};
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return {};
            }
        }
        return raw;
    })(),
    created_at: l.createdAt ?? l.created_at ?? nowIso(),
    updated_at: l.updatedAt ?? l.updated_at ?? nowIso(),
});

const toDbLead = (l: Partial<Lead>) => ({
    leadSource: l.lead_source,
    leadStatus: l.lead_status,
    leadScore: l.lead_score,
    firstName: l.first_name,
    lastName: l.last_name,
    email: l.email,
    phone: l.phone,
    companyName: l.company_name,
    companySize: l.company_size,
    industry: l.industry,
    position: l.position,
    website: l.website,
    address: l.address,
    city: l.city,
    country: l.country,
    logisticsNeeds: l.logistics_needs,
    currentProvider: l.current_provider,
    monthlyShipmentVolume: l.monthly_shipment_volume,
    preferredRoutes: l.preferred_routes,
    assignedTo: l.assigned_to,
    nextFollowUpDate: l.next_follow_up_date,
    nextAction: l.next_action,
    nextActionDate: l.next_action_date,
    lastContactDate: l.last_contact_date,
    convertedToCustomerId: l.converted_to_customer_id,
    convertedAt: l.converted_at,
    lostReason: l.lost_reason,
    lostAt: l.lost_at,
    notes: l.notes,
    tags: l.tags,
    customFields: l.custom_fields,
});

const fromDbInvoice = (inv: any): Invoice => ({
    id: inv.id,
    invoice_number: inv.invoiceNumber ?? inv.invoice_number ?? `INV-${inv.id ?? 'tmp'}`,
    customer_id: Number(inv.customerId ?? inv.customer_id ?? 0) || 0,
    booking_id: inv.bookingId ?? inv.booking_id ?? undefined,
    invoice_type: inv.invoiceType ?? inv.invoice_type ?? 'booking',
    issue_date: inv.issueDate ?? inv.issue_date ?? nowIso(),
    due_date: inv.dueDate ?? inv.due_date ?? nowIso(),
    reminder_at: inv.reminderAt ?? inv.reminder_at ?? undefined,
    reminder_note: inv.reminderNote ?? inv.reminder_note ?? '',
    last_reminder_at: inv.lastReminderAt ?? inv.last_reminder_at ?? undefined,
    subtotal: Number(inv.subtotal ?? 0),
    tax_amount: Number(inv.taxAmount ?? inv.tax_amount ?? 0),
    discount_amount: Number(inv.discountAmount ?? inv.discount_amount ?? 0),
    total_amount: Number(inv.totalAmount ?? inv.total_amount ?? 0),
    amount_paid: Number(inv.amountPaid ?? inv.amount_paid ?? 0),
    balance_due: Number(inv.balanceDue ?? inv.balance_due ?? 0),
    currency: inv.currency ?? 'USD',
    status: inv.status ?? 'draft',
    payment_terms: Number(inv.paymentTerms ?? inv.payment_terms ?? 0) || undefined,
    notes: inv.notes ?? '',
    customer_notes: inv.customerNotes ?? inv.customer_notes ?? '',
    sent_at: inv.sentAt ?? inv.sent_at ?? undefined,
    viewed_at: inv.viewedAt ?? inv.viewed_at ?? undefined,
    paid_at: inv.paidAt ?? inv.paid_at ?? undefined,
    created_by: Number(inv.createdBy ?? inv.created_by ?? 0),
    created_at: inv.createdAt ?? inv.created_at ?? nowIso(),
    updated_at: inv.updatedAt ?? inv.updated_at ?? nowIso(),
});

const toDbInvoice = (inv: Partial<Invoice>) => ({
    invoiceNumber: inv.invoice_number,
    customerId: inv.customer_id,
    bookingId: inv.booking_id,
    invoiceType: inv.invoice_type,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    reminderAt: inv.reminder_at,
    reminderNote: inv.reminder_note,
    lastReminderAt: inv.last_reminder_at,
    subtotal: inv.subtotal,
    taxAmount: inv.tax_amount,
    discountAmount: inv.discount_amount,
    totalAmount: inv.total_amount,
    amountPaid: inv.amount_paid,
    balanceDue: inv.balance_due,
    currency: inv.currency,
    status: inv.status,
    paymentTerms: inv.payment_terms,
    notes: inv.notes,
    customerNotes: inv.customer_notes,
    sentAt: inv.sent_at,
    viewedAt: inv.viewed_at,
    paidAt: inv.paid_at,
    createdBy: inv.created_by,
});

const fromDbExpense = (ex: any): Expense => ({
    id: ex.id,
    expense_number: ex.expenseNumber ?? `EXP-${ex.id ?? 'tmp'}`,
    expense_category: (ex.expenseCategory ?? ex.expense_type ?? 'fuel') as any,
    vehicle_id: ex.vehicleId ?? null,
    expense_type: ex.expenseType ?? 'other',
    amount: Number(ex.amount ?? 0),
    currency: (ex.currency ?? 'USD') as any,
    description: ex.description ?? '',
    vendor_name: ex.vendorName ?? ex.vendor ?? '',
    amount_in_base_currency: Number(ex.amountInBaseCurrency ?? ex.amount ?? 0),
    receipt_url: ex.receiptUrl ?? '',
    expense_date: ex.expenseDate ?? nowIso(),
    recorded_by: ex.recordedBy ?? 0,
    payment_method: ex.paymentMethod ?? 'cash',
    payment_status: ex.paymentStatus ?? 'unpaid',
    created_at: ex.createdAt ?? nowIso(),
    is_recurring: Boolean(ex.isRecurring ?? false),
    recurring_frequency: ex.recurringFrequency ?? '',
    notes: ex.notes ?? '',
    updated_at: ex.updatedAt ?? nowIso(),
});

const toDbExpense = (ex: Partial<Expense>) => ({
    vehicleId: ex.vehicle_id,
    expenseType: ex.expense_type,
    amount: ex.amount,
    currency: ex.currency,
    description: ex.description,
    receiptUrl: ex.receipt_url,
    expenseDate: ex.expense_date,
    recordedBy: ex.recorded_by,
    isRecurring: ex.is_recurring,
    recurringFrequency: ex.recurring_frequency,
});

const fromDbOpportunity = (o: any): Opportunity => ({
    id: o.id,
    opportunity_name: o.opportunityName ?? o.opportunity_name ?? '',
    lead_id: o.leadId ?? o.lead_id ?? null,
    customer_id: o.customerId ?? o.customer_id ?? null,
    stage: o.stage ?? 'prospecting',
    expected_value: Number(o.expectedValue ?? o.expected_value ?? 0),
    currency: o.currency ?? 'USD',
    probability: Number(o.probability ?? 0),
    expected_close_date: o.expectedCloseDate ?? o.expected_close_date ?? nowIso(),
    next_action_date: o.nextActionDate ?? o.next_action_date ?? null,
    actual_close_date: o.actualCloseDate ?? o.actual_close_date ?? null,
    assigned_to: o.assignedTo ?? o.assigned_to ?? 0,
    description: o.description ?? '',
    next_step: o.nextStep ?? o.next_step ?? '',
    lost_reason: o.lostReason ?? o.lost_reason ?? '',
    created_at: o.createdAt ?? o.created_at ?? nowIso(),
    updated_at: o.updatedAt ?? o.updated_at ?? nowIso(),
});

const toDbOpportunity = (o: Partial<Opportunity>) => ({
    opportunityName: o.opportunity_name,
    leadId: o.lead_id,
    customerId: o.customer_id,
    stage: o.stage,
    expectedValue: o.expected_value,
    currency: o.currency,
    probability: o.probability,
    expectedCloseDate: o.expected_close_date,
    nextActionDate: o.next_action_date,
    actualCloseDate: o.actual_close_date,
    assignedTo: o.assigned_to,
    description: o.description,
    nextStep: o.next_step,
    lostReason: o.lost_reason,
});

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
    const [users, setUsers] = useState<User[]>(mockUsersForDrivers ?? []);
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers ?? []);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [gpsLocations, setGpsLocations] = useState<Record<number, GpsLocation>>({});
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
        fuel_type: 'diesel' as any,
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
        currency: 'USD' as any,
        vendor: row.supplier || undefined,
        category: 'fuel',
        receipt_url: row.receipt_url || undefined,
        expense_date: row.created_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.created_at || new Date().toISOString(),
    } as any);

    const mapLead = (row: any, idx: number): Lead => ({
        id: row.id ?? idx,
        lead_source: 'web' as any,
        lead_status: 'new' as any,
        lead_score: 0,
        first_name: row.customer_contact || row.customer || 'Lead',
        last_name: '',
        email: row.email || '',
        phone: '',
        company_name: row.customer || 'Unknown',
        company_size: 'small' as any,
        industry: 'other' as any,
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
        loyalty_tier: 'bronze' as any,
        total_spent: 0,
        total_bookings: 0,
        preferred_currency: 'USD' as any,
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
            setUsers(mockUsersForDrivers ?? []);
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
        setUsers(persisted?.users?.length ? persisted.users : (mockUsersForDrivers ?? []));
        setCustomers(persisted?.customers ?? (mockCustomers ?? []));
        setNotifications(persisted?.notifications ?? []);
        setGpsLocations(persisted?.gpsLocations ?? {});
        setAuditLog(persisted?.auditLog ?? []);
        setMaintenance(persisted?.maintenance ?? (mockMaintenance ?? []));
        setLeadActivities(persisted?.leadActivities ?? (mockLeadActivities ?? []));
        setOpportunityActivities(persisted?.opportunityActivities ?? []);
        setDeliveryProofs(persisted?.deliveryProofs ?? []);
    }, [storageKey]);

    // Part 4: Remote sync from API (Neon + Drizzle)
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            setLoadingRemote(true);
            setRemoteError(null);
            try {
                const [vRes, cRes, bRes, dRes, lRes, iRes, eRes, oRes, uRes, nRes, gpsRes] = await Promise.all([
                    vehiclesApi.getAll(),
                    customersApi.getAll(),
                    bookingsApi.getAll(),
                    driversApi.getAll(),
                    leadsApi.getAll(),
                    invoicesApi.getAll(),
                    expensesApi.getAll(),
                    opportunitiesApi.getAll(),
                    usersApi.getAll(),
                    notificationsApi.getAll(),
                    fetch("/api/vehicle-locations/latest", {
                        headers: {
                            "x-admin-token": (import.meta as any).env?.VITE_ADMIN_API_TOKEN || "",
                        },
                    }).then((r) => r.json()).catch(() => []),
                ]);

                if (cancelled) return;

                setVehicles((vRes || []).map(fromDbVehicle));
                setCustomers((cRes || []).map(fromDbCustomer));
                setBookings((bRes || []).map(fromDbBooking));
                setDrivers((dRes || []).map(fromDbDriver));
                setLeads((lRes || []).map(fromDbLead));
                setInvoices((iRes || []).map(fromDbInvoice));
                setExpenses((eRes || []).map(fromDbExpense));
                setOpportunities((oRes || []).map(fromDbOpportunity));
                setUsers((uRes || []).map(fromDbUser));
                setNotifications((nRes || []) as Notification[]);
                const gpsMap: Record<number, GpsLocation> = {};
                (gpsRes || []).forEach((g: any) => {
                    gpsMap[g.vehicle_id || g.vehicleId] = {
                        id: g.id,
                        vehicle_id: g.vehicle_id ?? g.vehicleId,
                        driver_id: g.driver_id ?? g.driverId,
                        booking_id: g.booking_id ?? g.bookingId,
                        latitude: Number(g.latitude),
                        longitude: Number(g.longitude),
                        speed: g.speed != null ? Number(g.speed) : undefined,
                        heading: g.heading != null ? Number(g.heading) : undefined,
                        timestamp: g.timestamp ?? g.created_at ?? nowIso(),
                        created_at: g.created_at ?? nowIso(),
                    };
                });
                setGpsLocations(gpsMap);
            } catch (err: any) {
                if (cancelled) return;
                setRemoteError(err?.message || 'Failed to load remote data');
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
        // Also send to server for cross-user realtime if configured
        const adminToken = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || undefined;
        publishEvent(type, payload, adminToken).catch(() => {
            // non-fatal
        });
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

        const handleMessage = (event: { source?: string; type?: string; payload?: any }) => {
            const { source, type, payload } = event;
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
                case 'drivers:add':
                    setDrivers((prev) => (prev.some((d) => d.id === payload.id) ? prev : [payload, ...prev]));
                    break;
                case 'drivers:update':
                    setDrivers((prev) => prev.map((d) => (d.id === payload.id ? { ...d, ...payload } : d)));
                    break;
                case 'drivers:delete':
                    setDrivers((prev) => prev.filter((d) => d.id !== payload.id));
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
                case 'users:update':
                    setUsers((prev) => prev.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)));
                    break;
                case 'users:delete':
                    setUsers((prev) => prev.filter((u) => u.id !== payload.id));
                    break;
        case 'audit:append':
            setAuditLog((prev) => [payload, ...prev].slice(0, 500));
            break;
        case 'notifications:add':
            setNotifications((prev) => [payload, ...prev].slice(0, 50));
            break;
        case 'vehicle.location':
            setGpsLocations((prev) => ({
                ...prev,
                [payload.vehicle_id ?? payload.vehicleId]: {
                    id: payload.id,
                    vehicle_id: payload.vehicle_id ?? payload.vehicleId,
                    driver_id: payload.driver_id ?? payload.driverId,
                    booking_id: payload.booking_id ?? payload.bookingId,
                    latitude: Number(payload.latitude),
                    longitude: Number(payload.longitude),
                    speed: payload.speed != null ? Number(payload.speed) : undefined,
                    heading: payload.heading != null ? Number(payload.heading) : undefined,
                    timestamp: payload.timestamp ?? nowIso(),
                    created_at: payload.created_at ?? nowIso(),
                },
            }));
            break;
        default:
            break;
        }
    };

        channel.onmessage = (event: MessageEvent) => {
            handleMessage(event.data as any);
        };

        // Also listen to server-sent events for cross-user realtime
        const adminToken = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || undefined;
        const es = openEventStream(adminToken);
        es.onmessage = (evt) => {
            try {
                const parsed = JSON.parse(evt.data);
                handleMessage(parsed);
            } catch {
                // ignore
            }
        };
        es.onerror = () => {
            // let the browser reconnect automatically
        };

        return () => {
            channel.close();
            es.close();
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
            gpsLocations,
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
        notifications,
        gpsLocations,
        auditLog,
        maintenance,
        leadActivities,
        opportunityActivities,
        deliveryProofs,
        gpsLocations,
        storageKey,
    ]);

    const addAudit = (entry: Omit<AuditEvent, 'id' | 'at'>) => {
        const full: AuditEvent = { id: safeId(), at: nowIso(), ...entry };
        setAuditLog((prev) => [full, ...prev].slice(0, 500));
        emitChange('audit:append', full);
    };

    const getCustomerEmail = (customerId?: number | null) => {
        if (!customerId) return null;
        const c = customers.find((c) => c.id === customerId);
        return c?.billing_email || null;
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

    const addBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
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

        const toSave: Booking = {
            ...booking,
            created_at: createdAt,
            updated_at: createdAt,
            status_history: [statusChange],
        } as Booking;

        try {
            const saved = await bookingsApi.create(toDbBooking(toSave));
            const mapped = fromDbBooking(saved);
            setBookings((prev) => [mapped, ...prev]);
            emitChange('bookings:add', mapped);

            addAudit({
                actor: statusChange.by,
                action: 'booking.status.change',
                entity: { type: 'booking', id: mapped.id, ref: mapped.booking_number },
                meta: { booking_number: mapped.booking_number },
            });
            const recipient = getCustomerEmail(mapped.customer_id);
            if (recipient) {
                await addNotification?.({
                    type: 'booking.created',
                    entity_id: mapped.id,
                    recipient_email: recipient,
                    status: 'queued',
                    payload: { booking_number: mapped.booking_number, status: mapped.status },
                } as any);
            }
        } catch {
            // optimistic fallback
            setBookings((prev) => {
                const id = prev.length ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
                const optimistic = { ...toSave, id };
                emitChange('bookings:add', optimistic);
                return [optimistic, ...prev];
            });
        }
    };

    const updateBooking = async (updated: Booking) => {
        const existing = bookings.find((b) => b.id === updated.id);
        if (!existing) return;

        const updatedAt = nowIso();
        const actor = user ? { id: user.userId, role: user.role } : undefined;
        const { statusChanged, status_history } = appendStatusHistory(existing, updated, actor as any);

        let next: Booking = { ...existing, ...updated, updated_at: updatedAt, status_history };
        if (statusChanged) {
            if (updated.status === 'confirmed') next.confirmed_at = updatedAt;
            if (updated.status === 'in_transit' || updated.status === 'dispatched') next.started_at = updatedAt;
            if (updated.status === 'delivered') next.delivered_at = updatedAt;
            if (updated.status === 'cancelled') next.cancelled_at = updatedAt;
        }

        setBookings((prev) => prev.map((b) => (b.id === updated.id ? next : b)));
        emitChange('bookings:update', next);
        if (statusChanged) {
            const auditEntry = makeAuditForStatusChange(existing, next, actor as any);
            setAuditLog((prev) => [auditEntry, ...prev].slice(0, 500));
            const recipient = getCustomerEmail(next.customer_id);
            if (recipient) {
                await addNotification?.({
                    type: 'booking.status',
                    entity_id: next.id,
                    recipient_email: recipient,
                    status: 'queued',
                    payload: { booking_number: next.booking_number, status: next.status },
                } as any);
            }
        }

        try {
            const saved = await bookingsApi.update(updated.id, { ...toDbBooking(next), updatedAt });
            const mapped = fromDbBooking(saved);
            setBookings((prev) => prev.map((b) => (b.id === updated.id ? mapped : b)));
        } catch {
            // keep optimistic state
        }
    };

    const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const toSave: Lead = { ...lead, created_at: createdAt, updated_at: createdAt } as Lead;
        try {
            const saved = await leadsApi.create(toDbLead(toSave));
            const mapped = fromDbLead(saved);
            setLeads((prev) => [mapped, ...prev]);
            emitChange('leads:add', mapped);
        } catch {
            setLeads((prev) => {
                const id = prev.length ? Math.max(...prev.map((l) => l.id)) + 1 : 1;
                const optimistic = { ...toSave, id };
                emitChange('leads:add', optimistic);
                return [optimistic, ...prev];
            });
        }
    };

    const updateLead = async (lead: Lead) => {
        const updatedAt = nowIso();
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...lead, updated_at: updatedAt } : l)));
        emitChange('leads:update', { ...lead, updated_at: updatedAt });
        try {
            const saved = await leadsApi.update(lead.id, { ...toDbLead(lead), updatedAt });
            const mapped = fromDbLead(saved);
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? mapped : l)));
        } catch {
            // keep optimistic
        }
    };

    const deleteLead = async (id: number) => {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        emitChange('leads:delete', { id });
        try {
            await leadsApi.delete(id);
        } catch {
            // ignore
        }
    };

    const updateOpportunity = async (opportunity: Opportunity) => {
        const updatedAt = nowIso();
        setOpportunities((prev) =>
            prev.map((o) => (o.id === opportunity.id ? { ...o, ...opportunity, updated_at: updatedAt } : o))
        );
        emitChange('opportunities:update', { ...opportunity, updated_at: updatedAt });

        try {
            const saved = await opportunitiesApi.update(opportunity.id, { ...toDbOpportunity(opportunity), updatedAt });
            const mapped = fromDbOpportunity(saved);
            setOpportunities((prev) => prev.map((o) => (o.id === opportunity.id ? mapped : o)));
        } catch {
            // leave optimistic
        }
    };

    const addInvoice = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const toSave: Invoice = { ...invoice, created_at: createdAt, updated_at: createdAt } as Invoice;
        try {
            const saved = await invoicesApi.create(toDbInvoice(toSave));
            const mapped = fromDbInvoice(saved);
            setInvoices((prev) => [mapped, ...prev]);
            emitChange('invoices:add', mapped);
        } catch {
            setInvoices((prev) => {
                const id = prev.length ? Math.max(...prev.map((i) => i.id)) + 1 : 1;
                const optimistic = { ...toSave, id };
                emitChange('invoices:add', optimistic);
                return [optimistic, ...prev];
            });
        }
    };

    const updateInvoice = async (updated: Invoice) => {
        const updatedAt = nowIso();
        let nextState: Invoice | null = null;

        setInvoices((prev) => {
            const existing = prev.find((i) => i.id === updated.id);
            if (!existing) return prev;

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
            try {
                const saved = await invoicesApi.update(updated.id, { ...toDbInvoice(nextState), updatedAt });
                const mapped = fromDbInvoice(saved);
                setInvoices((prev) => prev.map((i) => (i.id === updated.id ? mapped : i)));
                if (mapped.status === InvoiceStatus.PAID || mapped.status === 'overdue') {
                    const recipient = getCustomerEmail(mapped.customer_id);
                    if (recipient) {
                        await addNotification?.({
                            type: mapped.status === InvoiceStatus.PAID ? 'invoice.paid' : 'invoice.overdue',
                            entity_id: mapped.id,
                            recipient_email: recipient,
                            status: 'queued',
                            payload: { invoice_number: mapped.invoice_number, status: mapped.status },
                        } as any);
                    }
                }
            } catch {
                // keep optimistic
            }
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const toSave: Expense = { ...expense, created_at: createdAt, updated_at: createdAt } as Expense;
        try {
            const saved = await expensesApi.create(toDbExpense(toSave));
            const mapped = fromDbExpense(saved);
            setExpenses((prev) => [mapped, ...prev]);
            emitChange('expenses:add', mapped);
        } catch {
            setExpenses((prev) => {
                const id = prev.length ? Math.max(...prev.map((e) => e.id)) + 1 : 1;
                const optimistic = { ...toSave, id };
                emitChange('expenses:add', optimistic);
                return [optimistic, ...prev];
            });
        }
    };

    const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
        const createdAt = nowIso();
        const full: Vehicle = { ...vehicle, created_at: createdAt, updated_at: createdAt } as Vehicle;
        try {
            const saved = await vehiclesApi.create(toDbVehicle(full));
            const mapped = fromDbVehicle(saved);
            setVehicles((prev) => [mapped, ...prev]);
        } catch (e) {
            // fallback optimistic
            setVehicles((prev) => {
                const id = prev.length ? Math.max(...prev.map((v) => v.id)) + 1 : 1;
                return [{ ...full, id }, ...prev];
            });
        }
    };

    const updateVehicle = async (vehicle: Vehicle) => {
        const updatedAt = nowIso();
        try {
            const saved = await vehiclesApi.update(vehicle.id, { ...toDbVehicle(vehicle), updatedAt });
            const mapped = fromDbVehicle(saved);
            setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? mapped : v)));
        } catch {
            setVehicles((prev) =>
                prev.map((v) => (v.id === vehicle.id ? { ...v, ...vehicle, updated_at: updatedAt } : v))
            );
        }
    };

    const deleteVehicle = async (id: number) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        try {
            await vehiclesApi.delete(id);
        } catch {
            // swallow errors; state already updated
        }
    };

    const addDriver = async (driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> => {
        const createdAt = nowIso();
        const toSave: Driver = { ...driver, created_at: createdAt, updated_at: createdAt } as Driver;
        try {
            const saved = await driversApi.create(toDbDriver(toSave));
            const mapped = fromDbDriver(saved);
            setDrivers((prev) => [mapped, ...prev]);
            emitChange('drivers:add', mapped);
            return mapped;
        } catch {
            const nextId = drivers.length ? Math.max(...drivers.map((d) => d.id)) + 1 : 1;
            const optimistic = { ...toSave, id: nextId };
            setDrivers((prev) => {
                emitChange('drivers:add', optimistic);
                return [optimistic, ...prev];
            });
            return optimistic;
        }
    };

    const updateDriver = async (driver: Driver) => {
        const updatedAt = nowIso();
        setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, ...driver, updated_at: updatedAt } : d)));
        emitChange('drivers:update', { ...driver, updated_at: updatedAt });
        try {
            const saved = await driversApi.update(driver.id, { ...toDbDriver(driver), updatedAt });
            const mapped = fromDbDriver(saved);
            setDrivers((prev) => prev.map((d) => (d.id === driver.id ? mapped : d)));
        } catch {
            // keep optimistic
        }
    };

    const deleteDriver = async (id: number) => {
        setDrivers((prev) => prev.filter((d) => d.id !== id));
        emitChange('drivers:delete', { id });
        try {
            await driversApi.delete(id);
        } catch {
            // ignore
        }
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

    const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
        const createdAt = nowIso();
        const toSave: Customer = {
            ...customerData,
            user_id: 0,
            loyalty_points: customerData.loyalty_points ?? 0,
            total_spent: customerData.total_spent ?? 0,
            total_bookings: customerData.total_bookings ?? 0,
            is_verified: customerData.is_verified ?? true,
            preferred_currency: (customerData as any).preferred_currency || Currency.USD,
            created_at: createdAt,
            updated_at: createdAt,
            id: 0,
        } as Customer;
        try {
            const saved = await customersApi.create(toDbCustomer(toSave));
            const mapped = fromDbCustomer(saved);
            setCustomers((prev) => [mapped, ...prev]);
        } catch {
            setCustomers((prev) => {
                const id = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
                return [{ ...toSave, id }, ...prev];
            });
        }
    };

    const updateCustomer = async (customer: Customer) => {
        const updatedAt = nowIso();
        try {
            const saved = await customersApi.update(customer.id, { ...toDbCustomer(customer), updatedAt });
            const mapped = fromDbCustomer(saved);
            setCustomers((prev) => prev.map((c) => (c.id === customer.id ? mapped : c)));
        } catch {
            setCustomers((prev) =>
                prev.map((c) => (c.id === customer.id ? { ...c, ...customer, updated_at: updatedAt } : c))
            );
        }
    };

    const deleteCustomer = async (id: number) => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        try {
            await customersApi.delete(id);
        } catch {
            // ignore
        }
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

    const addUser = async (u: Omit<User, 'id'>): Promise<User> => {
        const toSave = { ...u, role: (u as any).role || 'pending' };
        try {
            const saved = await usersApi.create(toDbUser(toSave));
            const mapped = fromDbUser(saved);
            setUsers((prev) => [mapped, ...prev]);
            emitChange('users:add', mapped);
            return mapped;
        } catch {
            const optimistic = { ...toSave, id: safeId() } as User;
            setUsers((prev) => [optimistic as any, ...prev]);
            emitChange('users:add', optimistic);
            return optimistic;
        }
    };

    const addNotification = async (n: Omit<Notification, 'id' | 'created_at'>) => {
        try {
            const saved = await notificationsApi.create(n);
            setNotifications((prev) => [saved as Notification, ...prev].slice(0, 50));
            emitChange('notifications:add', saved);
        } catch {
            // ignore
        }
    };

    const updateUser = async (u: User) => {
        try {
            const saved = await usersApi.update(u.id as any, toDbUser(u));
            const mapped = fromDbUser(saved);
            setUsers((prev) => prev.map((x) => (x.id === u.id ? mapped : x)));
            emitChange('users:update', mapped);
        } catch {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            emitChange('users:update', u);
        }
    };

    const deleteUser = async (id: string | number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        emitChange('users:delete', { id });
        try {
            await usersApi.delete(id);
        } catch {
            // ignore
        }
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
        gpsLocations,

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
        addDriver,
        updateDriver,
        deleteDriver,
        addMaintenance,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        addLeadActivity,
        addOpportunityActivity,

        addDeliveryProof,

        addUser,
        updateUser,
        deleteUser,
        notifications,
        addNotification,
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
