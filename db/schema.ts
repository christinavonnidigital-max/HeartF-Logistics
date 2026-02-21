import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  decimal,
  timestamp,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "customer",
  "driver",
  "marketing",
  "dispatcher",
  "ops_manager",
  "finance",
  "pending",
]);

export const loyaltyTierEnum = pgEnum("loyalty_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
]);

export const currencyEnum = pgEnum("currency", ["USD", "ZWL", "ZIG"]);

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "refrigerated",
  "dry",
  "flatbed",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "maintenance",
  "retired",
  "out_of_service",
]);

export const fuelTypeEnum = pgEnum("fuel_type", ["diesel", "petrol"]);

export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "suspended",
  "terminated",
  "on_leave",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "pending",
  "confirmed",
  "scheduled",
  "dispatched",
  "in_transit",
  "delivered",
  "closed",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "mobile_money",
  "credit",
  "card",
  "credit_note",
  "other",
]);

export const cargoTypeEnum = pgEnum("cargo_type", [
  "general",
  "perishable",
  "hazardous",
  "fragile",
  "heavy",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "website",
  "referral",
  "cold_outreach",
  "event",
  "social_media",
  "partner",
  "other",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
]);

export const companySizeEnum = pgEnum("company_size", [
  "startup",
  "small",
  "medium",
  "large",
  "enterprise",
]);

