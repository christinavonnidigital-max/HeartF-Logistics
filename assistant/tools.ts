import { FunctionDeclaration } from '@google/genai';
import {
  AuditEvent,
  Booking,
  CargoType,
  Customer,
  Invoice,
  InvoiceStatus,
  Lead,
  LeadActivity,
  LeadScoringRule,
  Opportunity,
  Currency,
} from '../types';
import { calculateLeadScore } from '../services/crmService';

type JsonSchema = {
  type: 'object';
  properties: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      format?: string;
    }
  >;
  required?: string[];
  additionalProperties?: boolean;
};

export type AssistantBookingDraft = Partial<{
  customer_id: string;
  pickup_city: string;
  pickup_address: string;
  pickup_date: string;
  delivery_city: string;
  delivery_address: string;
  delivery_date: string;
  cargo_type: CargoType;
  cargo_description: string;
  weight_tonnes: string;
  base_price: string;
  currency: Currency;
}>;

export type AssistantEmailDraft = {
  subject: string;
  body: string;
  to?: string;
  company?: string;
};

export interface ToolRunContext {
  data: {
    bookings: Booking[];
    invoices: Invoice[];
    customers: Customer[];
    leads: Lead[];
    opportunities: Opportunity[];
    leadActivities: LeadActivity[];
    leadScoringRules: LeadScoringRule[];
    auditLog: AuditEvent[];
    defaultCurrency?: Currency;
  };
  actions: {
    openBookingModal?: (draft: AssistantBookingDraft) => void;
    openEmailComposer?: (draft: AssistantEmailDraft) => void;
  };
}

export interface ToolRunResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  followUp?: string;
  type?: string;
}

export interface AssistantTool {
  name: string;
  description: string;
  argsSchema: JsonSchema;
  run: (args: Record<string, any>, context: ToolRunContext) => ToolRunResult;
}

const asDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatInputDate = (date: Date) => date.toISOString().split('T')[0];

const safeFormatCurrency = (value: number, currency: Currency = Currency.USD) => {
  try {
    return value.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
  } catch {
    return value.toLocaleString();
  }
};

const findCustomer = (customers: Customer[], id?: number, name?: string) => {
  if (id) return customers.find((c) => Number(c.id) === Number(id));
  if (name) {
    const lower = name.toLowerCase();
    return customers.find((c) => c.company_name?.toLowerCase().includes(lower));
  }
  return undefined;
};

const findLead = (leads: Lead[], args: Record<string, any>) => {
  const { leadId, email, company } = args;
  if (leadId) {
    const found = leads.find((l) => Number(l.id) === Number(leadId));
    if (found) return found;
  }
  if (email) {
    const lower = String(email).toLowerCase();
    const found = leads.find((l) => l.email?.toLowerCase() === lower);
    if (found) return found;
  }
  if (company) {
    const lower = String(company).toLowerCase();
    return leads.find((l) => l.company_name?.toLowerCase().includes(lower));
  }
  return undefined;
};

const matchRule = (lead: Lead, rule: LeadScoringRule) => {
  if (!rule?.is_active) return false;
  const { field, operator, value } = rule.condition;
  const leadValue = (lead as any)?.[field];
  if (leadValue === undefined || leadValue === null) return false;
  const leadValueStr = String(leadValue).toLowerCase();
  const ruleValueStr = String(value).toLowerCase();

  switch (operator) {
    case 'equals':
      return leadValueStr === ruleValueStr;
    case 'contains':
      return leadValueStr.includes(ruleValueStr);
    case 'greater_than': {
      const numericLeadValue = Number(leadValue);
      const numericRuleValue = Number(value);
      return !isNaN(numericLeadValue) && !isNaN(numericRuleValue) && numericLeadValue > numericRuleValue;
    }
    default:
      return false;
  }
};

