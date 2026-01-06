

// --- USER & AUTHENTICATION MODULE ---

export interface User {
    id: number | string;
    email: string;
    // password_hash: string; // Omitted for frontend security
    role: 'admin' | 'customer' | 'driver' | 'marketing' | 'dispatcher' | 'ops_manager' | 'finance';
    first_name: string;
    last_name: string;
    phone?: string;
    avatar_url?: string;
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
}


// --- CUSTOMER MODULE ---

export enum LoyaltyTier {
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum',
}

export enum Currency {
    USD = 'USD',
    ZWL = 'ZWL',
    ZIG = 'ZIG',
}

export interface Customer {
    id: number;
    user_id: number; // foreign key → users.id
    company_name: string;
    company_registration?: string;
    industry?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    country: string;
    postal_code?: string;
    billing_email: string;
    billing_phone?: string;
    tax_id?: string;
    loyalty_points: number;
    loyalty_tier: LoyaltyTier;
    total_spent: number; // decimal
    total_bookings: number;
    preferred_currency: Currency;
    credit_limit?: number; // decimal
    payment_terms?: number; // days
    is_verified: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}


// --- FLEET MODULE ---

export enum VehicleType {
  REFRIGERATED = 'refrigerated',
  DRY = 'dry',
  FLATBED = 'flatbed',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum FuelType {
    DIESEL = 'diesel',
    PETROL = 'petrol',
}

export interface Vehicle {
    id: number;
    registration_number: string;
    make: string;
    model: string;
    year: number;
    vehicle_type: VehicleType;
    capacity_tonnes: number;
    status: VehicleStatus;
    purchase_date: string;
    purchase_cost: number; // decimal
    current_value?: number; // decimal
    insurance_provider?: string;
    insurance_policy_number?: string;
    insurance_expiry_date?: string;
    fitness_certificate_expiry?: string;
    license_disc_expiry?: string;
    last_service_date: string;
    last_service_km?: number;
    next_service_due_km: number;
    next_service_due_date?: string;
    current_km: number;
    fuel_type: FuelType;
    gps_device_id?: string;
    gps_device_active?: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export enum DocumentType {
    INSURANCE = 'insurance',
    FITNESS = 'fitness',
    LICENSE_DISC = 'license_disc',
    SERVICE_RECORD = 'service_record',
    OTHER = 'other',
}

export interface VehicleDocument {
    id: number;
    vehicle_id: number; // foreign key → vehicles.id
    document_type: DocumentType;
    document_name: string;
    file_url: string;
    expiry_date?: string;
    uploaded_at: string;
    uploaded_by: number; // foreign key → users.id
}

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface VehicleMaintenance {
    id: number;
    vehicle_id: number;
    maintenance_type: MaintenanceType;
    description: string;
    service_provider?: string;
    cost: number;
    km_at_service?: number;
    service_date: string;
    next_service_km?: number;
    next_service_date?: string;
    parts_replaced?: string;
    labor_hours?: number; // decimal
    status: MaintenanceStatus;
    created_by: number; // foreign key → users.id
    created_at: string;
    updated_at: string;
}

export enum ExpenseType {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  LICENSE = 'license',
  TOLLS = 'tolls',
  PARKING = 'parking',
  OTHER = 'other',
}

export interface VehicleExpense {
    id: number;
    vehicle_id: number;
    expense_type: ExpenseType;
    amount: number;
    currency: Currency;
    description: string;
    receipt_url?: string;
    expense_date: string;
    recorded_by: number; // foreign key → users.id
    created_at: string;
    is_recurring?: boolean;
    recurring_frequency?: RecurringFrequency;
}


// --- DRIVER MODULE ---

export enum EmploymentStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    TERMINATED = 'terminated',
    ON_LEAVE = 'on_leave',
}

export enum BackgroundCheckStatus {
    PENDING = 'pending',
    CLEARED = 'cleared',
    FLAGGED = 'flagged',
}

export interface Driver {
    id: number;
    user_id: number; // foreign key → users.id
    license_number: string;
    license_type: string;
    license_expiry_date: string;
    date_of_birth: string;
    national_id?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    country?: string;
    hire_date: string;
    employment_status: EmploymentStatus;
    salary?: number; // decimal
    medical_certificate_expiry?: string;
    background_check_date?: string;
    background_check_status?: BackgroundCheckStatus;
    rating?: number; // decimal, 0-5
    total_deliveries?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export enum AssignmentType {
    DELIVERY = 'delivery',
    MAINTENANCE = 'maintenance',
    STANDBY = 'standby',
}

export enum AssignmentStatus {
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface DriverAssignment {
    id: number;
    driver_id: number; // foreign key → drivers.id
    vehicle_id: number; // foreign key → vehicles.id
    booking_id?: number; // foreign key → bookings.id
    assignment_type: AssignmentType;
    assigned_at: string;
    started_at?: string;
    completed_at?: string;
    status: AssignmentStatus;
    notes?: string;
}


// --- GPS & TRACKING MODULE ---

export interface GpsLocation {
    id: number;
    vehicle_id: number; // foreign key → vehicles.id
    driver_id?: number; // foreign key → drivers.id
    booking_id?: number; // foreign key → bookings.id
    latitude: number; // decimal
    longitude: number; // decimal
    speed?: number; // decimal, km/h
    heading?: number; // decimal, degrees
    altitude?: number; // decimal
    accuracy?: number; // decimal, meters
    battery_level?: number; // integer, percentage
    is_engine_on?: boolean;
    odometer?: number; // integer, km
    timestamp: string;
    created_at: string;
}

export enum GeofenceType {
    WAREHOUSE = 'warehouse',
    BORDER = 'border',
    CUSTOMER = 'customer',
    RESTRICTED = 'restricted',
    SERVICE = 'service',
}

export interface Geofence {
    id: number;
    name: string;
    description?: string;
    latitude: number; // decimal
    longitude: number; // decimal
    radius: number; // decimal, meters
    geofence_type: GeofenceType;
    alert_on_entry: boolean;
    alert_on_exit: boolean;
    is_active: boolean;
    created_at: string;
}

export enum GeofenceEventType {
    ENTRY = 'entry',
    EXIT = 'exit',
}

export interface GeofenceEvent {
    id: number;
    geofence_id: number; // foreign key → geofences.id
    vehicle_id: number; // foreign key → vehicles.id
    booking_id?: number; // foreign key → bookings.id
    event_type: GeofenceEventType;
    timestamp: string;
    latitude: number; // decimal
    longitude: number; // decimal
    created_at: string;
}


// --- FUEL TRACKING MODULE ---

export interface FuelLog {
    id: number;
    vehicle_id: number; // foreign key → vehicles.id
    driver_id?: number; // foreign key → drivers.id
    booking_id?: number; // foreign key → bookings.id
    fuel_station?: string;
    location?: string;
    litres: number; // decimal
    cost_per_litre: number; // decimal
    total_cost: number; // decimal
    currency: Currency;
    odometer_reading: number; // integer, km
    fuel_type: FuelType;
    receipt_number?: string;
    receipt_url?: string;
    filled_at: string;
    recorded_by: number; // foreign key → users.id
    notes?: string;
    created_at: string;
}


// --- BOOKING & DELIVERY MODULE ---

export enum CargoType {
    GENERAL = 'general',
    PERISHABLE = 'perishable',
    HAZARDOUS = 'hazardous',
    FRAGILE = 'fragile',
    HEAVY = 'heavy',
}

export enum BookingStatus {
    // New lifecycle statuses added to support richer booking workflow
    DRAFT = 'draft',
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    SCHEDULED = 'scheduled',
    DISPATCHED = 'dispatched',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CLOSED = 'closed',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PARTIAL = 'partial',
    PAID = 'paid',
}

export enum PaymentMethod {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    MOBILE_MONEY = 'mobile_money',
    CREDIT = 'credit',
    CARD = 'card',
    CREDIT_NOTE = 'credit_note',
    OTHER = 'other',
}

// Audit & Status history types
export type AuditAction =
    | 'booking.create'
    | 'booking.status.change'
    | 'booking.assign'
    | 'booking.update'
    | 'lead.status.change'
    | 'opportunity.stage.change'
    | 'invoice.paid'
    | 'invoice.reminder'
    | 'data.import'
    | 'document.upload'
    | 'assistant.tool.call'
    | 'assistant.tool.error';

export interface AuditLogEntry {
    id: string;
    at: string; // ISO timestamp
    actor_user_id?: string | number;
    actor_role?: string;
    action: AuditAction;
    entity_type: 'booking' | 'invoice' | 'lead' | 'vehicle' | 'opportunity' | 'import' | 'document';
    entity_id: number;
    summary: string;
    meta?: Record<string, unknown>;
}

export interface BookingStatusChange {
    id: string;
    at: string; // ISO timestamp
    from: BookingStatus | null;
    to: BookingStatus;
    actor_user_id?: string | number;
    actor_role?: string;
}

// New, richer event type (backwards-compatible with BookingStatusChange)
export type BookingStatusEvent = {
    at: string; // ISO
    from: BookingStatus | null;
    to: BookingStatus;
    by?: { id?: number | string; name?: string; role?: string };
    note?: string;
};

export type AuditEntityType = 'booking' | 'lead' | 'opportunity' | 'invoice' | 'import' | 'document' | 'customer' | 'assistant' | 'vehicle';

export type AuditEvent = {
    id: string;
    at: string; // ISO
    actor?: { id?: number | string; name?: string; role?: string };
    action: AuditAction;
    entity: { type: AuditEntityType; id?: number | string; ref?: string };
    meta?: Record<string, any>;
};

export interface Booking {
    id: number;
    booking_number: string;
    customer_id: number; // foreign key → customers.id
    pickup_location: string;
    pickup_address: string;
    pickup_city: string;
    pickup_country: string;
    pickup_latitude?: number; // decimal
    pickup_longitude?: number; // decimal
    pickup_date: string;
    pickup_contact_name?: string;
    pickup_contact_phone?: string;
    delivery_location: string;
    delivery_address: string;
    delivery_city: string;
    delivery_country: string;
    delivery_latitude?: number; // decimal
    delivery_longitude?: number; // decimal
    delivery_date: string;
    delivery_contact_name?: string;
    delivery_contact_phone?: string;
    cargo_type: CargoType;
    cargo_description: string;
    weight_tonnes: number; // decimal
    requires_refrigeration: boolean;
    temperature_min?: number; // decimal
    temperature_max?: number; // decimal
    vehicle_id?: number; // foreign key → vehicles.id
    driver_id?: number; // foreign key → drivers.id
    status: BookingStatus;
    base_price: number; // decimal
    surcharges?: number; // decimal
    discount?: number; // decimal
    total_price: number; // decimal
    currency: Currency;
    payment_status: PaymentStatus;
    payment_method?: PaymentMethod;
    loyalty_points_earned?: number;
    special_instructions?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    confirmed_at?: string;
    started_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    status_history?: BookingStatusEvent[];
}

export enum ProofType {
    SIGNATURE = 'signature',
    PHOTO = 'photo',
    GPS = 'gps',
}

export interface DeliveryProof {
    id: number;
    booking_id: number; // foreign key → bookings.id
    driver_id: number; // foreign key → drivers.id
    proof_type: ProofType;
    photo_url?: string;
    signature_url?: string;
    latitude?: number; // decimal
    longitude?: number; // decimal
    recipient_name?: string;
    recipient_signature?: string;
    notes?: string;
    captured_at: string;
    created_at: string;
}



export type FileEntityType = 'vehicle' | 'booking' | 'invoice' | 'lead' | 'customer' | 'other';

export interface FileRecord {
    id: number;
    name: string;
    size_bytes: number;
    mime_type: string;
    entity_type: FileEntityType;
    entity_id?: number;
    uploaded_by?: number; // user.id
    uploaded_at: string;
    notes?: string;
}

// --- CRM & LEAD GENERATION ---

export enum LeadSource {
    WEBSITE = 'website',
    REFERRAL = 'referral',
    COLD_OUTREACH = 'cold_outreach',
    EVENT = 'event',
    SOCIAL_MEDIA = 'social_media',
    PARTNER = 'partner',
    OTHER = 'other',
}

export enum LeadStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    PROPOSAL_SENT = 'proposal_sent',
    NEGOTIATION = 'negotiation',
    WON = 'won',
    LOST = 'lost',
}

export enum CompanySize {
    STARTUP = 'startup',
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
    ENTERPRISE = 'enterprise',
}

export enum Industry {
    FMCG = 'fmcg',
    RETAIL = 'retail',
    MANUFACTURING = 'manufacturing',
    AGRICULTURE = 'agriculture',
    MINING = 'mining',
    WHOLESALE = 'wholesale',
    OTHER = 'other',
}

export interface Lead {
    id: number;
    lead_source: LeadSource;
    lead_status: LeadStatus;
    lead_score: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    company_size: CompanySize;
    industry: Industry;
    position: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    logistics_needs: string;
    current_provider?: string;
    monthly_shipment_volume?: number;
    preferred_routes?: string;
    assigned_to?: number; // user.id
    next_follow_up_date?: string;
    next_action?: string;
    next_action_date?: string;
    last_contact_date?: string;
    converted_to_customer_id?: number; // customer.id
    converted_at?: string;
    lost_reason?: string;
    lost_at?: string;
    notes?: string;
    tags?: string[]; // or JSON
    custom_fields?: Record<string, any>; // JSON
    created_at: string;
    updated_at: string;
}

export enum LeadActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    NOTE = 'note',
    QUOTE_SENT = 'quote_sent',
    PROPOSAL_SENT = 'proposal_sent',
    STATUS_CHANGE = 'status_change',
    CAMPAIGN_EMAIL = 'campaign_email',
}

export interface LeadActivity {
    id: number;
    lead_id: number; // lead.id
    activity_type: LeadActivityType;
    subject: string;
    description: string;
    outcome?: string;
    next_action?: string;
    next_action_date?: string;
    performed_by: number; // user.id
    created_at: string;
}

export interface LeadScoringRule {
    id: number;
    rule_name: string;
    condition: Record<string, any>; // JSON
    points: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- EMAIL CAMPAIGNS MODULE ---

export enum CampaignType {
    COLD_OUTREACH = 'cold_outreach',
    NURTURE = 'nurture',
    REENGAGEMENT = 'reengagement',
    NEWSLETTER = 'newsletter',
    PROMOTIONAL = 'promotional',
    EVENT = 'event',
}

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

export interface Campaign {
    id: number;
    campaign_name: string;
    campaign_type: CampaignType;
    campaign_goal: string;
    target_audience: string;
    status: CampaignStatus;
    timezone: string;
    sending_hours_start: string; // time
    sending_hours_end: string; // time
    send_on_weekends: boolean;
    daily_send_limit?: number;
    track_opens: boolean;
    track_clicks: boolean;
    auto_pause_on_reply: boolean;
    include_unsubscribe_link: boolean;
    from_name: string;
    from_email: string;
    reply_to_email?: string;
    total_leads: number;
    emails_sent: number;
    emails_delivered: number;
    emails_opened: number;
    emails_clicked: number;
    emails_replied: number;
    emails_bounced: number;
    unsubscribes: number;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
    started_at?: string;
    paused_at?: string;
    completed_at?: string;
}

export enum SendCondition {
    ALWAYS = 'always',
    IF_OPENED = 'if_opened',
    IF_CLICKED = 'if_clicked',
    IF_NOT_OPENED = 'if_not_opened',
    IF_NOT_CLICKED = 'if_not_clicked',
}

export enum ABTestVariant {
    A = 'A',
    B = 'B',
}

export interface EmailSequence {
    id: number;
    campaign_id: number; // campaign.id
    step_number: number;
    step_name: string;
    subject_line: string;
    email_body: string; // text/HTML
    delay_days: number;
    delay_hours: number;
    send_condition: SendCondition;
    is_ab_test: boolean;
    ab_test_variant?: ABTestVariant;
    ab_test_percentage?: number;
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
    created_at: string;
    updated_at: string;
}

export enum CampaignLeadStatus {
    PENDING = 'pending',
    SENDING = 'sending',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    UNSUBSCRIBED = 'unsubscribed',
    BOUNCED = 'bounced',
    OPTED_OUT = 'opted_out',
}

export interface CampaignLead {
    id: number;
    campaign_id: number; // campaign.id
    lead_id: number; // lead.id
    status: CampaignLeadStatus;
    current_sequence_step: number;
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
    has_replied: boolean;
    personalization_data: Record<string, any>; // JSON
    next_email_scheduled_at?: string;
    last_email_sent_at?: string;
    last_opened_at?: string;
    last_clicked_at?: string;
    replied_at?: string;
    unsubscribed_at?: string;
    exit_reason?: string;
    added_at: string;
    completed_at?: string;
}

export enum EmailLogStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    CLICKED = 'clicked',
    REPLIED = 'replied',
    BOUNCED = 'bounced',
    FAILED = 'failed',
}

export enum BounceType {
    HARD = 'hard',
    SOFT = 'soft',
}

export interface EmailLog {
    id: number;
    campaign_lead_id: number; // campaign_lead.id
    campaign_id: number; // campaign.id
    lead_id: number; // lead.id
    sequence_id: number; // email_sequence.id
    email_subject: string;
    email_body: string;
    from_email: string;
    to_email: string;
    tracking_pixel_id: string;
    status: EmailLogStatus;
    sent_at?: string;
    delivered_at?: string;
    first_opened_at?: string;
    last_opened_at?: string;
    first_clicked_at?: string;
    last_clicked_at?: string;
    replied_at?: string;
    bounced_at?: string;
    open_count: number;
    click_count: number;
    links_clicked?: string[]; // JSON array
    bounce_type?: BounceType;
    bounce_reason?: string;
    error_message?: string;
    created_at: string;
}

export enum EmailTemplateCategory {
    COLD_OUTREACH = 'cold_outreach',
    FOLLOW_UP = 'follow_up',
    NURTURE = 'nurture',
    THANK_YOU = 'thank_you',
    REENGAGEMENT = 'reengagement',
    CUSTOM = 'custom',
}

export interface EmailTemplate {
    id: number;
    template_name: string;
    template_category: EmailTemplateCategory;
    subject_line: string;
    email_body: string; // text/HTML
    variables_used?: string[]; // JSON array
    use_count: number;
    is_public: boolean;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface Unsubscribe {
    id: number;
    lead_id?: number; // lead.id
    email: string;
    campaign_id?: number; // campaign.id
    reason?: string;
    feedback?: string;
    unsubscribed_at: string;
    ip_address?: string;
    user_agent?: string;
}

export enum DeviceType {
    DESKTOP = 'desktop',
    MOBILE = 'mobile',
    TABLET = 'tablet',
}

export interface EmailClickTracking {
    id: number;
    email_log_id: number; // email_log.id
    campaign_lead_id: number; // campaign_lead.id
    original_url: string;
    tracking_url: string;
    clicked_at: string;
    ip_address: string;
    user_agent: string;
    device_type?: DeviceType;
    browser?: string;
    location?: string;
}


// --- SALES PIPELINE MODULE ---

export enum OpportunityStage {
    PROSPECTING = 'prospecting',
    QUALIFICATION = 'qualification',
    PROPOSAL = 'proposal',
    NEGOTIATION = 'negotiation',
    CLOSED_WON = 'closed_won',
    CLOSED_LOST = 'closed_lost',
}

export interface Opportunity {
    id: number;
    opportunity_name: string;
    lead_id?: number; // lead.id
    customer_id?: number; // customer.id
    stage: OpportunityStage;
    expected_value: number; // decimal
    currency: Currency;
    probability: number;
    expected_close_date: string;
    next_action_date?: string;
    actual_close_date?: string;
    assigned_to: number; // user.id
    description: string;
    next_step: string;
    lost_reason?: string;
    created_at: string;
    updated_at: string;
}

export enum OpportunityActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    DEMO = 'demo',
    PROPOSAL_SENT = 'proposal_sent',
    STAGE_CHANGE = 'stage_change',
    NOTE = 'note',
}

export interface OpportunityActivity {
    id: number;
    opportunity_id: number; // opportunity.id
    activity_type: OpportunityActivityType;
    description: string;
    performed_by: number; // user.id
    created_at: string;
}


// --- QUOTE REQUESTS MODULE ---

export enum QuoteRequestStatus {
    NEW = 'new',
    VIEWED = 'viewed',
    QUOTED = 'quoted',
    CONVERTED = 'converted',
    DECLINED = 'declined',
}

export interface QuoteRequest {
    id: number;
    request_number: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string;
    company_name?: string;
    pickup_location: string;
    delivery_location: string;
    cargo_type: CargoType;
    weight_tonnes: number; // decimal
    pickup_date: string;
    delivery_date: string;
    estimated_price?: number; // decimal
    currency: Currency;
    status: QuoteRequestStatus;
    quoted_price?: number; // decimal
    quoted_at?: string;
    quoted_by?: number; // user.id
    converted_to_booking_id?: number; // booking.id
    converted_to_lead_id?: number; // lead.id
    notes?: string;
    message: string;
    created_at: string;
    updated_at: string;
}


export enum PreferredContactMethod {
    PHONE = 'phone',
    EMAIL = 'email',
    WHATSAPP = 'whatsapp',
}

export enum ConsultationRequestStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    NO_SHOW = 'no_show',
    CONVERTED = 'converted',
}

