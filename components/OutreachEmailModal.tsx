import React, { useMemo, useState } from "react";
import { ModalShell, Button, Input, Label, Select, Textarea, StatusPill, SubtleCard } from "./UiKit";
import type { LeadFinderResult } from "./ProspectDetailsModal";

type DraftResponse = {
  ok: boolean;
  email: {
    subject: string;
    body: string;
  };
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

export const OutreachEmailModal: React.FC<{
  isOpen: boolean;
  prospect: LeadFinderResult | null;
  onClose: () => void;
}> = ({ isOpen, prospect, onClose }) => {
  const [tone, setTone] = useState("professional");
  const [goal, setGoal] = useState("intro_call");
  const [length, setLength] = useState("short");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const canGenerate = useMemo(() => {
    return Boolean(prospect?.companyName) && !busy;
  }, [prospect?.companyName, busy]);

  const resetDraft = () => {
    setSubject("");
    setBody("");
  };

  const generate = async () => {
    if (!prospect?.companyName) return;

    setBusy(true);
    setError(null);
    resetDraft();

    try {
      const res = await fetch("/.netlify/functions/lead-finder-draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tone,
          goal,
          length,
          prospect,
        }),
      });

      const text = await res.text();
      let data: DraftResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Unexpected response from draft function.");
      }

      if (!res.ok || !data?.ok) {
        throw new Error((data as any)?.error || "Failed to draft email");
      }

      setSubject(data.email.subject || "");
      setBody(data.email.body || "");
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    const full = `Subject: ${subject}\n\n${body}`;
    await copyToClipboard(full);
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
            {!busy && !error && subject && body ? <StatusPill tone="success" label="Draft ready" /> : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={copyAll} disabled={!subject || !body}>
              Copy
            </Button>
            <Button variant="secondary" onClick={generate} disabled={!canGenerate}>
              {busy ? "Generating…" : "Generate"}
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
                <option value="quote">Request shipment/route details for a quote</option>
                <option value="partnership">Explore a logistics partnership</option>
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

          <div className="mt-3 text-xs text-muted-foreground">
            Tip: Click “Generate” again if you want a different approach. This does not send an email — it drafts text only.
          </div>
        </SubtleCard>

        <div>
          <Label>Subject</Label>
          <Input value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="Subject line..." />
        </div>

        <div>
          <Label>Body</Label>
          <Textarea value={body} onChange={(e: any) => setBody(e.target.value)} rows={12} placeholder="Email body..." />
        </div>
      </div>
    </ModalShell>
  );
};
