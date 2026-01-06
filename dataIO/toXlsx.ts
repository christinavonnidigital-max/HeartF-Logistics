import writeXlsxFile, { Column } from 'write-excel-file';

export type XlsxColumn<T> = Column & { key: keyof T | string; format?: (value: any, row: T) => any };

export const downloadXlsx = async <T extends Record<string, any>>(
  rows: T[],
  columns: XlsxColumn<T>[],
  filename: string
) => {
  const sheetData = rows.map((row) =>
    columns.map((col) => {
      const raw = typeof col.key === 'string' ? row[col.key] : (row as any)[col.key as string];
      return col.format ? col.format(raw, row) : raw;
    }),
  );

  await writeXlsxFile(sheetData, {
    columns: columns.map(({ key, format, ...rest }) => rest as Column),
    fileName: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  });
};