export const industryEnum = pgEnum("industry", [
  "fmcg",
  "retail",
  "manufacturing",
  "agriculture",
  "mining",
  "wholesale",
  "other",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "partial",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);

export const expenseTypeEnum = pgEnum("expense_type", [
  "fuel",
  "maintenance",
  "insurance",
  "license",
  "tolls",
  "parking",
  "other",
]);

export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("customer"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyRegistration: varchar("company_registration", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }),
  billingEmail: varchar("billing_email", { length: 255 }).notNull(),
  billingPhone: varchar("billing_phone", { length: 50 }),
  taxId: varchar("tax_id", { length: 100 }),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  loyaltyTier: loyaltyTierEnum("loyalty_tier").notNull().default("bronze"),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  totalBookings: integer("total_bookings").notNull().default(0),
  preferredCurrency: currencyEnum("preferred_currency").notNull().default("USD"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  paymentTerms: integer("payment_terms"),
  isVerified: boolean("is_verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  registrationNumber: varchar("registration_number", { length: 50 }).notNull().unique(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  capacityTonnes: decimal("capacity_tonnes", { precision: 8, scale: 2 }).notNull(),
  status: vehicleStatusEnum("status").notNull().default("active"),
  purchaseDate: timestamp("purchase_date").notNull(),
  purchaseCost: decimal("purchase_cost", { precision: 12, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  fitnessCertificateExpiry: timestamp("fitness_certificate_expiry"),
  licenseDiscExpiry: timestamp("license_disc_expiry"),
  lastServiceDate: timestamp("last_service_date").notNull(),
  lastServiceKm: integer("last_service_km"),
  nextServiceDueKm: integer("next_service_due_km").notNull(),
  nextServiceDueDate: timestamp("next_service_due_date"),
  currentKm: integer("current_km").notNull().default(0),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  gpsDeviceId: varchar("gps_device_id", { length: 100 }),
  gpsDeviceActive: boolean("gps_device_active").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  licenseNumber: varchar("license_number", { length: 100 }).notNull(),
  licenseType: varchar("license_type", { length: 50 }).notNull(),
  licenseExpiryDate: timestamp("license_expiry_date").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  nationalId: varchar("national_id", { length: 100 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  hireDate: timestamp("hire_date").notNull(),
  employmentStatus: employmentStatusEnum("employment_status").notNull().default("active"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  medicalCertificateExpiry: timestamp("medical_certificate_expiry"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalDeliveries: integer("total_deliveries").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: varchar("booking_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  pickupLocation: varchar("pickup_location", { length: 255 }).notNull(),
  pickupAddress: varchar("pickup_address", { length: 500 }).notNull(),
  pickupCity: varchar("pickup_city", { length: 100 }).notNull(),
  pickupCountry: varchar("pickup_country", { length: 100 }).notNull(),
  pickupLatitude: decimal("pickup_latitude", { precision: 10, scale: 7 }),
  pickupLongitude: decimal("pickup_longitude", { precision: 10, scale: 7 }),
  pickupDate: timestamp("pickup_date").notNull(),
  pickupContactName: varchar("pickup_contact_name", { length: 255 }),
  pickupContactPhone: varchar("pickup_contact_phone", { length: 50 }),
  deliveryLocation: varchar("delivery_location", { length: 255 }).notNull(),
  deliveryAddress: varchar("delivery_address", { length: 500 }).notNull(),
  deliveryCity: varchar("delivery_city", { length: 100 }).notNull(),
  deliveryCountry: varchar("delivery_country", { length: 100 }).notNull(),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 10, scale: 7 }),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryContactName: varchar("delivery_contact_name", { length: 255 }),
  deliveryContactPhone: varchar("delivery_contact_phone", { length: 50 }),
  cargoType: cargoTypeEnum("cargo_type").notNull(),
  cargoDescription: text("cargo_description").notNull(),
  weightTonnes: decimal("weight_tonnes", { precision: 8, scale: 2 }).notNull(),
  requiresRefrigeration: boolean("requires_refrigeration").notNull().default(false),
  temperatureMin: decimal("temperature_min", { precision: 5, scale: 2 }),
  temperatureMax: decimal("temperature_max", { precision: 5, scale: 2 }),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  driverId: integer("driver_id").references(() => drivers.id),
  status: bookingStatusEnum("status").notNull().default("pending"),
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  surcharges: decimal("surcharges", { precision: 12, scale: 2 }),
  discount: decimal("discount", { precision: 12, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  paymentMethod: paymentMethodEnum("payment_method"),
  loyaltyPointsEarned: integer("loyalty_points_earned"),
  specialInstructions: text("special_instructions"),
  notes: text("notes"),
  statusHistory: json("status_history"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  startedAt: timestamp("started_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadSource: leadSourceEnum("lead_source").notNull(),
  leadStatus: leadStatusEnum("lead_status").notNull().default("new"),
  leadScore: integer("lead_score").notNull().default(0),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companySize: companySizeEnum("company_size").notNull(),
  industry: industryEnum("industry").notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  website: text("website"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  logisticsNeeds: text("logistics_needs").notNull(),
  currentProvider: varchar("current_provider", { length: 255 }),
  monthlyShipmentVolume: integer("monthly_shipment_volume"),
  preferredRoutes: text("preferred_routes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  nextAction: text("next_action"),
  nextActionDate: timestamp("next_action_date"),
  lastContactDate: timestamp("last_contact_date"),
  convertedToCustomerId: integer("converted_to_customer_id").references(() => customers.id),
  convertedAt: timestamp("converted_at"),
  lostReason: text("lost_reason"),
  lostAt: timestamp("lost_at"),
  notes: text("notes"),
  tags: json("tags"),
  customFields: json("custom_fields"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  opportunityName: varchar("opportunity_name", { length: 255 }).notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  customerId: integer("customer_id").references(() => customers.id),
  stage: opportunityStageEnum("stage").notNull().default("prospecting"),
  expectedValue: decimal("expected_value", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  probability: integer("probability").notNull().default(0),
  expectedCloseDate: timestamp("expected_close_date").notNull(),
  nextActionDate: timestamp("next_action_date"),
  actualCloseDate: timestamp("actual_close_date"),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  description: text("description").notNull(),
  nextStep: text("next_step").notNull(),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  invoiceType: varchar("invoice_type", { length: 50 }).notNull().default("booking"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  reminderAt: timestamp("reminder_at"),
  reminderNote: text("reminder_note"),
  lastReminderAt: timestamp("last_reminder_at"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  paymentTerms: integer("payment_terms"),
  notes: text("notes"),
  customerNotes: text("customer_notes"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  paidAt: timestamp("paid_at"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  expenseType: expenseTypeEnum("expense_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  description: text("description").notNull(),
  receiptUrl: text("receipt_url"),
  expenseDate: timestamp("expense_date").notNull(),
  recordedBy: integer("recorded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency", { length: 50 }),
});

export const gpsLocations = pgTable("gps_locations", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  speed: decimal("speed", { precision: 6, scale: 2 }),
  heading: decimal("heading", { precision: 6, scale: 2 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(), // booking.created, booking.status, maintenance.due, invoice.overdue
  entityId: integer("entity_id"),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("queued"), // queued | sent | failed
  payload: json("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  error: text("error"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type GpsLocation = typeof gpsLocations.$inferSelect;
export type NewGpsLocation = typeof gpsLocations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
