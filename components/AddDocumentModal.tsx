
import React, { useState } from 'react';
import { VehicleDocument, DocumentType } from '../types';
import { CloseIcon, DocumentTextIcon, UploadIcon } from './icons/Icons';

interface AddDocumentModalProps {
  onClose: () => void;
  onAddDocument: (doc: Omit<VehicleDocument, 'id' | 'vehicle_id' | 'uploaded_at' | 'uploaded_by'>) => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ onClose, onAddDocument }) => {
    // Pre-filled demo data
    const [formData, setFormData] = useState({
        document_type: DocumentType.INSURANCE,
        document_name: 'Alliance Insurance 2025',
        expiry_date: '2025-12-31',
    });
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Auto-fill name if empty
            if (!formData.document_name) {
                setFormData(prev => ({ ...prev, document_name: e.target.files![0].name }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.document_name) {
            setError('Document Name is required.');
            return;
        }
        // Allow submission without file for demo purposes if pre-filled
        setError('');
        
        // Mock file URL creation
        const file_url = file ? URL.createObjectURL(file) : '#';
        
        onAddDocument({
            document_type: formData.document_type,
            document_name: formData.document_name,
            file_url: file_url,
            expiry_date: formData.expiry_date || undefined,
        });
    };

    return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition"><CloseIcon className="w-5 h-5" /></button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
                        <select name="document_type" value={formData.document_type} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize">
                            {Object.values(DocumentType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Document Name*</label>
                        <input type="text" name="document_name" value={formData.document_name} onChange={handleChange} placeholder="e.g. Insurance Policy 2024" className="block w-full rounded-lg border-slate-200 bg-white text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-slate-900 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">File</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer relative">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mb-2">
                                            <DocumentTextIcon className="h-8 w-8" />
                                        </div>
                                        <div className="flex text-sm text-gray-600">
                                            <span className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="mt-2 text-xs text-red-500 hover:text-red-700 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm z-10">Remove</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mx-auto h-12 w-12 text-slate-300 group-hover:text-orange-400 transition-colors">
                                            <UploadIcon className="h-full w-full" />
                                        </div>
                                        <div className="flex text-sm text-gray-600 justify-center mt-2">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg text-center">{error}</p>}
                </main>
                <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Save Document</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddDocumentModal;