const assistantTools: AssistantTool[] = [
  {
    name: 'create_booking',
    description: 'Prefill and open the booking form with the requested pickup, dropoff, cargo, and customer details.',
    argsSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'integer', description: 'ID of the customer to assign the booking to' },
        customerName: { type: 'string', description: 'Customer company name when ID is unknown' },
        pickupCity: { type: 'string', description: 'Pickup city' },
        deliveryCity: { type: 'string', description: 'Delivery city' },
        pickupDate: { type: 'string', description: 'Pickup date (YYYY-MM-DD)', format: 'date' },
        deliveryDate: { type: 'string', description: 'Delivery date (YYYY-MM-DD)', format: 'date' },
        pickupAddress: { type: 'string', description: 'Detailed pickup address' },
        deliveryAddress: { type: 'string', description: 'Detailed delivery address' },
        cargoDescription: { type: 'string', description: 'What is being shipped' },
        cargoType: { type: 'string', description: 'Cargo type enum', enum: Object.values(CargoType) },
        weightTonnes: { type: 'number', description: 'Weight in tonnes' },
        basePrice: { type: 'number', description: 'Quoted base price' },
      },
      required: ['pickupCity', 'deliveryCity'],
      additionalProperties: false,
    },
    run: (args, context) => {
      const { customers } = context.data;
      const today = new Date();
      const defaultPickup = formatInputDate(today);
      const defaultDelivery = formatInputDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000));
      const customer = findCustomer(customers, args.customerId, args.customerName);

      const draft: AssistantBookingDraft = {
        customer_id: customer ? String(customer.id) : args.customerId ? String(args.customerId) : '',
        pickup_city: args.pickupCity,
        pickup_address: args.pickupAddress || '',
        pickup_date: args.pickupDate || defaultPickup,
        delivery_city: args.deliveryCity,
        delivery_address: args.deliveryAddress || '',
        delivery_date: args.deliveryDate || defaultDelivery,
        cargo_type: (Object.values(CargoType) as string[]).includes(args.cargoType) ? args.cargoType : CargoType.GENERAL,
        cargo_description: args.cargoDescription || 'General cargo',
        weight_tonnes: args.weightTonnes ? String(args.weightTonnes) : '',
        base_price: args.basePrice ? String(args.basePrice) : '',
        currency: context.data.defaultCurrency || Currency.USD,
      };

      context.actions.openBookingModal?.(draft);

      return {
        ok: true,
        message: `Opened a booking draft from ${draft.pickup_city} to ${draft.delivery_city}${customer ? ` for ${customer.company_name}` : ''}.`,
        data: { draft },
        type: 'booking',
      };
    },
  },
  {
    name: 'find_overdue_invoices',
    description: 'List invoices that are past due and still have an outstanding balance.',
    argsSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'integer', description: 'Filter to a specific customer ID' },
        customerName: { type: 'string', description: 'Filter to a customer name' },
        asOfDate: { type: 'string', description: 'Date to compare due dates against (YYYY-MM-DD)', format: 'date' },
      },
      additionalProperties: false,
    },
    run: (args, context) => {
      const asOf = asDate(args.asOfDate) || new Date();
      const customer = findCustomer(context.data.customers, args.customerId, args.customerName);
      const invoices = context.data.invoices || [];

      const overdue = invoices
        .filter((inv) => {
          if (customer && inv.customer_id !== customer.id) return false;
          if (inv.balance_due <= 0) return false;
          if (inv.status === InvoiceStatus.PAID) return false;
          const due = asDate(inv.due_date);
          return due ? due.getTime() < asOf.getTime() : false;
        })
        .map((inv) => {
          const due = asDate(inv.due_date) || asOf;
          const daysOverdue = Math.max(0, Math.round((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
          const customerName = context.data.customers.find((c) => c.id === inv.customer_id)?.company_name;
          return {
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: customerName || `Customer ${inv.customer_id}`,
            dueDate: inv.due_date,
            balanceDue: inv.balance_due,
            status: inv.status,
            daysOverdue,
          };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      const totalBalance = overdue.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

      return {
        ok: true,
        message: overdue.length
          ? `Found ${overdue.length} overdue invoice(s)${customer ? ` for ${customer.company_name}` : ''}. Oldest is ${overdue[0].daysOverdue} day(s) overdue.`
          : `No overdue invoices${customer ? ` for ${customer.company_name}` : ''} as of ${formatInputDate(asOf)}.`,
        data: {
          invoices: overdue,
          totalBalance,
          asOf: formatInputDate(asOf),
        },
        type: 'invoice',
      };
    },
  },
  {
    name: 'summarize_customer_activity',
    description: "Summarize a customer's recent logistics activity, invoices, and opportunities.",
    argsSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'integer', description: 'Customer ID' },
        customerName: { type: 'string', description: 'Customer name to match' },
      },
      additionalProperties: false,
    },
    run: (args, context) => {
      const customer = findCustomer(context.data.customers, args.customerId, args.customerName);
      if (!customer) {
        return { ok: false, message: 'Customer not found. Provide a valid customer ID or name.' };
      }

      const bookings = context.data.bookings.filter((b) => b.customer_id === customer.id);
      const invoices = context.data.invoices.filter((inv) => inv.customer_id === customer.id);
      const overdueInvoices = invoices.filter(
        (inv) => inv.balance_due > 0 && inv.status !== InvoiceStatus.PAID && asDate(inv.due_date)?.getTime()! < Date.now(),
      );
      const opportunities = context.data.opportunities.filter((opp) => opp.customer_id === customer.id || opp.lead_id === customer.user_id);
      const lifetimeRevenue = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
      const openBalance = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

      const lastInvoice = invoices.slice().sort((a, b) => (asDate(b.issue_date)?.getTime() || 0) - (asDate(a.issue_date)?.getTime() || 0))[0];
      const lastBooking = bookings.slice().sort((a, b) => (asDate(b.pickup_date)?.getTime() || 0) - (asDate(a.pickup_date)?.getTime() || 0))[0];

      const summaryLines = [
        `${bookings.length} booking(s), ${opportunities.length} opportunity(s) in play.`,
        `Lifetime paid: ${safeFormatCurrency(lifetimeRevenue, customer.preferred_currency || context.data.defaultCurrency || Currency.USD)}`,
        `Open balance: ${safeFormatCurrency(openBalance, customer.preferred_currency || context.data.defaultCurrency || Currency.USD)}`,
        overdueInvoices.length ? `${overdueInvoices.length} overdue invoice(s).` : 'No overdue invoices.',
      ];

      if (lastInvoice) summaryLines.push(`Last invoice ${lastInvoice.invoice_number} issued ${lastInvoice.issue_date}.`);
      if (lastBooking) summaryLines.push(`Latest booking ${lastBooking.booking_number} from ${lastBooking.pickup_city} to ${lastBooking.delivery_city}.`);

      return {
        ok: true,
        message: summaryLines.join('\n'),
        data: {
          customer,
          bookingsCount: bookings.length,
          opportunitiesCount: opportunities.length,
          overdueInvoices,
          lifetimeRevenue,
          openBalance,
          lastInvoice: lastInvoice?.invoice_number,
          lastBooking: lastBooking?.booking_number,
        },
        type: 'customer',
      };
    },
  },
  {
    name: 'draft_follow_up_email',
    description: 'Draft a concise follow-up email with subject and body and open the email composer for editing.',
    argsSchema: {
      type: 'object',
      properties: {
        leadId: { type: 'integer', description: 'Lead ID to personalize the email' },
        recipientName: { type: 'string', description: 'Contact name' },
        recipientEmail: { type: 'string', description: 'Contact email' },
        company: { type: 'string', description: 'Company name' },
        topic: { type: 'string', description: 'What you are following up on' },
        callToAction: { type: 'string', description: 'Specific CTA to include' },
        tone: { type: 'string', description: 'Desired tone (friendly, formal, direct)' },
      },
      additionalProperties: false,
    },
    run: (args, context) => {
      const lead = findLead(context.data.leads, args);
      const name = args.recipientName || (lead ? `${lead.first_name} ${lead.last_name}` : 'there');
      const company = args.company || lead?.company_name || 'your team';
      const topic = args.topic || lead?.logistics_needs || 'our logistics proposal';
      const cta = args.callToAction || 'confirm a time to talk through next steps';
      const tone = (args.tone || 'friendly').toLowerCase();

      const subject = `Quick follow-up on ${topic}`;
      const body = `Hi ${name},\n\nThanks again for the time${lead?.lead_source ? ` after your ${lead.lead_source} inquiry` : ''}. I wanted to follow up on ${topic} for ${company}. We can handle scheduling, pricing, and any compliance needs end-to-end.\n\nWould you be open to ${cta}? I can share a short route plan and pricing breakdown tailored to ${company}.\n\nThanks,\nHeartfledge Logistics Team`;

      if (context.actions.openEmailComposer) {
        context.actions.openEmailComposer({
          subject,
          body,
          to: args.recipientEmail || lead?.email,
          company,
        });
      }

      return {
        ok: true,
        message: `Drafted a ${tone} follow-up email${lead ? ` for ${lead.first_name} ${lead.last_name}` : ''}.`,
        data: { subject, body, to: args.recipientEmail || lead?.email, company },
        type: 'communication',
      };
    },
  },
  {
    name: 'explain_lead_score_change',
    description: 'Explain why a lead has its current score by mapping rule matches and recent audit or activity events.',
    argsSchema: {
      type: 'object',
      properties: {
        leadId: { type: 'integer', description: 'Lead ID to investigate' },
        email: { type: 'string', description: 'Lead email' },
        company: { type: 'string', description: 'Lead company name' },
      },
      additionalProperties: false,
    },
    run: (args, context) => {
      const lead = findLead(context.data.leads, args);
      if (!lead) return { ok: false, message: 'Lead not found. Provide a leadId, email, or company.' };

      const rules = context.data.leadScoringRules || [];
      const matches = rules
        .filter((rule) => matchRule(lead, rule))
        .map((rule) => ({ rule: rule.rule_name, points: rule.points, field: rule.condition.field }));

      const recomputedScore = calculateLeadScore(lead, rules);
      const delta = recomputedScore - (lead.lead_score || 0);

      const auditTrail = (context.data.auditLog || []).filter((entry) => entry.entity?.type === 'lead' && entry.entity?.id === lead.id);
      const recentActivities = (context.data.leadActivities || []).filter((act) => act.lead_id === lead.id);

      const drivers = matches.length
        ? matches.map((m) => `${m.rule} (${m.points > 0 ? '+' : ''}${m.points})`).join(', ')
        : 'No active rules matched.';

      const message = [
        `Lead ${lead.first_name} ${lead.last_name} scored ${lead.lead_score}. Recomputed score is ${recomputedScore} (${delta >= 0 ? '+' : ''}${delta}).`,
        `Rule matches: ${drivers}`,
        auditTrail.length ? `Audit entries: ${auditTrail.length} recent.` : 'No audit entries recorded for this lead.',
        recentActivities.length ? `Recent activities: ${recentActivities.length}.` : 'No recent activities recorded.',
      ].join('\n');

      return {
        ok: true,
        message,
        data: {
          leadId: lead.id,
          currentScore: lead.lead_score,
          recomputedScore,
          delta,
          matches,
          auditTrail: auditTrail.slice(0, 5),
          recentActivities: recentActivities.slice(0, 5),
        },
        type: 'lead',
      };
    },
  },
];

export const getAssistantTools = () => assistantTools;

export const getFunctionDeclarations = (): FunctionDeclaration[] =>
  assistantTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.argsSchema,
  }));

export const runAssistantTool = (name: string, args: Record<string, any>, context: ToolRunContext): ToolRunResult => {
  const tool = assistantTools.find((t) => t.name === name);
  if (!tool) {
    return { ok: false, message: `Tool ${name} is not registered.` };
  }
  try {
    return tool.run(args || {}, context);
  } catch (error: any) {
    return { ok: false, message: `Tool ${name} failed: ${error?.message || 'Unknown error'}` };
  }
};
