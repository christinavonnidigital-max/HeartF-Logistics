
import React, { useState } from 'react';
import { Lead, LeadSource, LeadStatus, CompanySize, Industry } from '../types';
import { CloseIcon, UserCircleIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon, DocumentTextIcon, MapPinIcon, GlobeIcon } from './icons/Icons';

interface AddLeadModalProps {
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose, onAddLead }) => {
    // Pre-filled fake data for demo purposes
    const [formData, setFormData] = useState({
        first_name: 'Sarah',
        last_name: 'Connor',
        email: 'sarah.c@techflow.co.zw',
        phone: '+263 77 889 9000',
        company_name: 'TechFlow Logistics',
        lead_source: LeadSource.REFERRAL,
        lead_status: LeadStatus.NEW,
        company_size: CompanySize.MEDIUM,
        industry: Industry.MANUFACTURING,
        position: 'Supply Chain Director',
        website: 'https://techflow.co.zw',
        address: '42 Industrial Ave',
        city: 'Harare',
        country: 'Zimbabwe',
        logistics_needs: 'Looking for a reliable partner for cross-border shipments to Zambia. Approx 4 truckloads per week.',
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Add New Lead</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Capture prospect details for the pipeline</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                <main className="p-6 space-y-8">
                    
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">First Name*</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" placeholder="Jane" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" placeholder="Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Email*</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white pl-9 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" placeholder="jane@company.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 pl-9 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" placeholder="+263..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Info Panel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <BriefcaseIcon className="w-4 h-4" />
                            Company Details
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Company Name*</label>
                                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="Acme Logistics" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
                                <select name="industry" value={formData.industry} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(Industry).map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Company Size</label>
                                <select name="company_size" value={formData.company_size} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(CompanySize).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <GlobeIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="https://company.com" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPinIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="City" />
                                    </div>
                                    <input type="text" name="country" value={formData.country} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="Country" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Context Panel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Lead Context
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Lead Source</label>
                                <select name="lead_source" value={formData.lead_source} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(LeadSource).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Position</label>
                                <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Logistics Manager" className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Logistics Needs / Notes</label>
                                <textarea name="logistics_needs" value={formData.logistics_needs} onChange={handleChange} rows={3} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 resize-none" placeholder="Describe their shipping requirements..." />
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">{error}</div>}
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Add Lead</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddLeadModal;
