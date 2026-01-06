import Papa from 'papaparse';

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  errors?: string[];
};

export type ValidationIssue = { row: number; field: string; message: string };

export const parseCsvText = (text: string): ParsedCsv => {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  if (!parsed.data || !parsed.data.length) {
    return { headers: [], rows: [], errors: ['No data found in the CSV file.'] };
  }
  const [headerRow, ...dataRows] = parsed.data;
  const headers = headerRow as string[];
  const rows = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = (cells as any)[idx] ?? '';
    });
    return record;
  });
  return { headers, rows, errors: (parsed.errors || []).map((e) => e.message) };
};

export const validateRows = (
  rows: Record<string, string>[],
  requiredFields: string[],
  mapping: Record<string, string>
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  rows.forEach((row, index) => {
    requiredFields.forEach((field) => {
      const csvColumn = mapping[field];
      const value = csvColumn ? row[csvColumn] : undefined;
      if (!value || `${value}`.trim() === '') {
        issues.push({ row: index + 1, field, message: `${field} is required` });
      }
    });
  });
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
