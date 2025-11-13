

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

export enum ExpenseType {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  LICENSE = 'license',
  TOLLS = 'tolls',
  PARKING = 'parking',
  OTHER = 'other',
}

export enum Currency {
    USD = 'USD',
    ZWL = 'ZWL',
    ZIG = 'ZIG',
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
  current_km: number;
  last_service_date: string;
  next_service_due_km: number;
  gps_device_id: string;
}

export interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  maintenance_type: MaintenanceType;
  description: string;
  cost: number;
  service_date: string;
  status: MaintenanceStatus;
  next_service_date?: string;
}

export interface VehicleExpense {
  id: number;
  vehicle_id: number;
  expense_type: ExpenseType;
  amount: number;
  currency: Currency;
  description: string;
  expense_date: string;
}

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

// --- USER ---
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

// --- CRM & LEAD GENERATION ---

// --- LEADS MODULE ---

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
    website: string;
    address: string;
    city: string;
    country: string;
    logistics_needs: string;
    current_provider?: string;
    monthly_shipment_volume?: number;
    preferred_routes?: string;
    assigned_to?: number; // user.id
    next_follow_up_date?: string;
    last_contact_date?: string;
    converted_to_customer_id?: number; // customer.id
    converted_at?: string;
    lost_reason?: string;
    lost_at?: string;
    notes?: string;
    tags: string[]; // or JSON
    custom_fields: Record<string, any>; // JSON
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
    reply_to_email: string;
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
    links_clicked: string[]; // JSON array
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
    variables_used: string[]; // JSON array
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

export enum CargoType {
    GENERAL = 'general',
    PERISHABLE = 'perishable',
    HAZARDOUS = 'hazardous',
    FRAGILE = 'fragile',
    HEAVY = 'heavy',
}

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
    subtotal: number; // decimal
    tax_amount: number; // decimal
    discount_amount: number; // decimal
    total_amount: number; // decimal
    amount_paid: number; // decimal
    balance_due: number; // decimal
    currency: Currency;
    status: InvoiceStatus;
    payment_terms: number; // days
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

export enum PaymentMethod {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    MOBILE_MONEY = 'mobile_money',
    CARD = 'card',
    CREDIT_NOTE = 'credit_note',
    OTHER = 'other',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled',
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
    transaction_reference: string;
    payment_date: string;
    status: PaymentStatus;
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

export enum ExpensePaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    REIMBURSED = 'reimbursed',
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

export interface LoyaltyTier {
    id: number;
    tier_name: string;
    tier_level: number;
    points_required: number;
    discount_percentage: number; // decimal
    benefits: Record<string, boolean>; // JSON
    badge_color: string;
    badge_icon_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoyaltyRedemption {
    id: number;
    customer_id: number; // customer.id
    booking_id?: number; // booking.id
    invoice_id?: number; // invoice.id
    points_redeemed: number;
    monetary_value: number; // decimal
    currency: Currency;
    redeemed_at: string;
    created_at: string;
}


// --- CURRENCY EXCHANGE ---

export enum ExchangeRateSource {
    MANUAL = 'manual',
    RBC = 'rbc',
    OANDA = 'oanda',
    OTHER = 'other',
}

export interface ExchangeRate {
    id: number;
    from_currency: Currency;
    to_currency: Currency;
    rate: number; // decimal
    effective_date: string;
    source: ExchangeRateSource;
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

// --- NOTIFICATIONS MODULE ---

export enum NotificationRecipientType {
    ADMIN = 'admin',
    CUSTOMER = 'customer',
    DRIVER = 'driver',
    MARKETING = 'marketing',
}

export enum NotificationType {
    BOOKING_UPDATE = 'booking_update',
    PAYMENT_RECEIVED = 'payment_received',
    INVOICE_DUE = 'invoice_due',
    DELIVERY_COMPLETED = 'delivery_completed',
    VEHICLE_MAINTENANCE = 'vehicle_maintenance',
    INSURANCE_EXPIRY = 'insurance_expiry',
    CAMPAIGN_MILESTONE = 'campaign_milestone',
    LEAD_ACTIVITY = 'lead_activity',
    SYSTEM_ALERT = 'system_alert',
}

export enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum NotificationDeliveryMethod {
    IN_APP = 'in_app',
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
    WHATSAPP = 'whatsapp',
}

export interface Notification {
    id: number;
    recipient_id: number; // user.id
    recipient_type: NotificationRecipientType;
    notification_type: NotificationType;
    title: string;
    message: string;
    priority: Priority;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    action_url?: string;
    action_label?: string;
    is_read: boolean;
    read_at?: string;
    delivery_method: NotificationDeliveryMethod;
    is_delivered: boolean;
    delivered_at?: string;
    metadata: Record<string, any>; // JSON
    created_at: string;
    expires_at?: string;
}

export interface NotificationPreferences {
    id: number;
    user_id: number; // user.id
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    whatsapp_enabled: boolean;
    in_app_enabled: boolean;
    booking_updates: boolean;
    payment_updates: boolean;
    marketing_emails: boolean;
    system_alerts: boolean;
    delivery_notifications: boolean;
    quiet_hours_start?: string; // time
    quiet_hours_end?: string; // time
    updated_at: string;
}

// --- SMS MODULE ---

export enum SmsMessageType {
    BOOKING_CONFIRMATION = 'booking_confirmation',
    DELIVERY_UPDATE = 'delivery_update',
    PAYMENT_REMINDER = 'payment_reminder',
    OTP = 'otp',
    MARKETING = 'marketing',
    ALERT = 'alert',
    CUSTOM = 'custom',
}

export enum SmsStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    EXPIRED = 'expired',
}

export enum SmsProvider {
    TWILIO = 'twilio',
    AFRICASTALKING = 'africastalking',
    OTHER = 'other',
}

export interface SmsMessage {
    id: number;
    recipient_phone: string;
    recipient_user_id?: number; // user.id
    recipient_customer_id?: number; // customer.id
    recipient_driver_id?: number; // driver.id
    message_type: SmsMessageType;
    message_body: string;
    status: SmsStatus;
    provider: SmsProvider;
    provider_message_id?: string;
    cost?: number; // decimal
    currency: Currency;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    scheduled_at?: string;
    sent_at?: string;
    delivered_at?: string;
    failed_at?: string;
    error_message?: string;
    created_at: string;
}

export interface SmsTemplate {
    id: number;
    template_name: string;
    template_code: string;
    message_body: string;
    variables_used: string[]; // JSON array
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- EMAIL COMMUNICATION MODULE ---

export enum TransactionalEmailType {
    BOOKING_CONFIRMATION = 'booking_confirmation',
    INVOICE = 'invoice',
    PAYMENT_RECEIPT = 'payment_receipt',
    PASSWORD_RESET = 'password_reset',
    WELCOME = 'welcome',
    DELIVERY_PROOF = 'delivery_proof',
    ALERT = 'alert',
}

export enum TransactionalEmailStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    BOUNCED = 'bounced',
    FAILED = 'failed',
}

export enum EmailProvider {
    SMTP = 'smtp',
    SENDGRID = 'sendgrid',
    MAILGUN = 'mailgun',
    SES = 'ses',
    OTHER = 'other',
}

export interface TransactionalEmail {
    id: number;
    recipient_email: string;
    recipient_name: string;
    recipient_user_id?: number; // user.id
    email_type: TransactionalEmailType;
    subject_line: string;
    email_body: string; // HTML
    from_email: string;
    from_name: string;
    reply_to_email: string;
    status: TransactionalEmailStatus;
    provider: EmailProvider;
    provider_message_id?: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    attachments: { name: string; url: string }[]; // JSON array
    scheduled_at?: string;
    sent_at?: string;
    delivered_at?: string;
    opened_at?: string;
    bounced_at?: string;
    bounce_reason?: string;
    error_message?: string;
    created_at: string;
}


// --- WHATSAPP MODULE ---

export enum WhatsAppMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    DOCUMENT = 'document',
    LOCATION = 'location',
    TEMPLATE = 'template',
}

export enum WhatsAppMessageStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

export enum WhatsAppProvider {
    TWILIO = 'twilio',
    WHATSAPP_BUSINESS_API = 'whatsapp_business_api',
    OTHER = 'other',
}

export interface WhatsAppMessage {
    id: number;
    recipient_phone: string;
    recipient_user_id?: number; // user.id
    recipient_customer_id?: number; // customer.id
    recipient_driver_id?: number; // driver.id
    message_type: WhatsAppMessageType;
    message_body?: string;
    media_url?: string;
    template_name?: string;
    template_variables?: Record<string, any>; // JSON
    status: WhatsAppMessageStatus;
    provider: WhatsAppProvider;
    provider_message_id?: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    failed_at?: string;
    error_message?: string;
    created_at: string;
}


// --- PUSH NOTIFICATIONS MODULE ---

export enum PushNotificationType {
    BOOKING = 'booking',
    DELIVERY = 'delivery',
    PAYMENT = 'payment',
    ALERT = 'alert',
    MARKETING = 'marketing',
}

export enum PushNotificationStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
}

export interface PushNotification {
    id: number;
    recipient_user_id: number; // user.id
    title: string;
    body: string;
    icon_url?: string;
    image_url?: string;
    action_url?: string;
    notification_type: PushNotificationType;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    device_tokens: string[]; // JSON array
    status: PushNotificationStatus;
    sent_at?: string;
    delivered_at?: string;
    error_message?: string;
    created_at: string;
}

export enum DeviceTokenType {
    IOS = 'ios',
    ANDROID = 'android',
    WEB = 'web',
}

export interface DeviceToken {
    id: number;
    user_id: number; // user.id
    device_type: DeviceTokenType;
    token: string;
    is_active: boolean;
    last_used_at: string;
    created_at: string;
}

// --- ALERTS & SYSTEM MONITORING MODULE ---

export enum SystemAlertType {
    INSURANCE_EXPIRY = 'insurance_expiry',
    LICENSE_EXPIRY = 'license_expiry',
    MAINTENANCE_DUE = 'maintenance_due',
    LOW_FUEL = 'low_fuel',
    GEOFENCE_BREACH = 'geofence_breach',
    SPEEDING = 'speeding',
    UNAUTHORIZED_STOP = 'unauthorized_stop',
    LATE_DELIVERY = 'late_delivery',
    PAYMENT_OVERDUE = 'payment_overdue',
    SYSTEM_ERROR = 'system_error',
}

