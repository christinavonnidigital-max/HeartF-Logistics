
import React, { useState } from 'react';
import { VehicleDocument, DocumentType } from '../types';
import { CloseIcon, DocumentTextIcon } from './icons/Icons';

interface AddDocumentModalProps {
  onClose: () => void;
  onAddDocument: (doc: Omit<VehicleDocument, 'id' | 'vehicle_id' | 'uploaded_at' | 'uploaded_by'>) => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ onClose, onAddDocument }) => {
    const [formData, setFormData] = useState({
        document_type: DocumentType.OTHER,
        document_name: '',
        expiry_date: '',
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
        if (!file) {
            setError('Please upload a file.');
            return;
        }
        setError('');
        
        // Mock file URL creation
        const file_url = URL.createObjectURL(file);
        
        onAddDocument({
            document_type: formData.document_type,
            document_name: formData.document_name,
            file_url: file_url,
            expiry_date: formData.expiry_date || undefined,
        });
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Upload Document</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Document Type</label>
                        <select name="document_type" value={formData.document_type} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize">
                            {Object.values(DocumentType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Document Name*</label>
                        <input type="text" name="document_name" value={formData.document_name} onChange={handleChange} placeholder="e.g. Insurance Policy 2024" className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">File*</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-orange-500" />
                                        <div className="flex text-sm text-gray-600">
                                            <span className="font-medium text-orange-600 truncate max-w-[200px]">{file.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </main>
                <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Save Document</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddDocumentModal;
