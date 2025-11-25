
import React, { useState } from 'react';
import { Driver, User, EmploymentStatus } from '../types';
import { CloseIcon, UserCircleIcon, ClipboardDocumentIcon, BriefcaseIcon, PhoneIcon, CalendarDaysIcon, EnvelopeIcon } from './icons/Icons';

interface AddDriverModalProps {
  onClose: () => void;
  onAddDriver: (driverData: Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'role' | 'email_verified'>}) => void;
}

const AddDriverModal: React.FC<AddDriverModalProps> = ({ onClose, onAddDriver }) => {
    // Pre-filled demo data
    const [formData, setFormData] = useState({
        first_name: 'Blessing',
        last_name: 'Chikwama',
        email: 'blessing.c@heartfledge.local',
        phone: '+263 77 111 2222',
        license_number: '77889900-B',
        license_type: 'Class 2 (HGV)',
        license_expiry_date: '2026-11-30',
        date_of_birth: '1988-04-12',
        hire_date: '2024-01-15',
        employment_status: EmploymentStatus.ACTIVE,
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name || !formData.license_number || !formData.license_expiry_date || !formData.date_of_birth) {
            setError('Please fill out all required fields (*).');
            return;
        }
        setError('');
        const { first_name, last_name, email, phone, ...driverData } = formData;
        onAddDriver({
            ...driverData,
            user: { first_name, last_name, email, phone, is_active: true },
        });
    };

    return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Add New Driver</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Register a new driver profile</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                <main className="p-6 space-y-8">
                    
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" />
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">First Name*</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name*</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" />
                                </div>
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth*</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Info Panel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <ClipboardDocumentIcon className="w-4 h-4" />
                            Compliance & Employment
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">License Number*</label>
                                <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">License Type</label>
                                <input type="text" name="license_type" value={formData.license_type} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">License Expiry Date*</label>
                                <input type="date" name="license_expiry_date" value={formData.license_expiry_date} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><BriefcaseIcon className="w-3 h-3"/> Hire Date</label>
                                <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-600" />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Employment Status</label>
                                <select name="employment_status" value={formData.employment_status} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Add Driver</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddDriverModal;
