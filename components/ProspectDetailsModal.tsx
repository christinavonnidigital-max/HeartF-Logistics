import React, { useMemo } from "react";
import { ModalShell, Button, StatusPill, SubtleCard } from "./UiKit";

export type LeadFinderResult = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  summary?: string;
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
}> = ({ isOpen, prospect, onClose, onDraftEmail }) => {
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

  return (
    <ModalShell
      isOpen={isOpen}
      title={prospect.companyName || "Prospect"}
      description="Review the prospect, open sources, and draft an outreach email."
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {tierPill}
            <span className="text-xs text-muted-foreground">{conf}%</span>
            {typeof prospect.sourcesCount === "number" ? (
              <span className="text-xs text-muted-foreground">• Sources: {prospect.sourcesCount}</span>
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

            <Button
              variant="primary"
              onClick={() => onDraftEmail(prospect)}
              disabled={!prospect.companyName}
            >
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Company</div>
              <div className="mt-1 text-foreground font-semibold">{prospect.companyName || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">Location</div>
              <div className="mt-1 text-foreground">{prospect.location || "—"}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-muted-foreground">Website / Source</div>
              <div className="mt-1 text-foreground break-all">{primaryLink || "—"}</div>
            </div>
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Summary</div>
          <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
            {prospect.summary || "No summary provided."}
          </div>
        </SubtleCard>

        <SubtleCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground">Contact</div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="mt-1 text-foreground">{contact.name || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Title</div>
              <div className="mt-1 text-foreground">{contact.title || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="mt-1 text-foreground break-all">{contact.email || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Phone</div>
              <div className="mt-1 text-foreground">{contact.phone || "—"}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">LinkedIn</div>
              <div className="mt-1 text-foreground break-all">{contact.linkedin || "—"}</div>
            </div>
          </div>
        </SubtleCard>
      </div>
    </ModalShell>
  );
};
