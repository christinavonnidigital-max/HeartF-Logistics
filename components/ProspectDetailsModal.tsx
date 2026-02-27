import React, { useMemo } from "react";
import { ModalShell, Button, StatusPill, SubtleCard } from "./UiKit";

export type LeadFinderResult = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  summary?: string;
  intentSignal?: string;
  confidence?: number;
  sourceUrl?: string;
  verified?: boolean;
  sourcesCount?: number;
  resultKey?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
};

export type DisqualifyReason =
  | "No logistics fit"
  | "No reachable contact"
  | "Insufficient evidence"
  | "Duplicate / already active";

const DISQUALIFY_REASONS: DisqualifyReason[] = [
  "No logistics fit",
  "No reachable contact",
  "Insufficient evidence",
  "Duplicate / already active",
];

function confidencePct(c?: number) {
  const n = Number(c ?? 0);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function safeOpen(url?: string) {
  if (!url) return;
  const u = url.trim();
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-ZW", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));
}

function toLowerText(...parts: Array<string | undefined>) {
  return parts
    .map((p) => String(p || "").toLowerCase())
    .join(" ");
}

function inferServiceFitTags(prospect: LeadFinderResult) {
  const text = toLowerText(
    prospect.industry,
    prospect.summary,
    prospect.intentSignal,
    prospect.companyName,
    prospect.location,
  );
  const tags: string[] = [];

  if (/(cross-border|border|customs|import|export|corridor|sadc|regional)/.test(text)) tags.push("Cross-Border");
  if (/(cold chain|temperature|pharma|vaccine|perishable|frozen)/.test(text)) tags.push("Cold Chain");
  if (/(mining|bulk|ore|cement|steel|heavy haul)/.test(text)) tags.push("Bulk Haulage");
  if (/(retail|supermarket|e-commerce|last mile|distribution|stores?)/.test(text)) tags.push("Last-Mile Distribution");
  if (/(warehouse|storage|fulfilment|distribution center|dc\b)/.test(text)) tags.push("Warehousing");
  if (/(fuel|chemical|hazmat|dangerous goods)/.test(text)) tags.push("Hazmat");

  if (!tags.length) tags.push("General Freight");
  return Array.from(new Set(tags)).slice(0, 5);
}

function estimateMonthlyValueBand(prospect: LeadFinderResult, conf: number, tags: string[]) {
  const size = String(prospect.companySize || "").toLowerCase();
  let min = 1500;
  let max = 5000;

  if (/(enterprise|1000\+|large group)/.test(size)) {
    min = 7000;
    max = 25000;
  } else if (/(large|500\+)/.test(size)) {
    min = 4000;
    max = 14000;
  } else if (/(small|micro|startup)/.test(size)) {
    min = 800;
    max = 3000;
  } else if (/(medium|sme|200\+|250\+)/.test(size)) {
    min = 1800;
    max = 6500;
  }

  let multiplier = 1;
  if (tags.includes("Cross-Border")) multiplier += 0.2;
  if (tags.includes("Cold Chain")) multiplier += 0.25;
  if (tags.includes("Bulk Haulage")) multiplier += 0.2;
  if (tags.includes("Hazmat")) multiplier += 0.15;
  if (conf < 60) multiplier -= 0.2;
  if (conf >= 85) multiplier += 0.15;

  const round = (n: number) => Math.round(n / 100) * 100;
  return {
    min: round(min * multiplier),
    max: round(max * multiplier),
  };
}

async function copyToClipboard(text: string) {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export const ProspectDetailsModal: React.FC<{
  isOpen: boolean;
  prospect: LeadFinderResult | null;
  onClose: () => void;
  onDraftEmail: (prospect: LeadFinderResult) => void;
  onDisqualify?: (prospect: LeadFinderResult, reason: DisqualifyReason) => void;
}> = ({ isOpen, prospect, onClose, onDraftEmail, onDisqualify }) => {
  const conf = useMemo(() => confidencePct(prospect?.confidence), [prospect?.confidence]);

  const tier = useMemo(() => {
    if (!prospect) return "candidate";
    const hasContact = Boolean(prospect.contact?.email || prospect.contact?.phone);
    if (prospect.verified || hasContact) return "verified";
    if (conf >= 80) return "high";
    return "candidate";
  }, [prospect, conf]);

  const tierPill = useMemo(() => {
    if (!prospect) return null;
    if (tier === "verified") return <StatusPill tone="success" label="Verified" />;
    if (tier === "high") return <StatusPill tone="warn" label="High match" />;
    return <StatusPill tone="info" label={`Candidate ${conf}%`} />;
  }, [prospect, tier, conf]);

  if (!prospect) {
    return (
      <ModalShell
        isOpen={isOpen}
        title="Prospect details"
        description="No prospect selected."
        onClose={onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="text-sm text-muted-foreground">Select a prospect first.</div>
      </ModalShell>
    );
  }

  const primaryLink = prospect.website || prospect.sourceUrl || "";
  const contact = prospect.contact || {};
  const contactFields = [contact.name, contact.title, contact.email, contact.phone, contact.linkedin];
  const contactCompleteness = contactFields.filter(Boolean).length;
  const hasWebsite = Boolean(prospect.website);
  const hasSource = Boolean(prospect.sourceUrl);
  const hasDirectContact = Boolean(contact.email || contact.phone || contact.linkedin);
  const strongConfidence = conf >= 80;
  const serviceFitTags = inferServiceFitTags(prospect);
  const valueBand = estimateMonthlyValueBand(prospect, conf, serviceFitTags);

  const nextActions: string[] = [];
  if (prospect.intentSignal) {
    nextActions.push(`Lead with this pain point: "${prospect.intentSignal}" and propose one matching lane/service.`);
  } else {
    nextActions.push("Validate route volume, shipment frequency, and service gaps before sending outreach.");
  }
  if (!hasDirectContact) {
    nextActions.push("Find logistics or procurement decision-maker contact (email or LinkedIn) before outreach.");
  } else {
    nextActions.push("Send a short outreach now and reference one concrete operations challenge from the summary.");
  }
  if (!hasSource) {
    nextActions.push("Open company website and capture one more public source to strengthen qualification.");
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title={prospect.companyName || "Prospect"}
      description="Review the prospect, validate evidence, and take the next outreach action."
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {tierPill}
            <span className="text-xs text-muted-foreground">{conf}% confidence</span>
            {typeof prospect.sourcesCount === "number" ? (
              <span className="text-xs text-muted-foreground">- Sources: {prospect.sourcesCount}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                const payload = JSON.stringify(prospect, null, 2);
                copyToClipboard(payload);
              }}
            >
              Copy JSON
            </Button>

            <Button
              variant="secondary"
              onClick={() => safeOpen(primaryLink)}
              disabled={!primaryLink}
              title={primaryLink ? "Open website/source" : "No link available"}
            >
              Open source
            </Button>

            <Button variant="primary" onClick={() => onDraftEmail(prospect)} disabled={!prospect.companyName}>
              Draft outreach email
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <SubtleCard className="p-4">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Company</div>
              <div className="mt-1 font-semibold text-foreground">{prospect.companyName || "-"}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">Location</div>
              <div className="mt-1 text-foreground">{prospect.location || "-"}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">Industry</div>
              <div className="mt-1 text-foreground">{prospect.industry || "-"}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">Company size</div>
              <div className="mt-1 text-foreground">{prospect.companySize || "-"}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-muted-foreground">Website / Source</div>
              <div className="mt-1 break-all text-foreground">{primaryLink || "-"}</div>
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Potential monthly value band</div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {formatMoney(valueBand.min)} - {formatMoney(valueBand.max)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Best service fit</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {serviceFitTags.map((tag) => (
                  <StatusPill key={tag} tone="info" label={tag} />
                ))}
              </div>
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Summary</div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {prospect.summary || "No summary provided."}
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Opportunity signal</div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {prospect.intentSignal || "No explicit intent signal captured. Validate operational need before outreach."}
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Qualification checklist</div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span>Company website</span>
              <StatusPill tone={hasWebsite ? "success" : "warn"} label={hasWebsite ? "Yes" : "Missing"} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span>Source evidence</span>
              <StatusPill tone={hasSource ? "success" : "warn"} label={hasSource ? "Yes" : "Missing"} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span>Direct contact route</span>
              <StatusPill tone={hasDirectContact ? "success" : "warn"} label={hasDirectContact ? "Ready" : "Needed"} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span>Confidence threshold (80%+)</span>
              <StatusPill tone={strongConfidence ? "success" : "info"} label={strongConfidence ? "Pass" : "Review"} />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Contact completeness: {contactCompleteness}/5
            {typeof prospect.sourcesCount === "number" ? ` - Sources found: ${prospect.sourcesCount}` : ""}
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Contact</div>
          <div className="mt-2 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="mt-1 text-foreground">{contact.name || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Title</div>
              <div className="mt-1 text-foreground">{contact.title || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="mt-1 break-all text-foreground">{contact.email || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Phone</div>
              <div className="mt-1 text-foreground">{contact.phone || "-"}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">LinkedIn</div>
              <div className="mt-1 break-all text-foreground">{contact.linkedin || "-"}</div>
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Recommended next actions</div>
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            {nextActions.map((action) => (
              <li key={action} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </SubtleCard>

        {onDisqualify ? (
          <SubtleCard className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Disqualify for workflow cleanup</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {DISQUALIFY_REASONS.map((reason) => (
                <Button key={reason} variant="danger" size="sm" onClick={() => onDisqualify(prospect, reason)}>
                  {reason}
                </Button>
              ))}
            </div>
          </SubtleCard>
        ) : null}
      </div>
    </ModalShell>
  );
};

