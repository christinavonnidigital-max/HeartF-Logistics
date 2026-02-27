import type { Lead, LeadActivity, Opportunity } from "../types";
import type { CsvColumn } from "./toCsv";
import type { XlsxColumn } from "./toXlsx";

const formatDateTimeZW = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDateZW = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTags = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(" | ");
  if (typeof value === "string") return value;
  return "";
};

const formatJson = (value: unknown) => {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toTitle = (value: unknown) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toDateValue = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
};

export type LeadExportRow = Lead & {
  opportunity_count: number;
  primary_opportunity_id?: number;
  primary_opportunity_name?: string;
  primary_opportunity_stage?: string;
  primary_opportunity_expected_value?: number;
  primary_opportunity_probability?: number;
  primary_opportunity_expected_close_date?: string;
  primary_opportunity_next_step?: string;
  timeline_activity_count: number;
  timeline_last_activity_type?: string;
  timeline_last_activity_subject?: string;
  timeline_last_activity_description?: string;
  timeline_last_activity_date?: string;
  timeline_last_activity_outcome?: string;
  timeline_next_action?: string;
  timeline_next_action_date?: string;
  timeline_recent_activities?: string;
};

const buildTimelineSummary = (activities: LeadActivity[]) =>
  activities
    .slice(0, 3)
    .map((activity) => {
      const stamp = formatDateTimeZW(activity.created_at);
      const type = toTitle(activity.activity_type);
      const subject = String(activity.subject || "").trim();
      return `${stamp} ${type}: ${subject}`.trim();
    })
    .join(" || ");

export const buildLeadExportRows = (
  leads: Lead[],
  leadActivities: LeadActivity[],
  opportunities: Opportunity[],
): LeadExportRow[] => {
  const activitiesByLead = new Map<number, LeadActivity[]>();
  leadActivities.forEach((activity) => {
    const list = activitiesByLead.get(activity.lead_id) ?? [];
    list.push(activity);
    activitiesByLead.set(activity.lead_id, list);
  });

  const opportunitiesByLead = new Map<number, Opportunity[]>();
  opportunities.forEach((opportunity) => {
    if (!opportunity.lead_id) return;
    const list = opportunitiesByLead.get(opportunity.lead_id) ?? [];
    list.push(opportunity);
    opportunitiesByLead.set(opportunity.lead_id, list);
  });

  const now = Date.now();

  return leads.map((lead) => {
    const leadTimeline = [...(activitiesByLead.get(lead.id) ?? [])].sort(
      (a, b) => toDateValue(b.created_at) - toDateValue(a.created_at),
    );
    const leadOpps = [...(opportunitiesByLead.get(lead.id) ?? [])].sort((a, b) => {
      const byValue = Number(b.expected_value || 0) - Number(a.expected_value || 0);
      if (byValue !== 0) return byValue;
      return toDateValue(b.updated_at) - toDateValue(a.updated_at);
    });

    const latestActivity = leadTimeline[0];
    const nextActionActivity = leadTimeline
      .filter((activity) => toDateValue(activity.next_action_date) >= now)
      .sort((a, b) => toDateValue(a.next_action_date) - toDateValue(b.next_action_date))[0];

    const primaryOpportunity = leadOpps[0];

    return {
      ...lead,
      opportunity_count: leadOpps.length,
      primary_opportunity_id: primaryOpportunity?.id,
      primary_opportunity_name: primaryOpportunity?.opportunity_name,
      primary_opportunity_stage: primaryOpportunity?.stage,
      primary_opportunity_expected_value: primaryOpportunity?.expected_value,
      primary_opportunity_probability: primaryOpportunity?.probability,
      primary_opportunity_expected_close_date: primaryOpportunity?.expected_close_date,
      primary_opportunity_next_step: primaryOpportunity?.next_step,
      timeline_activity_count: leadTimeline.length,
      timeline_last_activity_type: latestActivity?.activity_type,
      timeline_last_activity_subject: latestActivity?.subject,
      timeline_last_activity_description: latestActivity?.description,
      timeline_last_activity_date: latestActivity?.created_at,
      timeline_last_activity_outcome: latestActivity?.outcome,
      timeline_next_action: nextActionActivity?.next_action || lead.next_action || "",
      timeline_next_action_date: nextActionActivity?.next_action_date || lead.next_action_date || "",
      timeline_recent_activities: buildTimelineSummary(leadTimeline),
    };
  });
};

