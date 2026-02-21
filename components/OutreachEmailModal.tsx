import React, { useMemo, useState } from "react";
import { ModalShell, Button, Input, Label, Select, Textarea, StatusPill, SubtleCard } from "./UiKit";
import type { LeadFinderResult } from "./ProspectDetailsModal";

type DraftResponse = {
  ok: boolean;
  emails: { subject: string; body: string }[];
  personalization?: { urlAttempted?: string | null; urlUsed?: string | null; snippetsUsed?: boolean };
};

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

export type SavedDraft = {
  subject: string;
  body: string;
  meta?: {
    tone: string;
    goal: string;
    length: string;
    personalized: boolean;
    url?: string | null;
  };
};

export const OutreachEmailModal: React.FC<{
  isOpen: boolean;
  prospect: LeadFinderResult | null;
  onClose: () => void;
  onSaveDraftForImport: (prospectId: string, draft: SavedDraft) => void;
}> = ({ isOpen, prospect, onClose, onSaveDraftForImport }) => {
  const [tone, setTone] = useState("professional");
  const [goal, setGoal] = useState("intro_call");
  const [length, setLength] = useState("short");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variants, setVariants] = useState<{ subject: string; body: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [personalizationInfo, setPersonalizationInfo] = useState<{ snippetsUsed?: boolean; urlUsed?: string | null } | null>(null);

  const active = variants[activeIndex] || { subject: "", body: "" };

  const canGenerate = useMemo(() => Boolean(prospect?.companyName) && !busy, [prospect?.companyName, busy]);

  const reset = () => {
    setVariants([]);
    setActiveIndex(0);
    setPersonalizationInfo(null);
  };

  const generate = async () => {
    if (!prospect?.companyName) return;

    setBusy(true);
    setError(null);
    reset();

    try {
      const subject = `[${goal === "intro_call" ? "Intro" : "Update"}] ${prospect.companyName} logistics`;
      const body = [
        `Hi ${prospect.contact?.name || "there"},`,
        "",
        `I lead operations at Heartfledge Logistics. We help companies like ${prospect.companyName} with reliable ${prospect.industry || "logistics"} support in ${prospect.location || "your region"}.`,
        "",
        goal === "intro_call"
          ? "Could we schedule a short intro call to understand your routes and SLAs?"
          : "Sharing a quick update on capacity and cross-border coverage this month.",
        "",
        "If helpful, I can share a lane plan or pricing benchmarks.",
        "",
        "Thanks,\nHeartfledge Team",
      ].join("\n");

      const variants = [
        { subject, body },
        { subject: `${prospect.companyName}: streamline fleet ops`, body: body.replace("schedule a short intro call", "set up a 15-minute call") },
        { subject: `Support for ${prospect.location || "your"} lanes`, body },
      ];

      setVariants(variants);
      setActiveIndex(0);
      setPersonalizationInfo({ snippetsUsed: false, urlUsed: prospect.website || prospect.sourceUrl || null });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    await generate();
  };

  const copyAll = async () => {
    const full = `Subject: ${active.subject}\n\n${active.body}`;
    await copyToClipboard(full);
  };

  const attachToImport = () => {
    if (!prospect?.id) return;
    if (!active.subject || !active.body) return;

    onSaveDraftForImport(prospect.id, {
      subject: active.subject,
      body: active.body,
      meta: {
        tone,
        goal,
        length,
        personalized: Boolean(personalizationInfo?.snippetsUsed),
        url: personalizationInfo?.urlUsed ?? (prospect.website || prospect.sourceUrl || null),
      },
    });
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="Draft outreach email"
      description={prospect?.companyName ? `Prospect: ${prospect.companyName}` : "No prospect selected."}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {error ? <StatusPill tone="warn" label={error} /> : null}
            {busy ? <StatusPill tone="info" label="Generating…" /> : null}
            {!busy && !error && active.subject && active.body ? <StatusPill tone="success" label="Draft ready" /> : null}
            {personalizationInfo?.snippetsUsed ? <StatusPill tone="info" label="Personalized from source" /> : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={copyAll} disabled={!active.subject || !active.body}>
              Copy
            </Button>
            <Button variant="secondary" onClick={regenerate} disabled={!canGenerate}>
              {busy ? "Generating…" : "Regenerate (3)"}
            </Button>
            <Button variant="primary" onClick={attachToImport} disabled={!prospect?.id || !active.subject || !active.body}>
              Attach to import
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onChange={(e: any) => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="direct">Direct</option>
                <option value="executive">Executive</option>
              </Select>
            </div>

            <div>
              <Label>Goal</Label>
              <Select value={goal} onChange={(e: any) => setGoal(e.target.value)}>
                <option value="intro_call">Book a 15-min intro call</option>
                <option value="quote">Request routes/volumes for a quote</option>
                <option value="partnership">Explore a partnership</option>
              </Select>
            </div>

            <div>
              <Label>Length</Label>
              <Select value={length} onChange={(e: any) => setLength(e.target.value)}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Generates 3 distinct variants. “Personalized” only uses text snippets extracted from the prospect source URL.
            </div>
            <Button variant="secondary" onClick={generate} disabled={!canGenerate}>
              {busy ? "Generating…" : "Generate"}
            </Button>
          </div>

          {personalizationInfo?.urlUsed ? (
            <div className="mt-2 text-xs text-muted-foreground break-all">
              Source used: {personalizationInfo.urlUsed}
            </div>
          ) : null}
        </SubtleCard>

        {variants.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {variants.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition " +
                  (idx === activeIndex ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground hover:bg-muted")
                }
              >
                Variant {idx + 1}
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <Label>Subject</Label>
          <Input value={active.subject} readOnly placeholder="Generate to see subject..." />
        </div>

        <div>
          <Label>Body</Label>
          <Textarea value={active.body} readOnly rows={12} placeholder="Generate to see email body..." />
        </div>
      </div>
    </ModalShell>
  );
};