export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
    EMERGENCY = 'emergency',
}

export interface SystemAlert {
    id: number;
    alert_type: SystemAlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    action_required?: string;
    action_url?: string;
    is_resolved: boolean;
    resolved_at?: string;
    resolved_by?: number; // user.id
    resolution_notes?: string;
    notified_users: number[]; // JSON array of user.id
    created_at: string;
}

export interface AlertRule {
    id: number;
    rule_name: string;
    alert_type: SystemAlertType;
    condition: Record<string, any>; // JSON
    severity: AlertSeverity;
    notify_users: (number | string)[]; // JSON array of user.id or roles
    notification_channels: ('email' | 'sms' | 'push' | 'in_app')[]; // JSON array
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// --- COMMUNICATION LOGS MODULE ---

export enum CommunicationType {
    EMAIL = 'email',
    SMS = 'sms',
    WHATSAPP = 'whatsapp',
    PUSH = 'push',
    CALL = 'call',
    IN_PERSON = 'in_person',
}

export enum CommunicationDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

export enum CommunicationPartyType {
    ADMIN = 'admin',
    CUSTOMER = 'customer',
    DRIVER = 'driver',
    SYSTEM = 'system',
}

export enum CommunicationLogStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    RECEIVED = 'received',
}

export interface CommunicationLog {
    id: number;
    communication_type: CommunicationType;
    direction: CommunicationDirection;
    sender_id?: number; // user.id
    sender_type?: CommunicationPartyType;
    recipient_id?: number; // user.id
    recipient_type?: CommunicationPartyType;
    recipient_contact: string;
    subject?: string;
    message: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    status: CommunicationLogStatus;
    metadata: Record<string, any>; // JSON
    created_at: string;
}


// --- CHAT/MESSAGING MODULE ---

export enum ConversationStatus {
    OPEN = 'open',
    PENDING = 'pending',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum ConversationChannel {
    WEB_CHAT = 'web_chat',
    WHATSAPP = 'whatsapp',
    EMAIL = 'email',
    SMS = 'sms',
    PHONE = 'phone',
}

export interface Conversation {
    id: number;
    customer_id?: number; // customer.id
    driver_id?: number; // driver.id
    assigned_to?: number; // user.id
    status: ConversationStatus;
    priority: Priority;
    subject: string;
    channel: ConversationChannel;
    related_booking_id?: number; // booking.id
    first_message_at: string;
    last_message_at: string;
    resolved_at?: string;
    closed_at?: string;
    created_at: string;
    updated_at: string;
}

export enum ChatMessageSenderType {
    ADMIN = 'admin',
    CUSTOMER = 'customer',
    DRIVER = 'driver',
    SYSTEM = 'system',
}

export enum ChatMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    SYSTEM = 'system',
}

export interface ChatMessage {
    id: number;
    conversation_id: number; // conversation.id
    sender_id?: number; // user.id
    sender_type: ChatMessageSenderType;
    message_type: ChatMessageType;
    message_body: string;
    attachments: { name: string; url: string; type: string }[]; // JSON array
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

// --- ANNOUNCEMENT/BROADCAST MODULE ---

export enum AnnouncementType {
    MAINTENANCE = 'maintenance',
    FEATURE = 'feature',
    POLICY = 'policy',
    PROMOTION = 'promotion',
    GENERAL = 'general',
}

export enum AnnouncementTargetAudience {
    ALL = 'all',
    CUSTOMERS = 'customers',
    DRIVERS = 'drivers',
    ADMINS = 'admins',
}

export enum AnnouncementDisplayLocation {
    DASHBOARD = 'dashboard',
    MODAL = 'modal',
    BANNER = 'banner',
    ALL = 'all',
}

export interface Announcement {
    id: number;
    title: string;
    content: string; // text/HTML
    announcement_type: AnnouncementType;
    target_audience: AnnouncementTargetAudience;
    priority: Priority;
    is_dismissible: boolean;
    display_location: AnnouncementDisplayLocation;
    is_active: boolean;
    start_date: string;
    end_date?: string;
    published_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface AnnouncementView {
    id: number;
    announcement_id: number; // announcement.id
    user_id: number; // user.id
    viewed_at: string;
    dismissed_at?: string;
}


// --- AUTOMATED WORKFLOWS MODULE ---

export enum WorkflowTriggerEvent {
    BOOKING_CREATED = 'booking_created',
    BOOKING_COMPLETED = 'booking_completed',
    PAYMENT_RECEIVED = 'payment_received',
    INVOICE_OVERDUE = 'invoice_overdue',
    VEHICLE_MAINTENANCE_DUE = 'vehicle_maintenance_due',
    LEAD_CREATED = 'lead_created',
    LEAD_INACTIVE_30DAYS = 'lead_inactive_30days',
    DRIVER_SPEEDING = 'driver_speeding',
}

export enum WorkflowActionType {
    SEND_EMAIL = 'send_email',
    SEND_SMS = 'send_sms',
    SEND_NOTIFICATION = 'send_notification',
    CREATE_TASK = 'create_task',
    UPDATE_STATUS = 'update_status',
    ASSIGN_USER = 'assign_user',
}

export interface WorkflowRule {
    id: number;
    rule_name: string;
    description: string;
    trigger_event: WorkflowTriggerEvent;
    conditions: Record<string, any>; // JSON
    action_type: WorkflowActionType;
    action_config: Record<string, any>; // JSON
    delay_minutes?: number;
    is_active: boolean;
    execution_count: number;
    last_executed_at?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export enum WorkflowExecutionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    SKIPPED = 'skipped',
}

export interface WorkflowExecution {
    id: number;
    workflow_rule_id: number; // workflow_rule.id
    trigger_entity_type: RelatedEntityType;
    trigger_entity_id: number;
    status: WorkflowExecutionStatus;
    result: string;
    error_message?: string;
    executed_at: string;
    created_at: string;
}

// --- SYSTEM SETTINGS, PERMISSIONS & AUDIT ---

// --- USER ROLES & PERMISSIONS ---

export enum PermissionModule {
    BOOKINGS = 'bookings',
    FLEET = 'fleet',
    FINANCE = 'finance',
    CRM = 'crm',
    USERS = 'users',
    SETTINGS = 'settings',
    REPORTS = 'reports',
}

export interface Role {
    id: number;
    role_name: string;
    role_slug: string;
    description: string;
    is_system_role: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    permission_name: string;
    permission_slug: string;
    module: PermissionModule;
    description: string;
    created_at: string;
}

export interface RolePermission {
    id: number;
    role_id: number; // role.id
    permission_id: number; // permission.id
    created_at: string;
}

export interface UserRole {
    id: number;
    user_id: number; // user.id
    role_id: number; // role.id
    assigned_by?: number; // user.id
    assigned_at: string;
}

export interface UserPermission {
    id: number;
    user_id: number; // user.id
    permission_id: number; // permission.id
    is_granted: boolean;
    assigned_by?: number; // user.id
    assigned_at: string;
}

// --- AUDIT LOGS ---

export enum AuditLogAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    EXPORT = 'export',
    IMPORT = 'import',
    APPROVE = 'approve',
    REJECT = 'reject',
    SEND = 'send',
    DOWNLOAD = 'download',
}

export enum AuditLogEntityType {
    USER = 'user',
    BOOKING = 'booking',
    VEHICLE = 'vehicle',
    DRIVER = 'driver',
    INVOICE = 'invoice',
    PAYMENT = 'payment',
    LEAD = 'lead',
    CAMPAIGN = 'campaign',
    CUSTOMER = 'customer',
    EXPENSE = 'expense',
    SETTING = 'setting',
}

export enum AuditLogStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    ERROR = 'error',
}

export interface AuditLog {
    id: number;
    user_id?: number; // user.id
    user_email: string;
    user_role: string;
    action: AuditLogAction;
    entity_type: AuditLogEntityType;
    entity_id?: number;
    entity_name: string;
    old_values: Record<string, any>; // JSON
    new_values: Record<string, any>; // JSON
    ip_address: string;
    user_agent: string;
    description: string;
    status: AuditLogStatus;
    error_message?: string;
    metadata: Record<string, any>; // JSON
    created_at: string;
}

// --- SYSTEM SETTINGS ---

export enum SettingType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    JSON = 'json',
    DATE = 'date',
}

export enum SettingCategory {
    GENERAL = 'general',
    FINANCE = 'finance',
    BOOKING = 'booking',
    FLEET = 'fleet',
    EMAIL = 'email',
    SMS = 'sms',
    SECURITY = 'security',
    INTEGRATIONS = 'integrations',
}

export interface Setting {
    id: number;
    setting_key: string;
    setting_value: string;
    setting_type: SettingType;
    category: SettingCategory;
    description: string;
    is_public: boolean;
    is_sensitive: boolean;
    updated_by?: number; // user.id
    updated_at: string;
    created_at: string;
}

// --- COMPANY/BUSINESS INFO ---

export interface CompanyProfile {
    id: number;
    company_name: string;
    trading_name?: string;
    company_registration: string;
    tax_id: string;
    logo_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    country: string;
    postal_code: string;
    phone: string;
    email: string;
    website: string;
    support_email: string;
    support_phone: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    bank_branch?: string;
    swift_code?: string;
    social_media_links: Record<string, string>; // JSON
    business_hours: Record<string, string>; // JSON
    updated_by: number; // user.id
    updated_at: string;
    created_at: string;
}

// --- API KEYS & INTEGRATIONS ---

export enum ApiKeyType {
    PUBLIC = 'public',
    PRIVATE = 'private',
    WEBHOOK = 'webhook',
}

export interface ApiKey {
    id: number;
    key_name: string;
    api_key: string;
    api_secret: string;
    key_type: ApiKeyType;
    permissions: string[]; // JSON array
    rate_limit?: number;
    created_by: number; // user.id
    is_active: boolean;
    expires_at?: string;
    last_used_at?: string;
    last_used_ip?: string;
    usage_count: number;
    created_at: string;
    updated_at: string;
}

export enum IntegrationType {
    SMS = 'sms',
    EMAIL = 'email',
    PAYMENT = 'payment',
    MAPS = 'maps',
    AI = 'ai',
    CRM = 'crm',
    ACCOUNTING = 'accounting',
    OTHER = 'other',
}

