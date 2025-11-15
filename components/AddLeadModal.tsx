
import React, { useState } from 'react';
import { Lead, LeadSource, LeadStatus, CompanySize, Industry } from '../types';
import { CloseIcon } from './icons/Icons';

interface AddLeadModalProps {
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose, onAddLead }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        lead_source: LeadSource.WEBSITE,
        lead_status: LeadStatus.NEW,
        company_size: CompanySize.SMALL,
        industry: Industry.OTHER,
        position: '',
        logistics_needs: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.first_name || !formData.company_name || !formData.email) {
            setError('First Name, Company, and Email are required.');
            return;
        }
        setError('');
        onAddLead(formData);
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Add New Lead</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="first_name" placeholder="First Name*" value={formData.first_name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="email" name="email" placeholder="Email*" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <input type="text" name="company_name" placeholder="Company Name*" value={formData.company_name} onChange={handleChange} className="md:col-span-2 mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                        <select name="lead_source" value={formData.lead_source} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize">
                            {Object.values(LeadSource).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <select name="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize">
                            {Object.values(Industry).map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <textarea name="logistics_needs" placeholder="Logistics Needs" value={formData.logistics_needs} onChange={handleChange} className="md:col-span-2 mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </main>
                <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">Add Lead</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddLeadModal;