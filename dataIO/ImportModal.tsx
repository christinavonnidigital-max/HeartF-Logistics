import React, { useEffect, useMemo, useState } from 'react';
import { ModalShell, Button, SubtleCard } from '../components/UiKit';
import FieldMapping, { TargetField } from './FieldMapping';
import { parseCsvText, validateRows, autoMapHeaders } from './parseCsv';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  targetFields: TargetField[];
  onImport: (rows: Record<string, any>[], meta: { imported: number; failed: number }) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, targetFields, onImport, title, description }) => {
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<string[]>([]);
  const [rowIssues, setRowIssues] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFileName('');
      setHeaders([]);
      setRows([]);
      setMapping({});
      setIssues([]);
      setRowIssues([]);
    }
  }, [isOpen]);

  const requiredKeys = useMemo(() => targetFields.filter((f) => f.required).map((f) => f.key), [targetFields]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsvText(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setIssues(parsed.errors || []);
    setMapping(autoMapHeaders(parsed.headers, targetFields));
  };

  const handleImport = () => {
    if (!rows.length) {
      setIssues(['Please upload a CSV file first.']);
      return;
    }
    const missingRequired = requiredKeys.filter((k) => !mapping[k]);
    if (missingRequired.length) {
      setIssues([`Map required fields: ${missingRequired.join(', ')}`]);
      return;
    }
    const validation = validateRows(rows, requiredKeys, mapping);
    if (validation.length) {
      setRowIssues(validation.slice(0, 5).map((v) => `Row ${v.row}: ${v.field} - ${v.message}`));
      setIssues(['Please fix required fields in the CSV and try again.']);
      return;
    }

    setIsProcessing(true);
    try {
      const mapped = rows.map((row) => {
        const obj: Record<string, any> = {};
        Object.entries(mapping).forEach(([fieldKey, columnName]) => {
          obj[fieldKey] = columnName ? row[columnName] : '';
        });
        return obj;
      });
      onImport(mapped, { imported: mapped.length, failed: 0 });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Import data'}
      description={description || 'Upload a CSV, map the columns, and apply the import.'}
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-foreground-muted">
            {rows.length ? `${rows.length} row(s) ready` : 'Awaiting CSV upload'}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button variant="primary" onClick={handleImport} disabled={isProcessing || !rows.length}>
              {isProcessing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 bg-card cursor-pointer hover:border-orange-300">
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            <div>
              <p className="text-sm font-semibold text-foreground">Upload CSV</p>
              <p className="text-xs text-foreground-muted">UTF-8 CSV with a header row.</p>
            </div>
          </label>
          {fileName && <div className="text-sm text-foreground-muted truncate">{fileName}</div>}
        </div>

        {issues.length > 0 && (
          <SubtleCard className="p-3 border border-rose-100 bg-rose-50">
            <p className="text-sm font-semibold text-rose-700">Issues</p>
            <ul className="mt-1 text-xs text-rose-600 space-y-1">
              {issues.map((i, idx) => <li key={idx}>- {i}</li>)}
            </ul>
          </SubtleCard>
        )}

        {headers.length > 0 && (
          <SubtleCard className="p-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Map columns</h4>
            <FieldMapping headers={headers} targetFields={targetFields} mapping={mapping} onChange={setMapping} />
          </SubtleCard>
        )}

        {rows.length > 0 && (
          <SubtleCard className="p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Preview</h4>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-muted text-foreground">
                  <tr>
                    {Object.keys(mapping).map((key) => (
                      <th key={key} className="px-2 py-1 text-left capitalize">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {Object.entries(mapping).map(([fieldKey, col]) => (
                        <td key={fieldKey} className="px-2 py-1 text-foreground-muted">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="text-[11px] text-foreground-muted px-2 py-1">Showing first 5 rows of {rows.length}</div>
              )}
            </div>
            {rowIssues.length > 0 && (
              <div className="text-xs text-rose-600 space-y-1">
                {rowIssues.map((i, idx) => <div key={idx}>- {i}</div>)}
              </div>
            )}
          </SubtleCard>
        )}
      </div>
    </ModalShell>
  );
};

export default ImportModal;
