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

const ExportCustomersButtons: React.FC<{ className?: string }> = ({ className }) => {
  const { customers } = useData();

  const rows = customers as any[];

  const csvColumns: CsvColumn<any>[] = useMemo(
    () => [
      { key: 'company', header: 'Company', format: (_v, r) => String(getValue(r, ['company_name', 'companyName', 'company']) || '') },
      { key: 'contact', header: 'Contact Name', format: (_v, r) => String(getValue(r, ['contact_name', 'contactName', 'name', 'contact']) || '') },
      { key: 'email', header: 'Email', format: (_v, r) => String(getValue(r, ['email']) || '') },
      { key: 'phone', header: 'Phone', format: (_v, r) => String(getValue(r, ['phone', 'phone_number', 'phoneNumber']) || '') },
      { key: 'address', header: 'Address', format: (_v, r) => String(getValue(r, ['address', 'address_1', 'address1']) || '') },
      { key: 'city', header: 'City', format: (_v, r) => String(getValue(r, ['city']) || '') },
      { key: 'country', header: 'Country', format: (_v, r) => String(getValue(r, ['country']) || '') },
      { key: 'currency', header: 'Preferred Currency', format: (_v, r) => String(getValue(r, ['preferred_currency', 'preferredCurrency', 'currency']) || '') },
      { key: 'loyalty', header: 'Loyalty Points', format: (_v, r) => String(getValue(r, ['loyalty_points', 'loyaltyPoints']) || '') },
      { key: 'total_bookings', header: 'Total Bookings', format: (_v, r) => String(getValue(r, ['total_bookings', 'totalBookings']) || '') },
      { key: 'total_spent', header: 'Total Spent', format: (_v, r) => String(getValue(r, ['total_spent', 'totalSpent']) || '') },
      { key: 'verified', header: 'Verified', format: (_v, r) => String(getValue(r, ['is_verified', 'isVerified']) || '') },
      { key: 'created', header: 'Created At', format: (_v, r) => formatDate(getValue(r, ['created_at', 'createdAt'])) },
      { key: 'updated', header: 'Updated At', format: (_v, r) => formatDate(getValue(r, ['updated_at', 'updatedAt'])) },
    ],
    []
  );

  const xlsxColumns: XlsxColumn<any>[] = useMemo(
    () => [
      { key: 'company', title: 'Company', width: 26, format: (_v, r) => getValue(r, ['company_name', 'companyName', 'company']) },
      { key: 'contact', title: 'Contact Name', width: 24, format: (_v, r) => getValue(r, ['contact_name', 'contactName', 'name', 'contact']) },
      { key: 'email', title: 'Email', width: 28, format: (_v, r) => getValue(r, ['email']) },
      { key: 'phone', title: 'Phone', width: 18, format: (_v, r) => getValue(r, ['phone', 'phone_number', 'phoneNumber']) },
      { key: 'address', title: 'Address', width: 30, format: (_v, r) => getValue(r, ['address', 'address_1', 'address1']) },
      { key: 'city', title: 'City', width: 16, format: (_v, r) => getValue(r, ['city']) },
      { key: 'country', title: 'Country', width: 16, format: (_v, r) => getValue(r, ['country']) },
      { key: 'currency', title: 'Preferred Currency', width: 16, format: (_v, r) => getValue(r, ['preferred_currency', 'preferredCurrency', 'currency']) },
      { key: 'loyalty', title: 'Loyalty Points', width: 14, format: (_v, r) => getValue(r, ['loyalty_points', 'loyaltyPoints']) },
      { key: 'total_bookings', title: 'Total Bookings', width: 14, format: (_v, r) => getValue(r, ['total_bookings', 'totalBookings']) },
      { key: 'total_spent', title: 'Total Spent', width: 14, format: (_v, r) => getValue(r, ['total_spent', 'totalSpent']) },
      { key: 'verified', title: 'Verified', width: 10, format: (_v, r) => getValue(r, ['is_verified', 'isVerified']) },
      { key: 'created', title: 'Created At', width: 24, format: (_v, r) => formatDate(getValue(r, ['created_at', 'createdAt'])) },
      { key: 'updated', title: 'Updated At', width: 24, format: (_v, r) => formatDate(getValue(r, ['updated_at', 'updatedAt'])) },
    ],
    []
  );

  const disabled = !rows || rows.length === 0;

  const onExportCsv = () => {
    const name = `customers_${dateStamp()}.csv`;
    downloadCsv(rows, csvColumns, name);
  };

  const onExportXlsx = async () => {
    const name = `customers_${dateStamp()}.xlsx`;
    await downloadXlsx(rows, xlsxColumns, name);
  };

  return (
    <div className={className ? className : 'flex items-center gap-2'}>
      <Button variant="secondary" onClick={onExportCsv} disabled={disabled}>
        Export Customers (CSV)
      </Button>
      <Button variant="secondary" onClick={onExportXlsx} disabled={disabled}>
        Export Customers (XLSX)
      </Button>
    </div>
  );
};

export default ExportCustomersButtons;
