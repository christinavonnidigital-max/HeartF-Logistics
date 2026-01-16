import React, { useMemo, useState } from "react";
import ImportModal from "../dataIO/ImportModal";
import type { TargetField } from "../dataIO/FieldMapping";
import { Button, ModalShell, SubtleCard, StatusPill, Select } from "./UiKit";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../auth/AuthContext";

type ImportCustomersButtonProps = {
  buttonLabel?: string;
  className?: string;
};

type MatchMode = "strict" | "balanced" | "loose";

type ImportSummary = {
  matchMode: MatchMode;
  created: number;
  updated: number;
  skipped: number;
  skippedByReview: number;
  parsedValidRows: number;
  failedValidationRows: number;
  failedProcessingRows: number;
};

type ReviewRow = {
  key: string;
  payload: any;
  match: any | null;
  reason: string | null;
  action: "create" | "update";
  selected: boolean;
};

function norm(v: any): string {
  return String(v ?? "").trim();
}

function normLower(v: any): string {
  return norm(v).toLowerCase();
}

function getValue(row: any, keys: string[]): string {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && norm(v) !== "") return norm(v);
  }
  return "";
}

function toNullableNumber(v: any): number | null {
  const s = norm(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mergePreferIncoming(existing: any, incoming: any) {
  const out: any = { ...existing };
  Object.keys(incoming).forEach((k) => {
    const v = incoming[k];
    const isEmpty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);

    if (!isEmpty) out[k] = v;
  });
  return out;
}

function buildCustomerPayload(row: Record<string, any>, actor: any) {
  const company = getValue(row, ["company", "company_name", "companyName"]);
  const contactName = getValue(row, ["contact_name", "contactName", "name", "contact"]);
  const email = normLower(getValue(row, ["email"]));
  const phone = getValue(row, ["phone", "phone_number", "phoneNumber"]);

  const address = getValue(row, ["address", "address_1", "address1"]);
  const city = getValue(row, ["city"]);
  const country = getValue(row, ["country"]);
  const preferredCurrency = getValue(row, ["preferred_currency", "preferredCurrency", "currency"]);
  const loyaltyPoints = toNullableNumber(getValue(row, ["loyalty_points", "loyaltyPoints"])) ?? 0;

  return {
    company_name: company,
    contact_name: contactName,
    email,
    phone,
    address,
    city,
    country,
    preferred_currency: preferredCurrency || undefined,
    loyalty_points: loyaltyPoints,
    companyName: company,
    contactName,
    phoneNumber: phone,
    address1: address,
    preferredCurrency: preferredCurrency || undefined,
    loyaltyPoints: loyaltyPoints,
    created_by: actor?.id ?? actor?.userId ?? null,
    createdBy: actor?.id ?? actor?.userId ?? null,
  };
}

function findExistingCustomer(customers: any[], incoming: any, mode: MatchMode) {
  const incomingEmail = normLower(getValue(incoming, ["email"]));
  const incomingCompany = normLower(getValue(incoming, ["company_name", "companyName", "company"]));
  const incomingPhone = norm(getValue(incoming, ["phone", "phone_number", "phoneNumber"]));

  const matchCompanyEmail = () => {
    if (!incomingCompany || !incomingEmail) return null;
    return (
      customers.find((c) => {
        const cCompany = normLower(getValue(c, ["company_name", "companyName", "company"]));
        const cEmail = normLower(getValue(c, ["email"]));
        return cCompany === incomingCompany && cEmail === incomingEmail;
      }) || null
    );
  };

  const matchEmail = () => {
    if (!incomingEmail) return null;
    return customers.find((c) => normLower(getValue(c, ["email"])) === incomingEmail) || null;
  };

  const matchCompanyPhone = () => {
    if (!incomingCompany || !incomingPhone) return null;
    return (
      customers.find((c) => {
        const cCompany = normLower(getValue(c, ["company_name", "companyName", "company"]));
        const cPhone = norm(getValue(c, ["phone", "phone_number", "phoneNumber"]));
        return cCompany === incomingCompany && cPhone === incomingPhone;
      }) || null
    );
  };

  const matchCompanyOnly = () => {
    if (!incomingCompany) return null;
    return (
      customers.find(
        (c) => normLower(getValue(c, ["company_name", "companyName", "company"])) === incomingCompany
      ) || null
    );
  };

  if (mode === "strict") {
    const m = matchCompanyEmail();
    return { match: m, reason: m ? "company+email" : null };
  }

  if (mode === "balanced") {
    const m1 = matchCompanyEmail();
    if (m1) return { match: m1, reason: "company+email" };
    const m2 = matchEmail();
    if (m2) return { match: m2, reason: "email" };
    return { match: null, reason: null };
  }

  const m1 = matchCompanyEmail();
  if (m1) return { match: m1, reason: "company+email" };
  const m2 = matchEmail();
  if (m2) return { match: m2, reason: "email" };
  const m3 = matchCompanyPhone();
  if (m3) return { match: m3, reason: "company+phone" };
  const m4 = matchCompanyOnly();
  if (m4) return { match: m4, reason: "company" };
  return { match: null, reason: null };
}

function safeKeyForRow(index: number, payload: any) {
  const company = normLower(getValue(payload, ["company_name", "companyName", "company"]));
  const email = normLower(getValue(payload, ["email"]));
  const phone = norm(getValue(payload, ["phone", "phone_number", "phoneNumber"]));
  return `${index}-${company}-${email}-${phone}`;
}

const ImportCustomersButton: React.FC<ImportCustomersButtonProps> = ({ buttonLabel, className }) => {
  const { customers, addCustomer, updateCustomer, logAuditEvent } = useData();
  const { user } = useAuth();

  const [openImport, setOpenImport] = useState(false);

  const [openReview, setOpenReview] = useState(false);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [reviewMeta, setReviewMeta] = useState<{ imported: number; failed: number }>({ imported: 0, failed: 0 });
  const [isApplying, setIsApplying] = useState(false);

  const [openSummary, setOpenSummary] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const [matchMode, setMatchMode] = useState<MatchMode>("balanced");

  const targetFields: TargetField[] = useMemo(
    () => [
      { key: "company", label: "Company", required: true, helper: "Customer company name" },
      { key: "contact_name", label: "Contact Name", required: true, helper: "Primary contact full name" },
      { key: "email", label: "Email", required: false },
      { key: "phone", label: "Phone", required: false },
      { key: "address", label: "Address", required: false },
      { key: "city", label: "City", required: false },
      { key: "country", label: "Country", required: false },
      { key: "preferred_currency", label: "Preferred Currency", required: false, helper: 'Examples: "USD", "ZWL"' },
      { key: "loyalty_points", label: "Loyalty Points", required: false },
    ],
    []
  );

  const matchModeHelp = useMemo(() => {
    if (matchMode === "strict") return "Strict: update only when BOTH company and email match. Safest.";
    if (matchMode === "balanced") return "Balanced: company+email first, then email. Recommended.";
    return "Loose: company+email, then email, then company+phone, then company-only. Most aggressive.";
  }, [matchMode]);

  const extraControls = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Match mode (dedupe behavior)</div>
          <div className="text-xs text-muted-foreground">{matchModeHelp}</div>
        </div>

        <div className="w-[260px] max-w-full">
          <Select value={matchMode} onChange={(e: any) => setMatchMode(String(e?.target?.value) as MatchMode)}>
            <option value="strict">Strict</option>
            <option value="balanced">Balanced</option>
            <option value="loose">Loose</option>
          </Select>
        </div>
      </div>

      {matchMode === "loose" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Warning: Loose mode can update the wrong customer if company names are reused or inconsistent.
          Use the review step carefully.
        </div>
      ) : null}
    </div>
  );

  const computeReviewRows = (rows: Record<string, any>[]) => {
    const actor = user
      ? {
          id: user.userId,
          role: user.role,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          userId: user.userId,
        }
      : null;

    const existing = ((customers as any[]) || []).slice();
    const out: ReviewRow[] = [];

    let failedProcessingRows = 0;

    rows.forEach((r, idx) => {
      try {
        const payload = buildCustomerPayload(r, actor);

        const identityCompany = norm(getValue(payload, ["company_name", "companyName", "company"]));
        const identityEmail = normLower(getValue(payload, ["email"]));
        const identityPhone = norm(getValue(payload, ["phone", "phone_number", "phoneNumber"]));

        if (!identityCompany && !identityEmail && !identityPhone) {
          out.push({
            key: safeKeyForRow(idx, payload),
            payload,
            match: null,
            reason: "no-identity",
            action: "create",
            selected: false,
          });
          return;
        }

        const { match, reason } = findExistingCustomer(existing, payload, matchMode);
        if (match) {
          out.push({
            key: safeKeyForRow(idx, payload),
            payload,
            match,
            reason: reason || "match",
            action: "update",
            selected: true,
          });
        } else {
          out.push({
            key: safeKeyForRow(idx, payload),
            payload,
            match: null,
            reason: null,
            action: "create",
            selected: true,
          });
          existing.unshift(payload);
        }
      } catch {
        failedProcessingRows += 1;
        out.push({
          key: `error-${idx}`,
          payload: {},
          match: null,
          reason: "processing-error",
          action: "create",
          selected: false,
        });
      }
    });

    return { rows: out, failedProcessingRows };
  };

  const applyImport = async (rowsToApply: ReviewRow[], failedProcessingAlready: number) => {
    const actor = user
      ? {
          id: user.userId,
          role: user.role,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          userId: user.userId,
        }
      : null;

    const existing = ((customers as any[]) || []).slice();

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let skippedByReview = 0;
    let failedProcessingRows = failedProcessingAlready;

    for (const rr of rowsToApply) {
      try {
        if (rr.reason === "processing-error") {
          skipped += 1;
          continue;
        }

        if (rr.reason === "no-identity") {
          skipped += 1;
          continue;
        }

        if (rr.action === "update") {
          if (!rr.selected) {
            skippedByReview += 1;
            continue;
          }

          const match = rr.match;
          if (!match) {
            addCustomer(rr.payload as any);
            created += 1;
            existing.unshift(rr.payload);
            continue;
          }

          const next = mergePreferIncoming(match, rr.payload);
          next.id = match.id;

          updateCustomer(next as any);
          updated += 1;

          const idx = existing.findIndex((c) => c.id === match.id);
          if (idx >= 0) existing[idx] = next;
        } else {
          if (!rr.selected) {
            skipped += 1;
            continue;
          }
          addCustomer(rr.payload as any);
          created += 1;
          existing.unshift(rr.payload);
        }
      } catch {
        failedProcessingRows += 1;
      }
    }

    const stats: ImportSummary = {
      matchMode,
      created,
      updated,
      skipped: skipped + skippedByReview,
      skippedByReview,
      parsedValidRows: reviewMeta.imported,
      failedValidationRows: reviewMeta.failed,
      failedProcessingRows,
    };

    setSummary(stats);
    setOpenSummary(true);

    logAuditEvent({
      action: "import.customers",
      entity: { type: "customers", id: "bulk", ref: "csv-import" },
      meta: stats,
      actor: actor ?? undefined,
    } as any);
  };

  const onImport = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
    setReviewMeta(meta);

    const { rows: computed, failedProcessingRows } = computeReviewRows(rows);

    const updateCount = computed.filter(
      (r) => r.action === "update" && r.reason !== "processing-error" && r.reason !== "no-identity"
    ).length;

    if (updateCount > 0) {
      setReviewRows(computed);
      setOpenReview(true);
      (window as any).__customerImportFailedProcessing = failedProcessingRows;
    } else {
      setIsApplying(true);
      Promise.resolve()
        .then(() => applyImport(computed, failedProcessingRows))
        .finally(() => setIsApplying(false));
    }
  };

  const updatesTotal = useMemo(
    () =>
      reviewRows.filter(
        (r) => r.action === "update" && r.reason !== "processing-error" && r.reason !== "no-identity"
      ).length,
    [reviewRows]
  );

  const updatesSelected = useMemo(
    () =>
      reviewRows.filter(
        (r) => r.action === "update" && r.selected && r.reason !== "processing-error" && r.reason !== "no-identity"
      ).length,
    [reviewRows]
  );

  const setAllUpdates = (selected: boolean) => {
    setReviewRows((prev) =>
      prev.map((r) =>
        r.action === "update" && r.reason !== "processing-error" && r.reason !== "no-identity"
          ? { ...r, selected }
          : r
      )
    );
  };

  const toggleRow = (key: string, selected: boolean) => {
    setReviewRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected } : r)));
  };

  const confirmReview = async () => {
    const failedProcessingRows = Number((window as any).__customerImportFailedProcessing ?? 0);

    setIsApplying(true);
    try {
      await applyImport(reviewRows, failedProcessingRows);
      setOpenReview(false);
      setReviewRows([]);
      (window as any).__customerImportFailedProcessing = 0;
    } finally {
      setIsApplying(false);
    }
  };

  const cancelReview = () => {
    setOpenReview(false);
    setReviewRows([]);
    (window as any).__customerImportFailedProcessing = 0;
  };

  const totalFailures = (summary?.failedValidationRows ?? 0) + (summary?.failedProcessingRows ?? 0);
  const summaryTone = totalFailures > 0 ? "warn" : (summary?.skipped ?? 0) > 0 ? "info" : "success";

  return (
    <>
      <Button className={className} variant="secondary" onClick={() => setOpenImport(true)} disabled={isApplying}>
        {buttonLabel ?? "Import Customers (CSV)"}
      </Button>

      <ImportModal
        isOpen={openImport}
        onClose={() => setOpenImport(false)}
        title="Import Customers from CSV"
        description="Upload a CSV file, map columns, and import customers. If potential overwrites are detected, you’ll get a review step."
        targetFields={targetFields}
        onImport={onImport}
        extraControls={extraControls}
      />

      <ModalShell
        isOpen={openReview}
        onClose={cancelReview}
        title="Review potential updates"
        description="These rows match existing customers and would overwrite data. Uncheck any row you do not want to update."
        footer={
          <div className="flex w/full items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Updates selected: <span className="font-semibold text-foreground">{updatesSelected}</span> /{" "}
              <span className="font-semibold text-foreground">{updatesTotal}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={cancelReview} disabled={isApplying}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmReview} disabled={isApplying}>
                {isApplying ? "Applying..." : "Confirm import"}
              </Button>
            </div>
          </div>
        }
        maxWidthClass="max-w-6xl"
      >
        <div className="space-y-3">
          <SubtleCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusPill tone={matchMode === "loose" ? "warn" : "info"} label={`Match mode: ${matchMode}`} />
                <div className="text-xs text-muted-foreground">{matchModeHelp}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAllUpdates(true)} disabled={isApplying}>
                  Select all updates
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAllUpdates(false)} disabled={isApplying}>
                  Select none
                </Button>
              </div>
            </div>
          </SubtleCard>

          <div className="overflow-auto rounded-2xl border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[72px]">Update?</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Incoming (from CSV)</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Matched existing</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[180px]">Match reason</th>
                </tr>
              </thead>

              <tbody>
                {reviewRows
                  .filter((r) => r.action === "update" && r.reason !== "processing-error" && r.reason !== "no-identity")
                  .map((r) => {
                    const inCompany = getValue(r.payload, ["company_name", "companyName", "company"]);
                    const inEmail = getValue(r.payload, ["email"]);
                    const inPhone = getValue(r.payload, ["phone", "phone_number", "phoneNumber"]);
                    const inContact = getValue(r.payload, ["contact_name", "contactName", "name", "contact"]);

                    const exCompany = getValue(r.match, ["company_name", "companyName", "company"]);
                    const exEmail = getValue(r.match, ["email"]);
                    const exPhone = getValue(r.match, ["phone", "phone_number", "phoneNumber"]);
                    const exContact = getValue(r.match, ["contact_name", "contactName", "name", "contact"]);

                    return (
                      <tr key={r.key} className="border-t border-border">
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand-600"
                              checked={r.selected}
                              onChange={(e) => toggleRow(r.key, e.target.checked)}
                              disabled={isApplying}
                            />
                            <span className="text-xs text-muted-foreground">{r.selected ? "Yes" : "No"}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="font-medium text-foreground">{inCompany || "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Contact: <span className="text-foreground">{inContact || "—"}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Email: <span className="text-foreground">{inEmail || "—"}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Phone: <span className="text-foreground">{inPhone || "—"}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="font-medium text-foreground">{exCompany || "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Contact: <span className="text-foreground">{exContact || "—"}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Email: <span className="text-foreground">{exEmail || "—"}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Phone: <span className="text-foreground">{exPhone || "—"}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <StatusPill
                            tone={r.reason === "company" || r.reason === "company+phone" ? "warn" : "info"}
                            label={r.reason || "match"}
                          />
                        </td>
                      </tr>
                    );
                  })}

                {updatesTotal === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-sm text-muted-foreground" colSpan={4}>
                      No potential updates detected.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {matchMode === "loose" ? (
            <div className="text-xs text-muted-foreground">
              Loose mode can match by company-only. Rows matched by <span className="font-semibold text-foreground">company</span>{" "}
              or <span className="font-semibold text-foreground">company+phone</span> are highlighted as warnings above.
            </div>
          ) : null}
        </div>
      </ModalShell>

      <ModalShell
        isOpen={openSummary}
        onClose={() => setOpenSummary(false)}
        title="Customer import summary"
        description="Here’s what happened during the import."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="primary" onClick={() => setOpenSummary(false)}>
              Done
            </Button>
          </div>
        }
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Result</div>
            <StatusPill
              tone={summaryTone as any}
              label={totalFailures > 0 ? "Imported with warnings" : "Import successful"}
            />
          </div>

          <SubtleCard className="p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Match mode</span>
                <span className="font-semibold">{summary?.matchMode ?? "balanced"}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">{summary?.created ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-semibold">{summary?.updated ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Skipped</span>
                <span className="font-semibold">{summary?.skipped ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Skipped by review</span>
                <span className="font-semibold">{summary?.skippedByReview ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Valid rows processed</span>
                <span className="font-semibold">{summary?.parsedValidRows ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Failed validation</span>
                <span className="font-semibold">{summary?.failedValidationRows ?? 0}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Failed processing</span>
                <span className="font-semibold">{summary?.failedProcessingRows ?? 0}</span>
              </div>
            </div>
          </SubtleCard>

          <div className="text-xs text-muted-foreground">
            Tip: “Failed validation” means required fields were missing. “Failed processing” means a row caused an unexpected runtime error.
          </div>
        </div>
      </ModalShell>
    </>
  );
};

export default ImportCustomersButton;
