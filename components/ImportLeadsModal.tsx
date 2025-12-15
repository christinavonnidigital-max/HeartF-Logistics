
import React, { useState } from 'react';
import * as Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import { Lead } from '../types';
import { CloseIcon, UploadIcon } from './icons';

interface ImportLeadsModalProps {
  onClose: () => void;
  onImport: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>[]) => void;
}

type ParsedData = Array<Record<string, string | number | boolean | Date | null>>;

const LEAD_FIELDS: (keyof Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>)[] = [
    'first_name', 'last_name', 'email', 'phone', 'company_name', 
    'lead_source', 'lead_status', 'company_size', 'industry', 'position', 
    'website', 'address', 'city', 'country', 'logistics_needs'
];

const autoMapHeader = (header: string): string => {
    const lowerHeader = header.toLowerCase().replace(/ /g, '_');
    const mapping: { [key: string]: string } = {
        'first': 'first_name',
        'first_name': 'first_name',
        'last': 'last_name',
        'last_name': 'last_name',
        'email_address': 'email',
        'company': 'company_name',
        'phone_number': 'phone',
        'source': 'lead_source',
        'status': 'lead_status',
        'size': 'company_size',
        'needs': 'logistics_needs',
    };
    return mapping[lowerHeader] || '';
};

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ onClose, onImport }) => {
    const [step, setStep] = useState(1);
    const [headers, setHeaders] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<ParsedData>([]);
    const [columnMap, setColumnMap] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setError('');

        try {
            const fileName = selectedFile.name.toLowerCase();
            let jsonData: ParsedData = [];

            if (fileName.endsWith('.csv')) {
                const fileContents = await selectedFile.text();
                const parsed = Papa.parse(fileContents, { header: true, skipEmptyLines: true });
                jsonData = (parsed.data as ParsedData).filter(row => Object.values(row).some(value => value !== null && value !== undefined && value !== ''));
            } else if (fileName.endsWith('.xlsx')) {
                const rows = await readXlsxFile(selectedFile);
                if (!rows.length) {
                    setError('The file is empty or could not be parsed.');
                    return;
                }

                const headerRow = rows[0] ?? [];
                const headerUsage = new Map<string, number>();
                const normalizedHeaders = headerRow.map((cell, index) => {
                    const baseHeader = String(cell ?? '').trim() || `Column ${index + 1}`;
                    const usageCount = (headerUsage.get(baseHeader) ?? 0) + 1;
                    headerUsage.set(baseHeader, usageCount);
                    return usageCount > 1 ? `${baseHeader}_${usageCount}` : baseHeader;
                });

                const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
                if (!dataRows.length) {
                    setError('The file is empty or could not be parsed.');
                    return;
                }

                jsonData = dataRows.map(row => {
                    const record: Record<string, string | number | boolean | Date | null> = {};
                    normalizedHeaders.forEach((header, index) => {
                        record[header] = (row[index] ?? '') as string | number | boolean | Date | null;
                    });
                    return record;
                });
            } else {
                setError('Unsupported file type. Please upload a CSV or XLSX file.');
                return;
            }

            if (!jsonData.length) {
                setError('The file is empty or could not be parsed.');
                return;
            }

            const fileHeaders = Object.keys(jsonData[0]);
            setHeaders(fileHeaders);
            setParsedData(jsonData);

            const initialMap = fileHeaders.reduce((acc, header) => {
                acc[header] = autoMapHeader(header);
                return acc;
            }, {} as { [key: string]: string });
            setColumnMap(initialMap);

            setStep(2);
        } catch (err) {
            setError('Failed to parse the file. Please ensure it is a valid CSV or XLSX file.');
        } finally {
            e.target.value = '';
        }
    };
    
    const handleMapChange = (header: string, field: string) => {
        setColumnMap(prev => ({ ...prev, [header]: field }));
    };
    
    const handleNextToReview = () => {
        const requiredFields = ['first_name', 'company_name', 'email'];
        const mappedFields = Object.values(columnMap);
        const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

        if (missingFields.length > 0) {
            setError(`Please map the following required fields: ${missingFields.join(', ')}`);
            return;
        }
        setError('');
        setStep(3);
    };
    
    const handleConfirmImport = () => {
        const importedLeads = parsedData.map(row => {
            const newLead: { [key: string]: any } = {};
            for (const header in columnMap) {
                const leadField = columnMap[header];
                if (leadField && LEAD_FIELDS.includes(leadField as any)) {
                    newLead[leadField] = row[header];
                }
            }
            return newLead as Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>;
        });
        onImport(importedLeads);
    };

    const renderStepContent = () => {
        switch(step) {
            case 1: // Upload
                return (
                    <div className="text-center">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                                <UploadIcon className="h-10 w-10 text-slate-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-slate-900">Upload a file</h3>
                            <p className="mt-1 text-sm text-slate-500">Select a CSV or Excel file to import your leads.</p>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv, .xlsx" onChange={handleFileChange} />
                    </div>
                );
            case 2: // Map Columns
                return (
                    <div>
                        <h3 className="text-lg font-medium text-slate-900">Map Columns</h3>
                        <p className="mt-1 text-sm text-slate-500">Match the columns from your file to the fields in the CRM.</p>
                        <div className="mt-4 max-h-80 overflow-y-auto pr-2 space-y-3">
                            {headers.map(header => (
                                <div key={header} className="grid grid-cols-2 gap-4 items-center">
                                    <span className="font-medium text-sm text-slate-800 truncate">{header}</span>
                                    <select
                                        value={columnMap[header] || ''}
                                        onChange={(e) => handleMapChange(header, e.target.value)}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        aria-label={`Map column ${header}`}
                                    >
                                        <option value="">-- Do not import --</option>
                                        {LEAD_FIELDS.map(field => (
                                            <option key={field} value={field} className="capitalize">{field.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: // Review
                return (
                     <div>
                        <h3 className="text-lg font-medium text-slate-900">Review Import</h3>
                        <p className="mt-1 text-sm text-slate-500">Here is a preview of the first 5 records. If everything looks correct, confirm the import.</p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {Object.values(columnMap).filter(f => f).map(field => (
                                            <th key={field} className="px-3 py-2 text-left font-medium text-slate-600 capitalize">{(field as string).replace(/_/g, ' ')}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {parsedData.slice(0, 5).map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {headers.map(header => {
                                                const field = columnMap[header];
                                                if (!field) return null;
                                                return <td key={`${rowIndex}-${header}`} className="px-3 py-2 text-slate-700 truncate">{String(row[header] || '')}</td>
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">Import Leads</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close import leads modal"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    {renderStepContent()}
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </main>
                <footer className="p-4 bg-gray-50 border-t flex justify-between items-center">
                    <button onClick={step === 1 ? onClose : () => setStep(step - 1)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                       {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    {step < 3 && (
                        <button onClick={handleNextToReview} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400" disabled={step === 1}>
                           Next
                        </button>
                    )}
                     {step === 3 && (
                        <button onClick={handleConfirmImport} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">
                           Confirm Import ({parsedData.length} records)
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default ImportLeadsModal;
