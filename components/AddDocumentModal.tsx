
import React, { useState } from 'react';
import { VehicleDocument, DocumentType } from '../types';
import { CloseIcon, DocumentTextIcon, UploadIcon } from './icons';
import { Button, Input, Select, ModalShell } from './UiKit';

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
            <ModalShell
                isOpen={true}
                onClose={onClose}
                title="Upload Document"
                description="Attach documents such as insurance, fitness certificates, or service records"
                icon={<DocumentTextIcon className="w-5 h-5 text-brand-600" />}
                maxWidthClass="max-w-lg"
                footer={(
                    <>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" form="add-document-form">Save Document</Button>
                    </>
                )}
            >
                <form id="add-document-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <main className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1">Document Type</label>
                        <Select name="document_type" value={formData.document_type} onChange={handleChange} className="capitalize">
                            {Object.values(DocumentType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1">Document Name*</label>
                        <Input type="text" name="document_name" value={formData.document_name} onChange={handleChange} placeholder="e.g. Insurance Policy 2024" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1">Expiry Date (Optional)</label>
                        <Input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1">File</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-xl hover:bg-muted transition-colors group cursor-pointer relative bg-card">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg mb-2">
                                            <DocumentTextIcon className="h-8 w-8" />
                                        </div>
                                        <div className="flex text-sm text-foreground-muted">
                                            <span className="font-medium text-foreground truncate max-w-50">{file.name}</span>
                                        </div>
                                        <p className="text-xs text-foreground-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <div className="mt-2">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setFile(null); }}>Remove</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mx-auto h-12 w-12 text-foreground-muted group-hover:text-amber-400 transition-colors">
                                            <UploadIcon className="h-full w-full" />
                                        </div>
                                        <div className="flex text-sm text-foreground-muted justify-center mt-2">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-foreground-muted">PDF, PNG, JPG up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-danger-600 text-sm mt-2 bg-danger-600/10 p-2 rounded-lg text-center">{error}</p>}
                </main>
                </form>
      </ModalShell>
    );
};

export default AddDocumentModal;