export interface Integration {
    id: number;
    integration_name: string;
    integration_type: IntegrationType;
    provider: string;
    credentials: Record<string, any>; // JSON, encrypted
    config: Record<string, any>; // JSON
    is_active: boolean;
    is_connected: boolean;
    last_sync_at?: string;
    last_error?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

// --- FILE UPLOADS & MEDIA ---

export enum UploadType {
    AVATAR = 'avatar',
    DOCUMENT = 'document',
    RECEIPT = 'receipt',
    SIGNATURE = 'signature',
    DELIVERY_PROOF = 'delivery_proof',
    OTHER = 'other',
}

export interface Upload {
    id: number;
    file_name: string;
    original_name: string;
    file_path: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    entity_type?: AuditLogEntityType;
    entity_id?: number;
    upload_type: UploadType;
    uploaded_by: number; // user.id
    is_public: boolean;
    metadata: Record<string, any>; // JSON
    created_at: string;
}

// --- ACTIVITY STREAMS ---

export enum ActivityFeedActionType {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    COMPLETED = 'completed',
    ASSIGNED = 'assigned',
    COMMENTED = 'commented',
    UPLOADED = 'uploaded',
    SENT = 'sent',
}

export enum ActivityFeedTargetType {
    BOOKING = 'booking',
    VEHICLE = 'vehicle',
    DRIVER = 'driver',
    INVOICE = 'invoice',
    PAYMENT = 'payment',
    LEAD = 'lead',
    CAMPAIGN = 'campaign',
}

export interface ActivityFeed {
    id: number;
    actor_id: number; // user.id
    actor_name: string;
    actor_avatar_url?: string;
    action_type: ActivityFeedActionType;
    target_type: ActivityFeedTargetType;
    target_id: number;
    target_name: string;
    description: string;
    metadata: Record<string, any>; // JSON
    is_important: boolean;
    created_at: string;
}

// --- TASKS & REMINDERS ---

export enum TaskType {
    FOLLOW_UP = 'follow_up',
    CALLBACK = 'callback',
    MEETING = 'meeting',
    PAYMENT_COLLECTION = 'payment_collection',
    VEHICLE_SERVICE = 'vehicle_service',
    DOCUMENT_RENEWAL = 'document_renewal',
    OTHER = 'other',
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    OVERDUE = 'overdue',
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    task_type: TaskType;
    priority: Priority;
    status: TaskStatus;
    assigned_to: number; // user.id
    created_by: number; // user.id
    related_entity_type?: RelatedEntityType;
    related_entity_id?: number;
    due_date: string;
    due_time?: string; // time
    reminder_before_minutes?: number;
    reminder_sent: boolean;
    completed_at?: string;
    completed_by?: number; // user.id
    completion_notes?: string;
    created_at: string;
    updated_at: string;
}

// --- TAGS & CATEGORIES ---

export enum TagType {
    LEAD = 'lead',
    CUSTOMER = 'customer',
    BOOKING = 'booking',
    VEHICLE = 'vehicle',
    GENERAL = 'general',
}

export interface Tag {
    id: number;
    tag_name: string;
    tag_slug: string;
    tag_color: string;
    tag_type: TagType;
    usage_count: number;
    created_by: number; // user.id
    created_at: string;
}

export enum TaggableType {
    LEAD = 'lead',
    CUSTOMER = 'customer',
    BOOKING = 'booking',
    VEHICLE = 'vehicle',
    DRIVER = 'driver',
    CAMPAIGN = 'campaign',
}

export interface Taggable {
    id: number;
    tag_id: number; // tag.id
    taggable_type: TaggableType;
    taggable_id: number;
    tagged_by: number; // user.id
    tagged_at: string;
}

// --- NOTES & COMMENTS ---

export enum NoteType {
    GENERAL = 'general',
    INTERNAL = 'internal',
    IMPORTANT = 'important',
    FOLLOW_UP = 'follow_up',
}

export enum NotableType {
    LEAD = 'lead',
    CUSTOMER = 'customer',
    BOOKING = 'booking',
    VEHICLE = 'vehicle',
    DRIVER = 'driver',
    INVOICE = 'invoice',
    OPPORTUNITY = 'opportunity',
}

export interface Note {
    id: number;
    notable_type: NotableType;
    notable_id: number;
    note_type: NoteType;
    content: string;
    is_pinned: boolean;
    is_private: boolean;
    created_by: number; // user.id
    updated_by?: number; // user.id
    created_at: string;
    updated_at: string;
}

export enum CommentableType {
    BOOKING = 'booking',
    INVOICE = 'invoice',
    TASK = 'task',
    NOTE = 'note',
    LEAD = 'lead',
}

export interface Comment {
    id: number;
    commentable_type: CommentableType;
    commentable_id: number;
    parent_comment_id?: number; // comment.id
    content: string;
    created_by: number; // user.id
    updated_by?: number; // user.id
    created_at: string;
    updated_at: string;
}

// --- BOOKMARKS/FAVORITES ---

export enum FavoritableType {
    CUSTOMER = 'customer',
    LEAD = 'lead',
    BOOKING = 'booking',
    ROUTE = 'route',
    DRIVER = 'driver',
    VEHICLE = 'vehicle',
}

export interface Favorite {
    id: number;
    user_id: number; // user.id
    favoritable_type: FavoritableType;
    favoritable_id: number;
    created_at: string;
}

// --- DATA EXPORT/IMPORT LOGS ---

export enum ExportType {
    BOOKINGS = 'bookings',
    CUSTOMERS = 'customers',
    LEADS = 'leads',
    INVOICES = 'invoices',
    VEHICLES = 'vehicles',
    FINANCIAL_REPORT = 'financial_report',
    CUSTOM = 'custom',
}

export enum ExportFormat {
    CSV = 'csv',
    XLSX = 'xlsx',
    PDF = 'pdf',
    JSON = 'json',
}

export interface ExportLog {
    id: number;
    export_type: ExportType;
    export_format: ExportFormat;
    filters_applied: Record<string, any>; // JSON
    file_name: string;
    file_url: string;
    file_size: number;
    record_count: number;
    exported_by: number; // user.id
    exported_at: string;
    expires_at?: string;
}

export enum ImportType {
    LEADS = 'leads',
    CUSTOMERS = 'customers',
    VEHICLES = 'vehicles',
    DRIVERS = 'drivers',
    BOOKINGS = 'bookings',
}

export enum ImportFormat {
    CSV = 'csv',
    XLSX = 'xlsx',
    JSON = 'json',
}

export enum ImportStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    PARTIAL = 'partial',
}

export interface ImportLog {
    id: number;
    import_type: ImportType;
    import_format: ImportFormat;
    original_file_name: string;
    file_url: string;
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    errors: Record<string, any>[]; // JSON array
    status: ImportStatus;
    imported_by: number; // user.id
    imported_at: string;
    completed_at?: string;
}

// --- SCHEDULED JOBS ---

export enum JobType {
    RECURRING = 'recurring',
    ONE_TIME = 'one_time',
}

export enum JobStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PARTIAL = 'partial',
}

export interface ScheduledJob {
    id: number;
    job_name: string;
    job_type: JobType;
    schedule: string;
    last_run_at?: string;
    last_run_status?: JobStatus;
    last_run_duration_seconds?: number;
    last_run_details?: string;
    next_run_at?: string;
    is_active: boolean;
    failure_count: number;
    max_retries: number;
    created_at: string;
    updated_at: string;
}

export enum JobExecutionStatus {
    RUNNING = 'running',
    SUCCESS = 'success',
    FAILED = 'failed',
    TIMEOUT = 'timeout',
}

export interface JobExecution {
    id: number;
    scheduled_job_id: number; // scheduled_job.id
    started_at: string;
    completed_at?: string;
    status: JobExecutionStatus;
    records_processed?: number;
    output: string;
    error_message?: string;
    duration_seconds?: number;
}

// --- SYSTEM HEALTH & MONITORING ---

export enum HealthCheckType {
    DATABASE = 'database',
    EMAIL = 'email',
    SMS = 'sms',
    API = 'api',
    STORAGE = 'storage',
    CACHE = 'cache',
    QUEUE = 'queue',
}

export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    DOWN = 'down',
}

export interface SystemHealthCheck {
    id: number;
    check_name: string;
    check_type: HealthCheckType;
    status: HealthStatus;
    response_time_ms?: number;
    details: Record<string, any>; // JSON
    error_message?: string;
    checked_at: string;
}

export interface SystemMetric {
    id: number;
    metric_name: string;
    metric_value: number; // decimal
    metric_unit: string;
    recorded_at: string;
}

// --- EMAIL/DOMAIN VERIFICATION ---

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    FAILED = 'failed',
}

export enum VerificationMethod {
    DNS = 'dns',
    EMAIL = 'email',
    FILE = 'file',
}