export interface ConsultationRequest {
    id: number;
    request_number: string;
    name: string;
    email: string;
    phone: string;
    company_name?: string;
    logistics_needs: string;
    preferred_contact_method: PreferredContactMethod;
    preferred_time?: string;
    status: ConsultationRequestStatus;
    scheduled_meeting_at?: string;
    completed_at?: string;
    assigned_to?: number; // user.id
    converted_to_lead_id?: number; // lead.id
    notes?: string;
    created_at: string;
    updated_at: string;
}


// --- FINANCIAL & PAYMENT ---

// --- INVOICING MODULE ---

export enum InvoiceType {
    BOOKING = 'booking',
    SUBSCRIPTION = 'subscription',
    SERVICE = 'service',
    OTHER = 'other',
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    VIEWED = 'viewed',
    PARTIAL = 'partial',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
}

export interface Invoice {
    id: number;
    invoice_number: string;
    customer_id: number; // customer.id
    booking_id?: number; // booking.id
    invoice_type: InvoiceType;
    issue_date: string;
    due_date: string;
    reminder_at?: string;
    reminder_note?: string;
    last_reminder_at?: string;
    subtotal: number; // decimal
    tax_amount: number; // decimal
    discount_amount: number; // decimal
    total_amount: number; // decimal
    amount_paid: number; // decimal
    balance_due: number; // decimal
    currency: Currency;
    status: InvoiceStatus;
    payment_terms?: number; // days
    notes?: string;
    customer_notes?: string;
    sent_at?: string;
    viewed_at?: string;
    paid_at?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export enum InvoiceItemType {
    DELIVERY = 'delivery',
    STORAGE = 'storage',
    HANDLING = 'handling',
    FUEL_SURCHARGE = 'fuel_surcharge',
    INSURANCE = 'insurance',
    CUSTOMS = 'customs',
    DETENTION = 'detention',
    OTHER = 'other',
}

export interface InvoiceItem {
    id: number;
    invoice_id: number; // invoice.id
    item_type: InvoiceItemType;
    description: string;
    quantity: number; // decimal
    unit_price: number; // decimal
    tax_rate: number; // decimal
    discount_rate?: number; // decimal
    line_total: number; // decimal
    created_at: string;
}


// --- PAYMENTS MODULE ---

export enum ExpensePaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    REIMBURSED = 'reimbursed',
}