const leadExportBase = [
  { key: "id", header: "Lead ID", width: 10 },
  { key: "created_at", header: "Created At (Africa/Harare)", width: 24, format: formatDateTimeZW },
  { key: "updated_at", header: "Updated At (Africa/Harare)", width: 24, format: formatDateTimeZW },
  { key: "lead_source", header: "Lead Source", width: 16 },
  { key: "lead_status", header: "Lead Status", width: 16 },
  { key: "lead_score", header: "Lead Score", width: 10 },
  { key: "first_name", header: "First Name", width: 16 },
  { key: "last_name", header: "Last Name", width: 16 },
  { key: "email", header: "Email", width: 28 },
  { key: "phone", header: "Phone", width: 18 },
  { key: "company_name", header: "Company Name", width: 24 },
  { key: "company_size", header: "Company Size", width: 14 },
  { key: "industry", header: "Industry", width: 14 },
  { key: "position", header: "Position", width: 18 },
  { key: "website", header: "Website", width: 26 },
  { key: "address", header: "Address", width: 30 },
  { key: "city", header: "City", width: 16 },
  { key: "country", header: "Country", width: 16 },
  { key: "logistics_needs", header: "Logistics Needs", width: 36 },
  { key: "current_provider", header: "Current Provider", width: 18 },
  { key: "monthly_shipment_volume", header: "Monthly Shipment Volume", width: 20 },
  { key: "preferred_routes", header: "Preferred Routes", width: 28 },
  { key: "assigned_to", header: "Assigned To (User ID)", width: 18 },
  { key: "next_follow_up_date", header: "Next Follow-up Date", width: 18, format: formatDateZW },
  { key: "next_action", header: "Next Action", width: 26 },
  { key: "next_action_date", header: "Next Action Date", width: 18, format: formatDateZW },
  { key: "last_contact_date", header: "Last Contact Date", width: 18, format: formatDateZW },
  { key: "converted_to_customer_id", header: "Converted Customer ID", width: 20 },
  { key: "converted_at", header: "Converted At", width: 20, format: formatDateTimeZW },
  { key: "lost_reason", header: "Lost Reason", width: 24 },
  { key: "lost_at", header: "Lost At", width: 20, format: formatDateTimeZW },
  { key: "tags", header: "Tags", width: 24, format: formatTags },
  { key: "custom_fields", header: "Custom Fields (JSON)", width: 36, format: formatJson },
  { key: "notes", header: "Notes", width: 40 },
  { key: "opportunity_count", header: "Opportunity Count", width: 14 },
  { key: "primary_opportunity_id", header: "Primary Opportunity ID", width: 18 },
  { key: "primary_opportunity_name", header: "Primary Opportunity Name", width: 30 },
  { key: "primary_opportunity_stage", header: "Primary Opportunity Stage", width: 20, format: toTitle },
  { key: "primary_opportunity_expected_value", header: "Primary Opportunity Expected Value", width: 24 },
  { key: "primary_opportunity_probability", header: "Primary Opportunity Probability %", width: 24 },
  {
    key: "primary_opportunity_expected_close_date",
    header: "Primary Opportunity Expected Close Date",
    width: 26,
    format: formatDateZW,
  },
  { key: "primary_opportunity_next_step", header: "Primary Opportunity Next Step", width: 34 },
  { key: "timeline_activity_count", header: "Timeline Activity Count", width: 18 },
  { key: "timeline_last_activity_type", header: "Timeline Last Activity Type", width: 20, format: toTitle },
  { key: "timeline_last_activity_subject", header: "Timeline Last Activity Subject", width: 34 },
  { key: "timeline_last_activity_description", header: "Timeline Last Activity Description", width: 40 },
  { key: "timeline_last_activity_date", header: "Timeline Last Activity Date", width: 24, format: formatDateTimeZW },
  { key: "timeline_last_activity_outcome", header: "Timeline Last Activity Outcome", width: 28 },
  { key: "timeline_next_action", header: "Timeline Next Action", width: 30 },
  { key: "timeline_next_action_date", header: "Timeline Next Action Date", width: 24, format: formatDateZW },
  { key: "timeline_recent_activities", header: "Timeline Recent Activities (Top 3)", width: 66 },
] as const;

export const leadCsvColumns: CsvColumn<LeadExportRow>[] = leadExportBase.map((column) => ({
  key: column.key,
  header: column.header,
  format: column.format ? (value) => column.format?.(value) ?? "" : undefined,
}));

export const leadXlsxColumns: XlsxColumn<LeadExportRow>[] = leadExportBase.map((column) => ({
  key: column.key,
  title: column.header,
  width: column.width,
  format: column.format ? (value) => column.format?.(value) ?? "" : undefined,
}));