export interface VerifiedDomain {
    id: number;
    domain: string;
    verification_status: VerificationStatus;
    verification_token: string;
    verification_method: VerificationMethod;
    dns_records: Record<string, any>; // JSON
    verified_at?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// --- WEBHOOKS ---

export enum WebhookDeliveryStatus {
    PENDING = 'pending',
    SENT = 'sent',
    SUCCESS = 'success',
    FAILED = 'failed',
    RETRYING = 'retrying',
}

export interface Webhook {
    id: number;
    webhook_name: string;
    webhook_url: string;
    events: string[]; // JSON array
    secret_key: string;
    is_active: boolean;
    retry_attempts: number;
    timeout_seconds: number;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface WebhookDelivery {
    id: number;
    webhook_id: number; // webhook.id
    event_type: string;
    payload: Record<string, any>; // JSON
    status: WebhookDeliveryStatus;
    http_status_code?: number;
    response_body?: string;
    error_message?: string;
    attempt_count: number;
    sent_at?: string;
    created_at: string;
}

// --- ROUTES, LOCATIONS & GEOGRAPHIC DATA ---

// --- ROUTES & CORRIDORS ---
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


// --- LOCATIONS & ADDRESSES ---

export enum LocationType {
    WAREHOUSE = 'warehouse',
    DEPOT = 'depot',
    CUSTOMER_SITE = 'customer_site',
    SUPPLIER = 'supplier',
    BORDER_POST = 'border_post',
    SERVICE_CENTER = 'service_center',
    FUEL_STATION = 'fuel_station',
    PARKING_YARD = 'parking_yard',
    OFFICE = 'office',
}

export interface Location {
    id: number;
    location_name: string;
    location_type: LocationType;
    address_line1: string;
    address_line2?: string;
    city: string;
    province_state?: string;
    country: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    operating_hours: Record<string, string>; // JSON
    has_loading_dock: boolean;
    has_refrigeration: boolean;
    has_security: boolean;
    has_parking: boolean;
    parking_capacity?: number;
    access_instructions?: string;
    is_active: boolean;
    geofence_radius: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export enum CustomerLocationType {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
    BOTH = 'both',
}

export interface CustomerLocation {
    id: number;
    customer_id: number; // customer.id
    location_id?: number; // location.id
    location_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province_state?: string;
    country: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    contact_person: string;
    contact_phone: string;
    contact_email?: string;
    location_type: CustomerLocationType;
    is_default: boolean;
    access_instructions?: string;
    special_requirements?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- BORDER CROSSINGS ---

export interface BorderPost {
    id: number;
    border_name: string;
    country_from: string;
    country_to: string;
    latitude: number;
    longitude: number;
    operating_hours: Record<string, string>; // JSON
    is_24_hours: boolean;
    average_wait_time_hours?: number;
    peak_hours: { day: string; start_time: string; end_time: string }[]; // JSON
    required_documents: string[]; // JSON
    crossing_fees: { description: string; amount: number; currency: string }[]; // JSON
    has_weighbridge: boolean;
    has_customs_office: boolean;
    has_parking: boolean;
    contact_phone?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export enum BorderCrossingDirection {
    ENTRY = 'entry',
    EXIT = 'exit',
}

export interface BorderCrossingLog {
    id: number;
    booking_id: number; // booking.id
    vehicle_id: number; // vehicle.id
    driver_id: number; // driver.id
    border_post_id: number; // border_post.id
    direction: BorderCrossingDirection;
    arrival_time: string;
    departure_time?: string;
    wait_duration_minutes: number;
    fees_paid: number;
    currency: Currency | 'ZAR';
    receipt_number?: string;
    receipt_url?: string;
    customs_declaration_number?: string;
    issues_encountered?: string;
    notes?: string;
    created_at: string;
}

// --- FUEL STATIONS ---

export interface FuelStation {
    id: number;
    station_name: string;
    brand: string;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    contact_phone?: string;
    fuel_types_available: string[]; // JSON
    has_truck_facilities: boolean;
    has_parking: boolean;
    has_restrooms: boolean;
    has_shop: boolean;
    accepts_fleet_cards: boolean;
    accepted_payment_methods: string[]; // JSON
    operating_hours: Record<string, string>; // JSON
    is_24_hours: boolean;
    average_diesel_price?: number;
    price_currency: Currency;
    last_price_update?: string;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}


// --- REST STOPS & TRUCK STOPS ---

export enum RestStopType {
    REST_AREA = 'rest_area',
    TRUCK_STOP = 'truck_stop',
    SERVICE_STATION = 'service_station',
    PARKING_AREA = 'parking_area',
}

export interface RestStop {
    id: number;
    stop_name: string;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    stop_type: RestStopType;
    has_parking: boolean;
    parking_capacity?: number;
    parking_fee?: number;
    has_security: boolean;
    has_restrooms: boolean;
    has_food: boolean;
    has_accommodation: boolean;
    has_fuel: boolean;
    has_repairs: boolean;
    operating_hours?: Record<string, string>; // JSON
    is_24_hours: boolean;
    contact_phone?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- ROUTE OPTIMIZATION & PLANNING ---

export enum RouteOptimizationCriteria {
    FASTEST = 'fastest',
    SHORTEST = 'shortest',
    CHEAPEST = 'cheapest',
    AVOID_TRAFFIC = 'avoid_traffic',
    CUSTOM = 'custom',
}

export enum RoutePlanStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    DEVIATED = 'deviated',
    CANCELLED = 'cancelled',
}

export interface RoutePlan {
    id: number;
    booking_id: number; // booking.id
    vehicle_id: number; // vehicle.id
    driver_id: number; // driver.id
    planned_route_id?: number; // route.id
    origin_location_id?: number; // location.id
    origin_address: string;
    origin_latitude: number;
    origin_longitude: number;
    destination_location_id?: number; // location.id
    destination_address: string;
    destination_latitude: number;
    destination_longitude: number;
    planned_distance_km: number;
    actual_distance_km?: number;
    planned_duration_hours: number;
    actual_duration_hours?: number;
    planned_departure_time: string;
    actual_departure_time?: string;
    planned_arrival_time: string;
    actual_arrival_time?: string;
    planned_fuel_cost: number;
    actual_fuel_cost?: number;
    planned_toll_cost: number;
    actual_toll_cost?: number;
    route_geometry: string; // encoded polyline or GeoJSON
    planned_stops: { location: string; type: string; duration: number; eta: string }[]; // JSON
    optimization_criteria: RouteOptimizationCriteria;
    status: RoutePlanStatus;
    deviation_notes?: string;
    created_at: string;
    updated_at: string;
}

export enum RouteDeviationType {
    UNPLANNED_STOP = 'unplanned_stop',
    ROUTE_CHANGE = 'route_change',
    DELAY = 'delay',
    DETOUR = 'detour',
}

export interface RouteDeviation {
    id: number;
    route_plan_id: number; // route_plan.id
    booking_id: number; // booking.id
    vehicle_id: number; // vehicle.id
    deviation_type: RouteDeviationType;
    location_name: string;
    latitude: number;
    longitude: number;
    deviation_start_time: string;
    deviation_end_time?: string;
    duration_minutes: number;
    reason: string;
    additional_cost?: number;
    additional_km?: number;
    approved_by?: number; // user.id
    created_at: string;
}


// --- TRAFFIC & ROAD CONDITIONS ---

export enum TrafficIncidentType {
    ACCIDENT = 'accident',
    ROADBLOCK = 'roadblock',
    CONSTRUCTION = 'construction',
    WEATHER = 'weather',
    CONGESTION = 'congestion',
    ROAD_CLOSURE = 'road_closure',
    PROTEST = 'protest',
}

export enum TrafficIncidentSeverity {
    MINOR = 'minor',
    MODERATE = 'moderate',
    MAJOR = 'major',
    CRITICAL = 'critical',
}

export interface TrafficIncident {
    id: number;
    incident_type: TrafficIncidentType;
    location_description: string;
    city?: string;
    country: string;
    latitude: number;
    longitude: number;
    route_id?: number; // route.id
    severity: TrafficIncidentSeverity;
    reported_at: string;
    resolved_at?: string;
    estimated_delay_minutes?: number;
    description: string;
    reported_by?: number; // user.id
    reported_by_driver_id?: number; // driver.id
    alternate_route_suggested?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- GEOGRAPHIC ZONES ---

export enum ServiceZoneType {
    CITY = 'city',
    PROVINCE = 'province',
    COUNTRY = 'country',
    REGION = 'region',
    CUSTOM = 'custom',
}

export enum ServiceLevel {
    FULL = 'full',
    LIMITED = 'limited',
    NO_COVERAGE = 'no_coverage',
}

export interface ServiceZone {
    id: number;
    zone_name: string;
    zone_type: ServiceZoneType;
    countries_included: string[]; // JSON
    cities_included?: string[]; // JSON
    geometry: string; // GeoJSON polygon
    service_level: ServiceLevel;
    surcharge_percentage?: number;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export enum RestrictionType {
    NO_ENTRY = 'no_entry',
    TIME_RESTRICTION = 'time_restriction',
    WEIGHT_LIMIT = 'weight_limit',
    HEIGHT_LIMIT = 'height_limit',
    HAZMAT_PROHIBITED = 'hazmat_prohibited',
    PERMIT_REQUIRED = 'permit_required',
}

export interface RestrictedZone {
    id: number;
    zone_name: string;
    restriction_type: RestrictionType;
    location_description: string;
    city?: string;
    country: string;
    geometry: string; // GeoJSON polygon
    restriction_details: Record<string, any>; // JSON
    time_restrictions?: { days: string[]; start_time: string; end_time: string }; // JSON
    penalty_description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}


// --- DISTANCE MATRIX CACHE ---

export interface DistanceCache {
    id: number;
    origin_city: string;
    origin_country: string;
    destination_city: string;
    destination_country: string;
    distance_km: number;
    duration_hours: number;
    route_geometry?: string; // encoded polyline
    last_calculated_at: string;
    created_at: string;
}


// --- PARKING YARDS ---

export interface ParkingYard {
    id: number;
    yard_name: string;
    location_id?: number; // location.id
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    capacity: number;
    current_occupancy: number;
    has_security: boolean;
    has_wash_bay: boolean;
    has_workshop: boolean;
    has_fuel_storage: boolean;
    has_office: boolean;
    operating_hours: Record<string, string>; // JSON
    is_24_hours: boolean;
    manager_name?: string;
    manager_phone?: string;
    gate_access_code?: string;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface YardCheckIn {
    id: number;
    parking_yard_id: number; // parking_yard.id
    vehicle_id: number; // vehicle.id
    driver_id: number; // driver.id
    check_in_time: string;
    check_out_time?: string;
    check_in_odometer?: number;
    check_out_odometer?: number;
    check_in_fuel_level?: number;
    check_out_fuel_level?: number;
    damage_reported: boolean;
    damage_description?: string;
    damage_photos: string[]; // JSON
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


// --- TOLL PAYMENTS TRACKING ---

export enum TollPaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    TRANSPONDER = 'transponder',
    MOBILE_MONEY = 'mobile_money',
}

export interface TollPayment {
    id: number;
    booking_id?: number; // booking.id
    vehicle_id: number; // vehicle.id
    driver_id?: number; // driver.id
    toll_gate_name: string;
    route_id?: number; // route.id
    location: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    amount: number;
    currency: Currency | 'ZAR' | 'BWP' | 'ZMW';
    payment_method: TollPaymentMethod;
    receipt_number?: string;
    receipt_url?: string;
    paid_at: string;
    notes?: string;
    created_at: string;
}

// --- REPORTS, ANALYTICS & DASHBOARD DATA ---

// --- SAVED REPORTS ---

export enum ReportType {
    FINANCIAL = 'financial',
    OPERATIONAL = 'operational',
    FLEET = 'fleet',
    SALES = 'sales',
    CUSTOMER = 'customer',
    DRIVER = 'driver',
    CUSTOM = 'custom',
}

export enum ReportCategory {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    CUSTOM = 'custom',
}

export enum ChartType {
    TABLE = 'table',
    BAR = 'bar',
    LINE = 'line',
    PIE = 'pie',
    AREA = 'area',
    COMBO = 'combo',
    NONE = 'none',
}

export enum ScheduleFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

export interface SavedReport {
    id: number;
    report_name: string;
    report_type: ReportType;
    report_category: ReportCategory;
    filters: Record<string, any>; // JSON
    columns: string[]; // JSON array
    sorting: { column: string; direction: 'asc' | 'desc' }; // JSON
    grouping: { group_by: string; aggregate_functions: any }; // JSON
    chart_type?: ChartType;
    chart_config?: Record<string, any>; // JSON
    is_scheduled: boolean;
    schedule_frequency?: ScheduleFrequency;
    schedule_day_of_week?: number;
    schedule_day_of_month?: number;
    schedule_time?: string; // time
    recipients: (number | string)[]; // JSON array of user_ids or emails
    is_public: boolean;
    is_favorite: boolean;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
    last_generated_at?: string;
}

export enum ReportExecutionStatus {
    GENERATING = 'generating',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export interface ReportExecution {
    id: number;
    saved_report_id?: number; // saved_report.id
    report_name: string;
    report_type: ReportType;
    filters_applied: Record<string, any>; // JSON
    result_data?: Record<string, any>; // JSON
    result_file_url?: string;
    row_count: number;
    generation_time_seconds: number; // decimal
    status: ReportExecutionStatus;
    error_message?: string;
    generated_by: number; // user.id
    generated_at: string;
    expires_at?: string;
}


// --- DASHBOARD WIDGETS ---

export enum WidgetType {
    METRIC_CARD = 'metric_card',
    CHART = 'chart',
    TABLE = 'table',
    MAP = 'map',
    LIST = 'list',
    GAUGE = 'gauge',
    PROGRESS = 'progress',
    TIMELINE = 'timeline',
}

export enum WidgetCategory {
    FINANCIAL = 'financial',
    OPERATIONAL = 'operational',
    FLEET = 'fleet',
    SALES = 'sales',
    CUSTOMER = 'customer',
    ALERTS = 'alerts',
}

export enum WidgetDataSource {
    BOOKINGS = 'bookings',
    REVENUE = 'revenue',
    EXPENSES = 'expenses',
    VEHICLES = 'vehicles',
    DRIVERS = 'drivers',
    LEADS = 'leads',
    CAMPAIGNS = 'campaigns',
    CUSTOM_QUERY = 'custom_query',
}

export enum WidgetSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
    FULL_WIDTH = 'full_width',
}

export interface DashboardWidget {
    id: number;
    widget_name: string;
    widget_type: WidgetType;
    widget_category: WidgetCategory;
    data_source: WidgetDataSource;
    data_query: Record<string, any>; // JSON
    refresh_interval_seconds?: number;
    chart_config?: Record<string, any>; // JSON
    size: WidgetSize;
    is_default: boolean;
    required_permission?: string;
    created_at: string;
    updated_at: string;
}

export interface UserDashboard {
    id: number;
    user_id: number; // user.id
    dashboard_name: string;
    is_default: boolean;
    layout: Record<string, any>; // JSON
    widgets: number[]; // JSON array of widget IDs
    created_at: string;
    updated_at: string;
}


// --- KPI TRACKING ---

export enum KpiCategory {
    FINANCIAL = 'financial',
    OPERATIONAL = 'operational',
    CUSTOMER = 'customer',
    FLEET = 'fleet',
    SALES = 'sales',
    DRIVER = 'driver',
}

export enum KpiComparisonType {
    GREATER_IS_BETTER = 'greater_is_better',
    LOWER_IS_BETTER = 'lower_is_better',
    TARGET_IS_BEST = 'target_is_best',
}

export interface Kpi {
    id: number;
    kpi_name: string;
    kpi_code: string;
    kpi_category: KpiCategory;
    measurement_unit: string;
    calculation_method: string;
    data_sources: string[]; // JSON array
    target_value?: number; // decimal
    warning_threshold?: number; // decimal
    critical_threshold?: number; // decimal
    comparison_type: KpiComparisonType;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export enum KpiPeriodType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
}

export enum KpiStatus {
    ON_TARGET = 'on_target',
    WARNING = 'warning',
    CRITICAL = 'critical',
    EXCELLENT = 'excellent',
}

export interface KpiValue {
    id: number;
    kpi_id: number; // kpi.id
    period_type: KpiPeriodType;
    period_start: string; // date
    period_end: string; // date
    actual_value: number; // decimal
    target_value?: number; // decimal
    variance: number; // decimal
    variance_percentage: number; // decimal
    status: KpiStatus;
    notes?: string;
    calculated_at: string;
    created_at: string;
}


// --- BUSINESS METRICS SNAPSHOTS ---

export interface DailyMetrics {
    id: number;
    metric_date: string; // date
    bookings_total: number;
    bookings_pending: number;
    bookings_in_transit: number;
    bookings_completed: number;
    bookings_cancelled: number;
    revenue_total: number; // decimal
    revenue_usd: number; // decimal
    revenue_zwl: number; // decimal
    revenue_zig: number; // decimal
    expenses_total: number; // decimal
    net_profit: number; // decimal
    profit_margin: number; // decimal
    invoices_sent: number;
    invoices_paid: number;
    payments_received: number; // decimal
    vehicles_active: number;
    vehicles_in_maintenance: number;
    vehicles_available: number;
    km_travelled_total: number;
    fuel_consumed_litres: number; // decimal
    fuel_cost_total: number; // decimal
    average_fuel_efficiency: number; // decimal
    deliveries_on_time: number;
    deliveries_late: number;
    on_time_percentage: number; // decimal
    drivers_active: number;
    drivers_available: number;
    new_customers: number;
    repeat_customers: number;
    leads_created: number;
    leads_converted: number;
    opportunities_won: number;
    campaigns_sent: number;
    emails_sent: number;
    emails_opened: number;
    maintenance_alerts: number;
    insurance_expiry_alerts: number;
    calculated_at: string;
    created_at: string;
}

export interface MonthlyMetrics {
    id: number;
    metric_year: number;
    metric_month: number;
    period_start: string; // date
    period_end: string; // date
    bookings_total: number;
    revenue_total: number; // decimal
    expenses_total: number; // decimal
    net_profit: number; // decimal
    profit_margin: number; // decimal
    km_travelled_total: number;
    fuel_cost_total: number; // decimal
    vehicles_added: number;
    vehicles_retired: number;
    drivers_hired: number;
    drivers_terminated: number;
    new_customers: number;
    lost_customers: number;
    customer_retention_rate: number; // decimal
    average_booking_value: number; // decimal
    average_delivery_time_hours: number; // decimal
    leads_created: number;
    leads_converted: number;
    conversion_rate: number; // decimal
    calculated_at: string;
    created_at: string;
}


// --- CUSTOMER ANALYTICS ---

export enum CustomerMetricPeriodType {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    LIFETIME = 'lifetime',
}

export enum CustomerRiskLevel {
    NONE = 'none',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export interface CustomerMetrics {
    id: number;
    customer_id: number; // customer.id
    period_type: CustomerMetricPeriodType;
    period_start: string; // date
    period_end?: string; // date
    total_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number; // decimal
    total_paid: number; // decimal
    outstanding_balance: number; // decimal
    average_booking_value: number; // decimal
    largest_booking_value: number; // decimal
    loyalty_points_earned: number;
    loyalty_points_redeemed: number;
    current_tier: string;
    last_booking_date?: string;
    days_since_last_booking?: number;
    booking_frequency_days: number; // decimal
    most_used_route?: string;
    unique_routes_used: number;
    on_time_deliveries: number;
    late_deliveries: number;
    on_time_percentage: number; // decimal
    is_active: boolean;
    risk_level: CustomerRiskLevel;
    calculated_at: string;
    created_at: string;
}


// --- FLEET ANALYTICS ---

export enum VehicleMetricPeriodType {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    LIFETIME = 'lifetime',
}

export interface VehicleMetrics {
    id: number;
    vehicle_id: number; // vehicle.id
    period_type: VehicleMetricPeriodType;
    period_start: string; // date
    period_end?: string; // date
    total_trips: number;
    total_km: number;
    total_hours_driven: number; // decimal
    utilization_rate: number; // decimal
    revenue_generated: number; // decimal
    expenses_total: number; // decimal
    fuel_cost: number; // decimal
    maintenance_cost: number; // decimal
    profit: number; // decimal
    profit_margin: number; // decimal
    revenue_per_km: number; // decimal
    cost_per_km: number; // decimal
    fuel_consumed_litres: number; // decimal
    fuel_efficiency: number; // decimal
    maintenance_events: number;
    downtime_days: number;
    downtime_percentage: number; // decimal
    average_speed: number; // decimal
    speeding_incidents: number;
    harsh_braking_incidents: number;
    on_time_deliveries: number;
    late_deliveries: number;
    current_km: number;
    km_since_last_service: number;
    days_until_insurance_expiry?: number;
    calculated_at: string;
    created_at: string;
}


// --- DRIVER ANALYTICS ---

export enum DriverMetricPeriodType {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    LIFETIME = 'lifetime',
}

export interface DriverMetrics {
    id: number;
    driver_id: number; // driver.id
    period_type: DriverMetricPeriodType;
    period_start: string; // date
    period_end?: string; // date
    total_trips: number;
    completed_trips: number;
    total_km: number;
    total_hours_driven: number; // decimal
    on_time_deliveries: number;
    late_deliveries: number;
    on_time_percentage: number; // decimal
    accidents: number;
    speeding_incidents: number;
    harsh_braking_incidents: number;
    safety_score: number; // decimal
    fuel_efficiency: number; // decimal
    idle_time_hours: number; // decimal
    revenue_generated: number; // decimal
    average_revenue_per_trip: number; // decimal
    customer_rating?: number; // decimal
    total_ratings: number;
    complaints_received: number;
    compliments_received: number;
    days_worked: number;
    days_absent: number;
    punctuality_score: number; // decimal
    calculated_at: string;
    created_at: string;
}


// --- ROUTE ANALYTICS ---
export enum RouteAnalyticPeriodType {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
}

export interface RouteAnalytics {
    id: number;
    route_id: number; // route.id
    period_type: RouteAnalyticPeriodType;
    period_start: string; // date
    period_end: string; // date
    total_trips: number;
    total_revenue: number; // decimal
    total_cost: number; // decimal
    total_profit: number; // decimal
    profit_margin: number; // decimal
    average_duration_hours: number; // decimal
    shortest_trip_hours: number; // decimal
    longest_trip_hours: number; // decimal
    total_fuel_cost: number; // decimal
    average_fuel_cost_per_trip: number; // decimal
    total_toll_cost: number; // decimal
    on_time_trips: number;
    late_trips: number;
    on_time_percentage: number; // decimal
    incidents_reported: number;
    most_used_vehicle_id?: number; // vehicle.id
    most_used_driver_id?: number; // driver.id
    calculated_at: string;
    created_at: string;
}


// --- CAMPAIGN ANALYTICS ---

export interface CampaignAnalytics {
    id: number;
    campaign_id: number; // campaign.id
    snapshot_date: string; // date
    total_leads: number;
    active_leads: number;
    completed_leads: number;
    unsubscribed_leads: number;
    emails_sent: number;
    emails_delivered: number;
    emails_bounced: number;
    emails_opened: number;
    unique_opens: number;
    open_rate: number; // decimal
    emails_clicked: number;
    unique_clicks: number;
    click_rate: number; // decimal
    click_to_open_rate: number; // decimal
    emails_replied: number;
    reply_rate: number; // decimal
    leads_converted: number;
    conversion_rate: number; // decimal
    opportunities_created: number;
    deals_won: number;
    revenue_generated?: number; // decimal
    best_performing_sequence_id?: number; // email_sequence.id
    best_performing_subject_line?: string;
    best_send_time?: string; // time
    best_send_day?: string;
    calculated_at: string;
    created_at: string;
}


// --- FINANCIAL SUMMARIES ---

export enum SummaryType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
}

export interface FinancialSummary {
    id: number;
    summary_type: SummaryType;
    period_start: string; // date
    period_end: string; // date
    revenue_bookings: number; // decimal
    revenue_other: number; // decimal
    total_revenue: number; // decimal
    expenses_fuel: number; // decimal
    expenses_maintenance: number; // decimal
    expenses_salaries: number; // decimal
    expenses_insurance: number; // decimal
    expenses_licenses: number; // decimal
    expenses_tolls: number; // decimal
    expenses_other: number; // decimal
    total_expenses: number; // decimal
    gross_profit: number; // decimal
    net_profit: number; // decimal
    profit_margin: number; // decimal
    cash_inflow: number; // decimal
    cash_outflow: number; // decimal
    net_cash_flow: number; // decimal
    invoices_issued: number;
    invoices_issued_value: number; // decimal
    invoices_paid: number;
    invoices_paid_value: number; // decimal
    outstanding_invoices_value: number; // decimal
    overdue_invoices_value: number; // decimal
    revenue_usd: number; // decimal
    revenue_zwl: number; // decimal
    revenue_zig: number; // decimal
    total_bookings: number;
    average_booking_value: number; // decimal
    revenue_growth: number; // decimal
    profit_growth: number; // decimal
    calculated_at: string;
    created_at: string;
}


// --- OPERATIONAL ANALYTICS ---

export interface OperationalMetrics {
    id: number;
    metric_date: string; // date
    total_vehicles: number;
    vehicles_active: number;
    vehicles_idle: number;
    vehicles_maintenance: number;
    fleet_utilization_rate: number; // decimal
    bookings_total: number;
    bookings_completed: number;
    bookings_in_progress: number;
    bookings_pending: number;
    bookings_cancelled: number;
    completion_rate: number; // decimal
    cancellation_rate: number; // decimal
    deliveries_on_time: number;
    deliveries_late: number;
    on_time_delivery_rate: number; // decimal
    average_delivery_time_hours: number; // decimal
    total_drivers: number;
    drivers_active: number;
    drivers_available: number;
    driver_utilization_rate: number; // decimal
    total_km_travelled: number;
    average_km_per_booking: number; // decimal
    fuel_consumed_litres: number; // decimal
    average_fuel_efficiency: number; // decimal
    fuel_cost_per_km: number; // decimal
    accidents: number;
    breakdowns: number;
    delays: number;
    calculated_at: string;
    created_at: string;
}


// --- COMPARATIVE ANALYTICS ---

export enum ComparisonType {
    MONTH_OVER_MONTH = 'month_over_month',
    QUARTER_OVER_QUARTER = 'quarter_over_quarter',
    YEAR_OVER_YEAR = 'year_over_year',
    CUSTOM = 'custom',
}

export enum ComparisonTrend {
    UP = 'up',
    DOWN = 'down',
    STABLE = 'stable',
}

export interface PeriodComparison {
    id: number;
    comparison_type: ComparisonType;
    metric_name: string;
    metric_category: 'revenue' | 'bookings' | 'customers' | 'fleet' | 'drivers' | 'profit';
    current_period_start: string; // date
    current_period_end: string; // date
    current_value: number; // decimal
    previous_period_start: string; // date
    previous_period_end: string; // date
    previous_value: number; // decimal
    absolute_change: number; // decimal
    percentage_change: number; // decimal
    trend: ComparisonTrend;
    calculated_at: string;
    created_at: string;
}


// --- PREDICTIVE ANALYTICS ---

export enum ForecastType {
    REVENUE = 'revenue',
    BOOKINGS = 'bookings',
    EXPENSES = 'expenses',
    PROFIT = 'profit',
    DEMAND = 'demand',
}

export enum ForecastPeriod {
    NEXT_WEEK = 'next_week',
    NEXT_MONTH = 'next_month',
    NEXT_QUARTER = 'next_quarter',
    NEXT_YEAR = 'next_year',
}

export interface Forecast {
    id: number;
    forecast_type: ForecastType;
    forecast_period: ForecastPeriod;
    forecast_date: string; // date
    predicted_value: number; // decimal
    confidence_level: number; // decimal
    lower_bound: number; // decimal
    upper_bound: number; // decimal
    model_used: string;
    actual_value?: number; // decimal
    accuracy?: number; // decimal
    generated_at: string;
    created_at: string;
}


// --- BENCHMARK COMPARISONS ---

export enum BenchmarkCategory {
    OPERATIONAL = 'operational',
    FINANCIAL = 'financial',
    CUSTOMER_SERVICE = 'customer_service',
    SAFETY = 'safety',
}

export enum BenchmarkComparisonStatus {
    ABOVE_AVERAGE = 'above_average',
    AVERAGE = 'average',
    BELOW_AVERAGE = 'below_average',
    TOP_PERFORMER = 'top_performer',
}

export interface IndustryBenchmark {
    id: number;
    benchmark_name: string;
    benchmark_category: BenchmarkCategory;
    industry_average: number; // decimal
    top_quartile: number; // decimal
    bottom_quartile: number; // decimal
    measurement_unit: string;
    our_value: number; // decimal
    our_percentile: number; // decimal
    comparison_status: BenchmarkComparisonStatus;
    data_source: string;
    period_start: string; // date
    period_end: string; // date
    notes?: string;
    updated_at: string;
    created_at: string;
}


// --- CUSTOM REPORTS DATA STORE ---

export interface ReportDataCache {
    id: number;
    cache_key: string;
    report_config: Record<string, any>; // JSON
    result_data: Record<string, any>; // JSON
    row_count: number;
    generated_at: string;
    expires_at: string;
}


// --- ALERT THRESHOLDS ---

export enum ThresholdType {
    MINIMUM = 'minimum',
    MAXIMUM = 'maximum',
    RANGE = 'range',
}

export enum AlertFrequency {
    IMMEDIATE = 'immediate',
    DAILY_DIGEST = 'daily_digest',
    WEEKLY_DIGEST = 'weekly_digest',
}

export enum ComparisonOperator {
    LESS_THAN = 'less_than',
    GREATER_THAN = 'greater_than',
    EQUALS = 'equals',
    BETWEEN = 'between',
}

export interface MetricThreshold {
    id: number;
    metric_name: string;
    threshold_type: ThresholdType;
    warning_value: number; // decimal
    critical_value: number; // decimal
    target_value?: number; // decimal
    comparison_operator: ComparisonOperator;
    alert_enabled: boolean;
    alert_frequency: AlertFrequency;
    notify_users: number[]; // JSON array
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// --- MARKETING HUB SCHEMA ---

// --- LEAD SOURCES & ATTRIBUTION ---

export enum LeadSourceType {
    WEBSITE = 'website',
    SOCIAL_MEDIA = 'social_media',
    REFERRAL = 'referral',
    EVENT = 'event',
    COLD_OUTREACH = 'cold_outreach',
    PARTNER = 'partner',
    ADVERTISEMENT = 'advertisement',
    DIRECT = 'direct',
    OTHER = 'other',
}

export enum LeadSourceCategory {
    ORGANIC = 'organic',
    PAID = 'paid',
    REFERRAL = 'referral',
    DIRECT = 'direct',
}

export enum AttributionModel {
    FIRST_TOUCH = 'first_touch',
    LAST_TOUCH = 'last_touch',
    MULTI_TOUCH = 'multi_touch',
    LINEAR = 'linear',
}

// FIX: Renamed interface from LeadSource to LeadSourceRecord to resolve name conflict with the enum.
export interface LeadSourceRecord {
    id: number;
    source_name: string;
    source_type: LeadSourceType;
    source_category: LeadSourceCategory;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    cost_per_lead?: number; // decimal
    is_active: boolean;
    total_leads: number;
    total_conversions: number;
    conversion_rate: number; // decimal
    created_at: string;
    updated_at: string;
}

export interface LeadAttribution {
    id: number;
    lead_id: number; // lead.id
    first_touch_source_id: number; // lead_source.id
    first_touch_date: string;
    last_touch_source_id: number; // lead_source.id
    last_touch_date: string;
    all_touchpoints: { source_id: number; timestamp: string; page_url: string }[]; // JSON array
    attribution_model: AttributionModel;
    created_at: string;
}


// --- LEAD ENRICHMENT ---

export enum PhoneType {
    MOBILE = 'mobile',
    LANDLINE = 'landline',
    VOIP = 'voip',
    UNKNOWN = 'unknown',
}

export enum EnrichmentSource {
    CLEARBIT = 'clearbit',
    HUNTER = 'hunter',
    ZOOMINFO = 'zoominfo',
    MANUAL = 'manual',
    LINKEDIN = 'linkedin',
    OTHER = 'other',
}

export interface LeadEnrichmentData {
    id: number;
    lead_id: number; // lead.id
    company_domain?: string;
    company_linkedin?: string;
    company_size_employees?: number;
    company_revenue_range?: string;
    company_founded_year?: number;
    company_technologies?: string[]; // JSON array
    linkedin_url?: string;
    twitter_handle?: string;
    facebook_url?: string;
    email_verified: boolean;
    email_verification_date?: string;
    phone_verified: boolean;
    phone_type?: PhoneType;
    website_visits: number;
    last_website_visit?: string;
    pages_viewed: string[]; // JSON array
    email_engagement_score: number;
    enrichment_source: EnrichmentSource;
    enriched_at?: string;
    raw_data: Record<string, any>; // JSON
    created_at: string;
    updated_at: string;
}


// --- LEAD SEGMENTATION ---

export enum SegmentType {
    DYNAMIC = 'dynamic',
    STATIC = 'static',
}

export interface Segment {
    id: number;
    segment_name: string;
    segment_type: SegmentType;
    filters: Record<string, any>; // JSON
    description: string;
    lead_count: number;
    last_calculated_at?: string;
    is_active: boolean;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface SegmentMember {
    id: number;
    segment_id: number; // segment.id
    lead_id: number; // lead.id
    added_at: string;
    added_by?: number; // user.id
    is_active: boolean;
}


// --- EMAIL WARMUP ---

export enum EmailAccountProvider {
    SMTP = 'smtp',
    GMAIL = 'gmail',
    OUTLOOK = 'outlook',
    ZOHO = 'zoho',
    CUSTOM = 'custom',
}

export enum EmailWarmupStatus {
    NEW = 'new',
    WARMING = 'warming',
    WARMED = 'warmed',
    INACTIVE = 'inactive',
}

export interface EmailAccount {
    id: number;
    email_address: string;
    email_password?: string; // encrypted
    provider: EmailAccountProvider;
    smtp_host?: string;
    smtp_port?: number;
    smtp_username?: string;
    daily_send_limit: number;
    current_daily_sent: number;
    warmup_status: EmailWarmupStatus;
    warmup_start_date?: string;
    warmup_current_daily_limit: number;
    reputation_score: number; // decimal
    spam_rate: number; // decimal
    bounce_rate: number; // decimal
    is_verified: boolean;
    is_active: boolean;
    last_used_at?: string;
    created_at: string;
    updated_at: string;
}

export interface EmailWarmupSchedule {
    id: number;
    email_account_id: number; // email_account.id
    day_number: number;
    planned_sends: number;
    actual_sends: number;
    opens: number;
    clicks: number;
    replies: number;
    bounces: number;
    spam_complaints: number;
    warmup_date: string; // date
    created_at: string;
}


// --- LINKEDIN INTEGRATION ---

export enum LinkedInConnectionStatus {
    NOT_CONNECTED = 'not_connected',
    PENDING = 'pending',
    CONNECTED = 'connected',
    MESSAGE_SENT = 'message_sent',
    REPLIED = 'replied',
}

export enum LinkedInCampaignStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
}

export interface LinkedInAccount {
    id: number;
    user_id: number; // user.id
    linkedin_email: string;
    linkedin_password?: string; // encrypted
    connection_limit_daily: number;
    message_limit_daily: number;
    current_daily_connections: number;
    current_daily_messages: number;
    is_active: boolean;
    last_used_at?: string;
    created_at: string;
    updated_at: string;
}

export interface LinkedInProspect {
    id: number;
    lead_id?: number; // lead.id
    linkedin_url: string;
    full_name: string;
    headline: string;
    company_name: string;
    location: string;
    connection_status: LinkedInConnectionStatus;
    connection_request_sent_at?: string;
    connection_accepted_at?: string;
    message_sent_at?: string;
    last_message_at?: string;
    notes?: string;
    scraped_at: string;
    created_at: string;
    updated_at: string;
}

export interface LinkedInCampaign {
    id: number;
    campaign_name: string;
    linkedin_account_id: number; // linkedin_account.id
    target_criteria: Record<string, any>; // JSON
    connection_message_template: string;
    follow_up_message_template: string;
    daily_connection_limit: number;
    status: LinkedInCampaignStatus;
    total_prospects: number;
    connections_sent: number;
    connections_accepted: number;
    messages_sent: number;
    replies_received: number;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}


// --- CONTENT LIBRARY ---

export enum AssetType {
    CASE_STUDY = 'case_study',
    WHITEPAPER = 'whitepaper',
    EBOOK = 'ebook',
    INFOGRAPHIC = 'infographic',
    VIDEO = 'video',
    PRESENTATION = 'presentation',
    ONE_PAGER = 'one_pager',
    BROCHURE = 'brochure',
    PROPOSAL_TEMPLATE = 'proposal_template',
}

export interface ContentAsset {
    id: number;
    asset_name: string;
    asset_type: AssetType;
    description: string;
    file_url: string;
    thumbnail_url?: string;
    file_size: number;
    file_format: string;
    tags: string[]; // JSON array
    use_cases: string[]; // JSON array
    download_count: number;
    view_count: number;
    is_public: boolean;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface ContentShare {
    id: number;
    content_asset_id: number; // content_asset.id
    shared_with_lead_id?: number; // lead.id
    shared_with_customer_id?: number; // customer.id
    shared_via_email?: string;
    share_link: string;
    viewed: boolean;
    first_viewed_at?: string;
    view_count: number;
    downloaded: boolean;
    download_count: number;
    shared_by: number; // user.id
    shared_at: string;
    expires_at?: string;
}


// --- LANDING PAGES ---

export enum LandingPageTemplateType {
    QUOTE_REQUEST = 'quote_request',
    CONSULTATION = 'consultation',
    EBOOK_DOWNLOAD = 'ebook_download',
    CASE_STUDY = 'case_study',
    CONTACT = 'contact',
    CUSTOM = 'custom',
}

export enum LandingPageStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

export interface LandingPage {
    id: number;
    page_name: string;
    page_slug: string;
    page_title: string;
    meta_description: string;
    template_type: LandingPageTemplateType;
    hero_headline: string;
    hero_subheadline?: string;
    hero_image_url?: string;
    hero_cta_text: string;
    sections: Record<string, any>[]; // JSON array
    form_fields: Record<string, any>[]; // JSON array
    thank_you_message: string;
    redirect_url?: string;
    campaign_id?: number; // campaign.id
    utm_parameters: Record<string, any>; // JSON
    views: number;
    form_submissions: number;
    conversion_rate: number; // decimal
    status: LandingPageStatus;
    published_at?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface LandingPageSubmission {
    id: number;
    landing_page_id: number; // landing_page.id
    form_data: Record<string, any>; // JSON
    lead_id?: number; // lead.id
    ip_address: string;
    user_agent: string;
    referrer_url?: string;
    submitted_at: string;
}


// --- EMAIL VERIFICATION ---

export enum EmailVerificationStatus {
    VALID = 'valid',
    INVALID = 'invalid',
    RISKY = 'risky',
    UNKNOWN = 'unknown',
    CATCH_ALL = 'catch_all',
    DISPOSABLE = 'disposable',
}

export enum EmailVerificationProvider {
    HUNTER = 'hunter',
    ZEROBOUNCE = 'zerobounce',
    NEVERBOUNCE = 'neverbounce',
    MANUAL = 'manual',
}

export interface EmailVerification {
    id: number;
    email_address: string;
    verification_status: EmailVerificationStatus;
    is_deliverable: boolean;
    is_smtp_valid: boolean;
    is_syntax_valid: boolean;
    is_disposable: boolean;
    is_role_account: boolean;
    is_free_provider: boolean;
    mx_records_found: boolean;
    verification_provider: EmailVerificationProvider;
    confidence_score: number;
    verified_at: string;
    created_at: string;
}


// --- A/B TESTING ---

export enum ABTestType {
    SUBJECT_LINE = 'subject_line',
    EMAIL_BODY = 'email_body',
    SEND_TIME = 'send_time',
    FROM_NAME = 'from_name',
    LANDING_PAGE = 'landing_page',
}

export enum ABTestWinningVariant {
    A = 'a',
    B = 'b',
    TIE = 'tie',
    INCONCLUSIVE = 'inconclusive',
}

export enum ABTestStatus {
    DRAFT = 'draft',
    RUNNING = 'running',
    COMPLETED = 'completed',
    STOPPED = 'stopped',
}

export interface ABTest {
    id: number;
    test_name: string;
    test_type: ABTestType;
    campaign_id?: number; // campaign.id
    sequence_id?: number; // email_sequence.id
    landing_page_id?: number; // landing_page.id
    variant_a: Record<string, any>; // JSON
    variant_b: Record<string, any>; // JSON
    split_percentage: number;
    variant_a_sends: number;
    variant_a_opens: number;
    variant_a_clicks: number;
    variant_a_conversions: number;
    variant_b_sends: number;
    variant_b_opens: number;
    variant_b_clicks: number;
    variant_b_conversions: number;
    winning_variant?: ABTestWinningVariant;
    status: ABTestStatus;
    started_at?: string;
    completed_at?: string;
    created_by: number; // user.id
    created_at: string;
}


// --- SALES SEQUENCES ---

export enum SalesSequenceType {
    COLD_OUTREACH = 'cold_outreach',
    FOLLOW_UP = 'follow_up',
    NURTURE = 'nurture',
    REACTIVATION = 'reactivation',
}

export enum SequenceStepType {
    EMAIL = 'email',
    LINKEDIN_CONNECTION = 'linkedin_connection',
    LINKEDIN_MESSAGE = 'linkedin_message',
    CALL = 'call',
    SMS = 'sms',
    MANUAL_TASK = 'manual_task',
    WHATSAPP = 'whatsapp',
}

export enum SequenceExecuteCondition {
    ALWAYS = 'always',
    IF_OPENED = 'if_opened',
    IF_CLICKED = 'if_clicked',
    IF_NOT_REPLIED = 'if_not_replied',
    IF_REPLIED = 'if_replied',
}

export enum SequenceEnrollmentStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    BOUNCED = 'bounced',
    REPLIED = 'replied',
    UNSUBSCRIBED = 'unsubscribed',
}

export enum SequenceStepExecutionStatus {
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    COMPLETED = 'completed',
    SKIPPED = 'skipped',
    FAILED = 'failed',
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

export interface SequenceStep {
    id: number;
    sales_sequence_id: number; // sales_sequence.id
    step_number: number;
    step_name: string;
    step_type: SequenceStepType;
    delay_days: number;
    delay_hours: number;
    email_template_id?: number; // email_template.id
    subject_line?: string;
    email_body?: string;
    linkedin_message?: string;
    task_instructions?: string;
    execute_if: SequenceExecuteCondition;
    created_at: string;
    updated_at: string;
}

export interface SequenceEnrollment {
    id: number;
    sales_sequence_id: number; // sales_sequence.id
    lead_id: number; // lead.id
    status: SequenceEnrollmentStatus;
    current_step: number;
    enrolled_at: string;
    completed_at?: string;
    enrolled_by: number; // user.id
}

export interface SequenceStepExecution {
    id: number;
    sequence_enrollment_id: number; // sequence_enrollment.id
    sequence_step_id: number; // sequence_step.id
    lead_id: number; // lead.id
    status: SequenceStepExecutionStatus;
    scheduled_for: string;
    executed_at?: string;
    email_opened?: boolean;
    email_clicked?: boolean;
    replied?: boolean;
    task_completed?: boolean;
    task_notes?: string;
    error_message?: string;
    created_at: string;
}


// --- INTENT SIGNALS ---

export enum IntentSignalType {
    WEBSITE_VISIT = 'website_visit',
    PRICING_PAGE_VIEW = 'pricing_page_view',
    CALCULATOR_USE = 'calculator_use',
    EMAIL_OPENED = 'email_opened',
    EMAIL_CLICKED = 'email_clicked',
    CONTENT_DOWNLOAD = 'content_download',
    DEMO_REQUEST = 'demo_request',
    QUOTE_REQUEST = 'quote_request',
    SOCIAL_ENGAGEMENT = 'social_engagement',
    JOB_CHANGE = 'job_change',
}

export enum IntentSignalStrength {
    WEAK = 'weak',
    MEDIUM = 'medium',
    STRONG = 'strong',
    VERY_STRONG = 'very_strong',
}

export interface IntentSignal {
    id: number;
    lead_id?: number; // lead.id
    customer_id?: number; // customer.id
    signal_type: IntentSignalType;
    signal_strength: IntentSignalStrength;
    signal_score: number;
    description: string;
    metadata: Record<string, any>; // JSON
    detected_at: string;
    created_at: string;
}


// --- COMPETITOR TRACKING ---

export enum CompetitorPricingModel {
    PER_KM = 'per_km',
    PER_TONNE = 'per_tonne',
    FLAT_RATE = 'flat_rate',
    CUSTOM = 'custom',
    UNKNOWN = 'unknown',
}

export enum CompetitorMarketPosition {
    PREMIUM = 'premium',
    MID_RANGE = 'mid_range',
    BUDGET = 'budget',
    NICHE = 'niche',
}

export enum CompetitiveIntelligenceType {
    PRICING_CHANGE = 'pricing_change',
    NEW_SERVICE = 'new_service',
    CLIENT_WON = 'client_won',
    CLIENT_LOST = 'client_lost',
    PARTNERSHIP = 'partnership',
    EXPANSION = 'expansion',
    OTHER = 'other',
}

export enum CompetitiveImpactLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export interface Competitor {
    id: number;
    company_name: string;
    website: string;
    services_offered: string[]; // JSON array
    pricing_model: CompetitorPricingModel;
    estimated_pricing?: string;
    fleet_size?: number;
    coverage_area: string[]; // JSON array
    strengths: string;
    weaknesses: string;
    differentiators: string;
    market_position: CompetitorMarketPosition;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CompetitiveIntelligence {
    id: number;
    competitor_id: number; // competitor.id
    intelligence_type: CompetitiveIntelligenceType;
    title: string;
    description: string;
    source: string;
    source_url?: string;
    impact_level: CompetitiveImpactLevel;
    action_items: string;
    recorded_by: number; // user.id
    recorded_at: string;
    created_at: string;
}


// --- REFERRAL PROGRAM ---

export enum ReferralRewardType {
    DISCOUNT = 'discount',
    CASH = 'cash',
    LOYALTY_POINTS = 'loyalty_points',
    FREE_SERVICE = 'free_service',
}

export enum ReferralRewardCurrency {
    USD = 'USD',
    ZWL = 'ZWL',
    ZIG = 'ZIG',
    POINTS = 'points',
}

export enum ReferralStatus {
    SENT = 'sent',
    CLICKED = 'clicked',
    SIGNED_UP = 'signed_up',
    CONVERTED = 'converted',
    REWARDED = 'rewarded',
    EXPIRED = 'expired',
}

export interface ReferralProgram {
    id: number;
    program_name: string;
    reward_type: ReferralRewardType;
    referrer_reward_amount: number; // decimal
    referee_reward_amount: number; // decimal
    reward_currency: ReferralRewardCurrency;
    minimum_booking_value?: number; // decimal
    terms_and_conditions: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Referral {
    id: number;
    referral_program_id: number; // referral_program.id
    referrer_customer_id: number; // customer.id
    referee_name: string;
    referee_email: string;
    referee_phone: string;
    referee_lead_id?: number; // lead.id
    referee_customer_id?: number; // customer.id
    status: ReferralStatus;
    referral_code: string;
    referral_link: string;
    clicked_at?: string;
    signed_up_at?: string;
    converted_at?: string;
    first_booking_id?: number; // booking.id
    referrer_reward_issued: boolean;
    referee_reward_issued: boolean;
    created_at: string;
    expires_at?: string;
}


// --- MARKETING AUTOMATION WORKFLOWS ---

export enum AutomationWorkflowTriggerType {
    LEAD_CREATED = 'lead_created',
    FORM_SUBMITTED = 'form_submitted',
    EMAIL_OPENED = 'email_opened',
    LINK_CLICKED = 'link_clicked',
    BOOKING_COMPLETED = 'booking_completed',
    QUOTE_REQUESTED = 'quote_requested',
    TIME_BASED = 'time_based',
    MANUAL = 'manual',
}

export enum AutomationWorkflowStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    PAUSED = 'paused',
    ARCHIVED = 'archived',
}

export enum WorkflowEnrollmentStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
    EXITED = 'exited',
}

export enum WorkflowStepLogStatus {
    PENDING = 'pending',
    EXECUTING = 'executing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    SKIPPED = 'skipped',
}

export interface AutomationWorkflow {
    id: number;
    workflow_name: string;
    trigger_type: AutomationWorkflowTriggerType;
    trigger_config: Record<string, any>; // JSON
    workflow_steps: Record<string, any>[]; // JSON array
    status: AutomationWorkflowStatus;
    enrollment_count: number;
    completion_count: number;
    is_active: boolean;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}

export interface WorkflowEnrollment {
    id: number;
    automation_workflow_id: number; // automation_workflow.id
    lead_id?: number; // lead.id
    customer_id?: number; // customer.id
    status: WorkflowEnrollmentStatus;
    current_step_index: number;
    enrolled_at: string;
    completed_at?: string;
    context_data: Record<string, any>; // JSON
}

export interface WorkflowStepLog {
    id: number;
    workflow_enrollment_id: number; // workflow_enrollment.id
    step_index: number;
    step_type: string;
    status: WorkflowStepLogStatus;
    result: string;
    error_message?: string;
    executed_at?: string;
    created_at: string;
}


// --- CALL TRACKING ---

export enum CallDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

export enum CallType {
    SALES = 'sales',
    SUPPORT = 'support',
    FOLLOW_UP = 'follow_up',
    DEMO = 'demo',
    OTHER = 'other',
}

export enum CallOutcome {
    CONNECTED = 'connected',
    NO_ANSWER = 'no_answer',
    VOICEMAIL = 'voicemail',
    BUSY = 'busy',
    CALLBACK_REQUESTED = 'callback_requested',
    CONVERTED = 'converted',
    NOT_INTERESTED = 'not_interested',
}

export interface CallLog {
    id: number;
    lead_id?: number; // lead.id
    customer_id?: number; // customer.id
    caller_phone: string;
    recipient_phone: string;
    call_direction: CallDirection;
    call_type: CallType;
    call_duration_seconds: number;
    call_outcome: CallOutcome;
    recording_url?: string;
    notes?: string;
    scheduled_call_id?: number; // task.id
    handled_by: number; // user.id
    call_started_at: string;
    call_ended_at?: string;
    created_at: string;
}


// --- MARKET RESEARCH ---

export enum MarketResearchType {
    COMPETITOR_ANALYSIS = 'competitor_analysis',
    MARKET_TRENDS = 'market_trends',
    CUSTOMER_SURVEY = 'customer_survey',
    PRICING_ANALYSIS = 'pricing_analysis',
    INDUSTRY_REPORT = 'industry_report',
}

export interface MarketResearch {
    id: number;
    research_title: string;
    research_type: MarketResearchType;
    description: string;
    key_findings: string;
    data_sources: string[]; // JSON array
    file_url?: string;
    conducted_by: number; // user.id
    conducted_date: string; // date
    tags: string[]; // JSON array
    created_at: string;
    updated_at: string;
}


// --- MARKETING CALENDAR ---

export enum MarketingEventType {
    CAMPAIGN_LAUNCH = 'campaign_launch',
    EVENT = 'event',
    WEBINAR = 'webinar',
    CONTENT_RELEASE = 'content_release',
    PROMOTION = 'promotion',
    DEADLINE = 'deadline',
    MEETING = 'meeting',
}

export enum MarketingEventStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface MarketingEvent {
    id: number;
    event_name: string;
    event_type: MarketingEventType;
    description: string;
    start_date: string;
    end_date?: string;
    assigned_to?: number; // user.id
    related_campaign_id?: number; // campaign.id
    status: MarketingEventStatus;
    budget?: number; // decimal
    actual_cost?: number; // decimal
    notes?: string;
    created_by: number; // user.id
    created_at: string;
    updated_at: string;
}
