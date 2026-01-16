import React, { useMemo } from 'react';
import { Button } from '../components/UiKit';
import { useData } from '../contexts/DataContext';
import { downloadCsv, CsvColumn } from './toCsv';
import { downloadXlsx, XlsxColumn } from './toXlsx';

function getValue(row: any, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

function formatDate(v: any) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString();
}

function dateStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const ExportLeadsButtons: React.FC<{ className?: string }> = ({ className }) => {
  const { leads } = useData();

  const rows = leads as any[];

  const csvColumns: CsvColumn<any>[] = useMemo(
    () => [
      { key: 'company', header: 'Company', format: (_v, r) => String(getValue(r, ['company_name', 'companyName', 'company']) || '') },
      { key: 'contact', header: 'Contact Name', format: (_v, r) => String(getValue(r, ['contact_name', 'contactName', 'name', 'contact']) || '') },
      { key: 'first', header: 'First Name', format: (_v, r) => String(getValue(r, ['first_name', 'firstName']) || '') },
      { key: 'last', header: 'Last Name', format: (_v, r) => String(getValue(r, ['last_name', 'lastName']) || '') },
      { key: 'email', header: 'Email', format: (_v, r) => String(getValue(r, ['email']) || '') },
      { key: 'phone', header: 'Phone', format: (_v, r) => String(getValue(r, ['phone', 'phone_number', 'phoneNumber']) || '') },
      { key: 'status', header: 'Status', format: (_v, r) => String(getValue(r, ['status']) || '') },
      { key: 'source', header: 'Source', format: (_v, r) => String(getValue(r, ['source']) || '') },
      { key: 'score', header: 'Score', format: (_v, r) => String(getValue(r, ['score']) || '') },
      { key: 'created', header: 'Created At', format: (_v, r) => formatDate(getValue(r, ['created_at', 'createdAt'])) },
      { key: 'updated', header: 'Updated At', format: (_v, r) => formatDate(getValue(r, ['updated_at', 'updatedAt'])) },
      { key: 'notes', header: 'Notes', format: (_v, r) => String(getValue(r, ['notes', 'note']) || '') },
    ],
    []
  );

  const xlsxColumns: XlsxColumn<any>[] = useMemo(
    () => [
      { key: 'company', title: 'Company', width: 26, format: (_v, r) => getValue(r, ['company_name', 'companyName', 'company']) },
      { key: 'contact', title: 'Contact Name', width: 24, format: (_v, r) => getValue(r, ['contact_name', 'contactName', 'name', 'contact']) },
      { key: 'first', title: 'First Name', width: 16, format: (_v, r) => getValue(r, ['first_name', 'firstName']) },
      { key: 'last', title: 'Last Name', width: 16, format: (_v, r) => getValue(r, ['last_name', 'lastName']) },
      { key: 'email', title: 'Email', width: 26, format: (_v, r) => getValue(r, ['email']) },
      { key: 'phone', title: 'Phone', width: 18, format: (_v, r) => getValue(r, ['phone', 'phone_number', 'phoneNumber']) },
      { key: 'status', title: 'Status', width: 14, format: (_v, r) => getValue(r, ['status']) },
      { key: 'source', title: 'Source', width: 14, format: (_v, r) => getValue(r, ['source']) },
      { key: 'score', title: 'Score', width: 10, format: (_v, r) => getValue(r, ['score']) },
      { key: 'created', title: 'Created At', width: 24, format: (_v, r) => formatDate(getValue(r, ['created_at', 'createdAt'])) },
      { key: 'updated', title: 'Updated At', width: 24, format: (_v, r) => formatDate(getValue(r, ['updated_at', 'updatedAt'])) },
      { key: 'notes', title: 'Notes', width: 36, format: (_v, r) => getValue(r, ['notes', 'note']) },
    ],
    []
  );

  const disabled = !rows || rows.length === 0;

  const onExportCsv = () => {
    const name = `leads_${dateStamp()}.csv`;
    downloadCsv(rows, csvColumns, name);
  };

  const onExportXlsx = async () => {
    const name = `leads_${dateStamp()}.xlsx`;
    await downloadXlsx(rows, xlsxColumns, name);
  };

  return (
    <div className={className ? className : 'flex items-center gap-2'}>
      <Button variant="secondary" onClick={onExportCsv} disabled={disabled}>
        Export Leads (CSV)
      </Button>
      <Button variant="secondary" onClick={onExportXlsx} disabled={disabled}>
        Export Leads (XLSX)
      </Button>
    </div>
  );
};

export default ExportLeadsButtons;
