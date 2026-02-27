import React from 'react';
import { Button } from '../components/UiKit';
import { useData } from '../contexts/DataContext';
import { downloadCsv } from './toCsv';
import { downloadXlsx } from './toXlsx';
import { buildLeadExportRows, leadCsvColumns, leadXlsxColumns } from './leadExportColumns';

function dateStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const ExportLeadsButtons: React.FC<{ className?: string }> = ({ className }) => {
  const { leads, leadActivities, opportunities } = useData();

  const rows = buildLeadExportRows(leads, leadActivities, opportunities) as any[];

  const disabled = !rows || rows.length === 0;

  const onExportCsv = () => {
    const name = `leads_full_${dateStamp()}.csv`;
    downloadCsv(rows, leadCsvColumns as any, name);
  };

  const onExportXlsx = async () => {
    const name = `leads_full_${dateStamp()}.xlsx`;
    await downloadXlsx(rows, leadXlsxColumns as any, name);
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
