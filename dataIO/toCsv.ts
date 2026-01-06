export type CsvColumn<T> = {
  key: keyof T | string;
  header: string;
  format?: (value: any, row: T) => string | number;
};

const escapeCell = (value: any) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildCsv = <T extends Record<string, any>>(rows: T[], columns: CsvColumn<T>[]) => {
  const headerLine = columns.map((c) => c.header).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = typeof col.key === 'string' ? row[col.key] : (row as any)[col.key as string];
          const formatted = col.format ? col.format(raw, row) : raw;
          return escapeCell(formatted);
        })
        .join(','),
    )
    .join('\n');
  return `${headerLine}\n${body}`;
};

export const downloadCsv = <T extends Record<string, any>>(rows: T[], columns: CsvColumn<T>[], filename: string) => {
  const csv = buildCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
