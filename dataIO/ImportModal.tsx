import React, { useEffect, useMemo, useState } from 'react';
import { ModalShell, Button, SubtleCard } from '../components/UiKit';
import FieldMapping, { TargetField } from './FieldMapping';
import { parseCsvText, validateRows, autoMapHeaders, ValidationIssue } from './parseCsv';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  targetFields: TargetField[];
  onImport: (rows: Record<string, any>[], meta: { imported: number; failed: number }) => void;

  // Optional UI slot rendered inside the modal (for extra import options like match mode)
  extraControls?: React.ReactNode;
}

type Stage = 'idle' | 'parsed';

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  targetFields,
  onImport,
  title,
  description,
  extraControls,
}) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const requiredKeys = useMemo(
    () => targetFields.filter((f) => f.required).map((f) => f.key),
    [targetFields]
  );

  const validationIssues: ValidationIssue[] = useMemo(() => {
    if (!rows.length) return [];
    return validateRows(rows, requiredKeys, mapping);
  }, [rows, requiredKeys, mapping]);

  const issueLines = useMemo(() => {
    if (!validationIssues.length) return [];
    const max = 12;
    const lines = validationIssues
      .slice(0, max)
      .map((i) => `Row ${i.row}: ${i.field} — ${i.message}`);
    if (validationIssues.length > max) lines.push(`…and ${validationIssues.length - max} more issue(s).`);
    return lines;
  }, [validationIssues]);

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const reset = () => {
    setStage('idle');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setErrors([]);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }
    reset();
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setErrors([]);
    setIsProcessing(true);

    try {
      const text = await f.text();
      const parsed = parseCsvText(text);

      const errs = parsed.errors ?? [];
      if (errs.length) setErrors(errs);

      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setFileName(f.name);

      const auto = autoMapHeaders(parsed.headers, targetFields);
      setMapping(auto);

      setStage('parsed');
    } catch {
      setErrors(['Failed to read or parse the CSV file.']);
      setStage('idle');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const buildMappedRows = () => {
    const out: Record<string, any>[] = [];

    for (const r of rows) {
      const obj: Record<string, any> = {};
      for (const tf of targetFields) {
        const columnName = mapping[tf.key];
        obj[tf.key] = columnName ? (r[columnName] ?? '').trim() : '';
      }
      out.push(obj);
    }

    return out;
  };

  const isRowValid = (rowObj: Record<string, any>) => {
    for (const key of requiredKeys) {
      const v = rowObj[key];
      if (v === null || v === undefined || String(v).trim() === '') return false;
    }
    return true;
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const mapped = buildMappedRows();

      const valid: Record<string, any>[] = [];
      let failed = 0;

      for (const m of mapped) {
        if (isRowValid(m)) valid.push(m);
        else failed += 1;
      }

      onImport(valid, { imported: valid.length, failed });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="text-xs text-muted-foreground">
        {rows.length ? `${rows.length} row(s) loaded` : 'Awaiting CSV upload'}
        {fileName ? ` • ${fileName}` : ''}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={isProcessing || !rows.length || validationIssues.length > 0}
        >
          {isProcessing ? 'Importing...' : 'Import'}
        </Button>
      </div>
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? 'Import CSV'}
      description={description}
      footer={footer}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 cursor-pointer hover:border-orange-300">
            <div className="min-w-0">
              <div className="font-medium text-foreground">Upload CSV</div>
              <div className="text-xs text-muted-foreground truncate">
                {fileName ? fileName : 'Choose a .csv file to import'}
              </div>
            </div>

            <div className="shrink-0">
              <Button variant="secondary" onClick={() => {}} disabled={isProcessing}>
                Browse
              </Button>
            </div>

            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          </label>

          {stage !== 'idle' ? (
            <Button variant="ghost" onClick={reset} disabled={isProcessing}>
              Reset
            </Button>
          ) : null}
        </div>

        {errors.length > 0 ? (
          <SubtleCard>
            <div className="text-sm font-medium text-rose-700">CSV Issues</div>
            <div className="mt-2 space-y-1 text-xs text-rose-700">
              {errors.map((e, idx) => (
                <div key={idx}>• {e}</div>
              ))}
            </div>
          </SubtleCard>
        ) : null}

        {stage === 'parsed' ? (
          <div className="space-y-4">
            {extraControls ? <SubtleCard>{extraControls}</SubtleCard> : null}

            <SubtleCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Map fields</div>
                  <div className="text-xs text-muted-foreground">
                    Map your CSV columns to the fields used by this import.
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Headers detected: <span className="font-medium text-foreground">{headers.length}</span>
                </div>
              </div>

              <div className="mt-3">
                <FieldMapping
                  headers={headers}
                  targetFields={targetFields}
                  mapping={mapping}
                  onChange={setMapping}
                />
              </div>

              {issueLines.length > 0 ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <div className="text-sm font-medium text-rose-800">Fix these before importing</div>
                  <div className="mt-2 space-y-1 text-xs text-rose-700">
                    {issueLines.map((line, idx) => (
                      <div key={idx}>• {line}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-sm font-medium text-emerald-800">Looks good</div>
                  <div className="mt-1 text-xs text-emerald-700">
                    All required fields are mapped and present in the data.
                  </div>
                </div>
              )}
            </SubtleCard>

            {previewRows.length ? (
              <SubtleCard>
                <div className="text-sm font-medium text-foreground">Preview (first {previewRows.length} row(s))</div>
                <div className="mt-2 overflow-auto rounded-lg border border-border bg-card">
                  <table className="min-w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {headers.slice(0, 10).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, idx) => (
                        <tr key={idx} className="border-t border-border">
                          {headers.slice(0, 10).map((h) => (
                            <td key={h} className="px-3 py-2 text-foreground">
                              {(r[h] ?? '').slice(0, 160)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {headers.length > 10 ? (
                  <div className="mt-2 text-xs text-muted-foreground">Showing the first 10 columns.</div>
                ) : null}
              </SubtleCard>
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
};

export default ImportModal;
