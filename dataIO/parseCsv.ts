import Papa from "papaparse";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  errors?: string[];
};

export type ValidationIssue = { row: number; field: string; message: string };

function normalizeHeader(h: string): string {
  return (h ?? "").trim();
}

function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h) => {
    const base = h || "Column";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

export const parseCsvText = (text: string): ParsedCsv => {
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  if (parsed.errors?.length) {
    for (const e of parsed.errors) errors.push(e.message || "CSV parse error");
  }

  const data = parsed.data || [];
  if (!data.length) {
    return { headers: [], rows: [], errors: ["No data found in the CSV file."] };
  }

  const [rawHeaderRow, ...dataRows] = data;

  const headersRaw = (rawHeaderRow || [])
    .map((h) => normalizeHeader(String(h ?? "")))
    .filter((h) => h.length > 0);

  if (!headersRaw.length) {
    return { headers: [], rows: [], errors: ["CSV header row is empty or invalid."] };
  }

  const headers = uniqueHeaders(headersRaw);

  const rows: Record<string, string>[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const rowArr = dataRows[i] || [];
    const rowObj: Record<string, string> = {};

    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      rowObj[key] = normalizeCell(rowArr[c]);
    }

    const hasAnyValue = Object.values(rowObj).some((v) => v.trim() !== "");
    if (hasAnyValue) rows.push(rowObj);
  }

  return { headers, rows, errors: errors.length ? errors : undefined };
};

export const validateRows = (
  rows: Record<string, string>[],
  requiredKeys: string[],
  mapping: Record<string, string>
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const required = requiredKeys || [];
  const map = mapping || {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    for (const fieldKey of required) {
      const columnName = map[fieldKey];
      if (!columnName) {
        if (rowNumber === 1) {
          issues.push({
            row: 1,
            field: fieldKey,
            message: "Required field is not mapped to any CSV column.",
          });
        }
        continue;
      }

      const value = (row?.[columnName] ?? "").trim();
      if (!value) {
        issues.push({
          row: rowNumber,
          field: fieldKey,
          message: `Missing required value (mapped from "${columnName}").`,
        });
      }
    }
  }

  return issues;
};

export const autoMapHeaders = (headers: string[], targetFields: { key: string; label: string }[]) => {
  const mapping: Record<string, string> = {};
  targetFields.forEach((field) => {
    const found = headers.find(
      (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase() === field.label.toLowerCase()
    );
    if (found) mapping[field.key] = found;
  });
  return mapping;
};