export interface Payment {
    id: number;
    payment_number: string;
    customer_id: number; // customer.id
    invoice_id?: number; // invoice.id
    booking_id?: number; // booking.id
    amount: number; // decimal
    currency: Currency;
    exchange_rate?: number; // decimal
    amount_in_base_currency: number; // decimal
    payment_method: PaymentMethod;
    payment_provider?: string;
    transaction_reference?: string;
    payment_date: string;
    status: ExpensePaymentStatus;
    notes?: string;
    receipt_url?: string;
    processed_by: number; // user.id
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

export interface PaymentAllocation {
    id: number;
    payment_id: number; // payment.id
    invoice_id: number; // invoice.id
    amount_allocated: number; // decimal
    created_at: string;
}


// --- EXPENSES MODULE ---

export enum ExpenseCategory {
    FUEL = 'fuel',
    MAINTENANCE = 'maintenance',
    SALARIES = 'salaries',
    INSURANCE = 'insurance',
    LICENSES = 'licenses',
    TOLLS = 'tolls',
    OFFICE = 'office',
    MARKETING = 'marketing',
    UTILITIES = 'utilities',
    RENT = 'rent',
    EQUIPMENT = 'equipment',
    OTHER = 'other',
}

export enum RecurringFrequency {
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
}

export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface Expense {
    id: number;
    expense_number: string;
    expense_category: ExpenseCategory;
    vehicle_id?: number; // vehicle.id
    driver_id?: number; // driver.id
    booking_id?: number; // booking.id
    vendor_name: string;
    description: string;
    amount: number; // decimal
    currency: Currency;
    exchange_rate?: number; // decimal
    amount_in_base_currency: number; // decimal
    expense_date: string;
    payment_method: PaymentMethod;
    payment_status: ExpensePaymentStatus;
    paid_date?: string;
    receipt_number?: string;
    receipt_url?: string;
    is_recurring: boolean;
    recurring_frequency?: RecurringFrequency;
    approval_status?: ApprovalStatus;
    approved_by?: number; // user.id
    approved_at?: string;
    recorded_by: number; // user.id
    notes?: string;
    created_at: string;
    updated_at: string;
}


// --- REVENUE TRACKING ---

export enum RevenueType {
    DELIVERY = 'delivery',
    STORAGE = 'storage',
    CONSULTATION = 'consultation',
    SUBSCRIPTION = 'subscription',
    OTHER = 'other',
}

export interface RevenueRecord {
    id: number;
    booking_id?: number; // booking.id
    invoice_id?: number; // invoice.id
    customer_id: number; // customer.id
    revenue_type: RevenueType;
    amount: number; // decimal
    currency: Currency;
    amount_in_base_currency: number; // decimal
    revenue_date: string;
    cost_of_service?: number; // decimal
    gross_profit: number; // decimal
    profit_margin: number; // decimal
    created_at: string;
}


// --- PRICING & RATES ---

export enum AppliesToAll {
    ALL = 'all',
}

export interface PricingRule {
    id: number;
    rule_name: string;
    route_from: string;
    route_to: string;
    cargo_type: CargoType | AppliesToAll.ALL;
    vehicle_type: VehicleType | AppliesToAll.ALL;
    base_rate_per_tonne: number; // decimal
    base_rate_per_km?: number; // decimal
    minimum_charge: number; // decimal
    surcharges: Record<string, number>; // JSON
    is_active: boolean;
    valid_from: string;
    valid_until?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED_AMOUNT = 'fixed_amount',
}

export enum DiscountAppliesTo {
    ALL_BOOKINGS = 'all_bookings',
    FIRST_BOOKING = 'first_booking',
    ROUTE_SPECIFIC = 'route_specific',
    CARGO_SPECIFIC = 'cargo_specific',
    CUSTOMER_SPECIFIC = 'customer_specific',
}

export interface Discount {
    id: number;
    discount_code: string;
    discount_name: string;
    discount_type: DiscountType;
    discount_value: number; // decimal
    applies_to: DiscountAppliesTo;
    minimum_order_value?: number; // decimal
    customer_id?: number; // customer.id
    max_uses?: number;
    max_uses_per_customer?: number;
    current_uses: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- LOYALTY PROGRAM ---

export enum LoyaltyTransactionType {
    EARNED = 'earned',
    REDEEMED = 'redeemed',
    EXPIRED = 'expired',
    ADJUSTED = 'adjusted',
}

export interface LoyaltyTransaction {
    id: number;
    customer_id: number; // customer.id
    transaction_type: LoyaltyTransactionType;
    points: number;
    booking_id?: number; // booking.id
    invoice_id?: number; // invoice.id
    description: string;
    balance_after: number;
    expires_at?: string;
    created_at: string;
}

// --- NOTIFICATIONS & COMMUNICATION ---

export enum RelatedEntityType {
    BOOKING = 'booking',
    INVOICE = 'invoice',
    PAYMENT = 'payment',
    VEHICLE = 'vehicle',
    DRIVER = 'driver',
    CAMPAIGN = 'campaign',
    LEAD = 'lead',
    EXPENSE = 'expense',
    SYSTEM = 'system',
    USER = 'user',
    DELIVERY = 'delivery',
}

// --- ROUTES, LOCATIONS & GEOGRAPHIC DATA ---

export enum RouteType {
    DOMESTIC = 'domestic',
    CROSS_BORDER = 'cross_border',
    INTERNATIONAL = 'international',
}

export enum RoadConditions {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
    MIXED = 'mixed',
}

export interface Route {
    id: number;
    route_name: string;
    route_code: string;
    origin_city: string;
    origin_country: string;
    origin_latitude?: number;
    origin_longitude?: number;
    destination_city: string;
    destination_country: string;
    destination_latitude?: number;
    destination_longitude?: number;
    distance_km: number;
    estimated_duration_hours: number;
    route_type: RouteType;
    border_crossings: { name: string; country_from: string; country_to: string; avg_wait_hours: number }[]; // JSON
    toll_gates: { name: string; cost_usd: number; location: string }[]; // JSON
    total_toll_cost: number;
    road_conditions: RoadConditions;
    is_active: boolean;
    is_popular: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export enum WaypointLocationType {
    BORDER = 'border',
    TOLL = 'toll',
    REST_STOP = 'rest_stop',
    FUEL_STATION = 'fuel_station',
    WAREHOUSE = 'warehouse',
    CHECKPOINT = 'checkpoint',
    CITY = 'city',
}

export interface RouteWaypoint {
    id: number;
    route_id: number; // route.id
    waypoint_order: number;
    location_name: string;
    location_type: WaypointLocationType;
    latitude: number;
    longitude: number;
    estimated_arrival_hours: number;
    is_mandatory_stop: boolean;
    average_stop_duration_minutes?: number;
    notes?: string;
    created_at: string;
}


// --- WEATHER DATA ---

export enum WeatherCondition {
    CLEAR = 'clear',
    RAIN = 'rain',
    STORM = 'storm',
    FOG = 'fog',
    SNOW = 'snow',
    EXTREME_HEAT = 'extreme_heat',
}

export enum RoadImpact {
    NONE = 'none',
    MINOR = 'minor',
    MODERATE = 'moderate',
    SEVERE = 'severe',
}

// FIX: Renamed interface from WeatherCondition to WeatherLog to resolve name conflict with the enum.
export interface WeatherLog {
    id: number;
    location_name: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    weather_condition: WeatherCondition;
    temperature: number;
    visibility_km?: number;
    wind_speed_kmh?: number;
    road_impact: RoadImpact;
    warning_issued: boolean;
    warning_description?: string;
    source: string;
    recorded_at: string;
    created_at: string;
}

// --- MARKETING HUB SCHEMA ---

export enum SalesSequenceType {
    COLD_OUTREACH = 'cold_outreach',
    FOLLOW_UP = 'follow_up',
    NURTURE = 'nurture',
    REACTIVATION = 'reactivation',
}

export interface SalesSequence {
    id: number;
    sequence_name: string;
    sequence_type: SalesSequenceType;
    description: string;
    total_steps: number;
    is_active: boolean;
    enrollment_count: number;
    completion_count: number;
    reply_count: number;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

// --- Gemini Service ---
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            review: string;
        }[];
    }[]
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  groundingChunks?: GroundingChunk[];
}
