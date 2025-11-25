
import React, { useState } from 'react';
import { User } from '../types';
import { CloseIcon, UserCircleIcon, EnvelopeIcon, BriefcaseIcon, TruckIcon, CreditCardIcon, ShieldCheckIcon, CheckCircleIcon } from './icons/Icons';

interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'email_verified'>) => void;
}

const ROLES: { id: User['role']; label: string; description: string; icon: React.ReactNode }[] = [
    { 
        id: 'dispatcher', 
        label: 'Dispatcher', 
        description: 'Manage fleet, drivers, routes, and active bookings.',
        icon: <TruckIcon className="w-5 h-5" />
    },
    { 
        id: 'ops_manager', 
        label: 'Ops Manager', 
        description: 'Full operational access across CRM, Fleet, and Finance.',
        icon: <BriefcaseIcon className="w-5 h-5" />
    },
    { 
        id: 'finance', 
        label: 'Finance', 
        description: 'Manage invoices, expenses, payments, and reporting.',
        icon: <CreditCardIcon className="w-5 h-5" />
    },
    { 
        id: 'admin', 
        label: 'Admin', 
        description: 'Full system access including settings and user management.',
        icon: <ShieldCheckIcon className="w-5 h-5" />
    },
];

const InviteUserModal: React.FC<InviteUserModalProps> = ({ onClose, onInvite }) => {
    // Pre-fill with sample data
    const [formData, setFormData] = useState({
        first_name: 'Michael',
        last_name: 'Scott',
        email: 'michael.s@heartfledge.local',
        role: 'dispatcher' as User['role'],
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (role: User['role']) => {
        setFormData(prev => ({ ...prev, role }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name || !formData.email) {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        onInvite(formData);
    };

    return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Invite Team Member</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Give a new user access to the Heartfledge platform</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                <main className="p-6 space-y-8">
                    
                    {/* Personal Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" />
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                                <input 
                                    type="text" 
                                    name="first_name" 
                                    value={formData.first_name} 
                                    onChange={handleChange} 
                                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                                    placeholder="Jane" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                                <input 
                                    type="text" 
                                    name="last_name" 
                                    value={formData.last_name} 
                                    onChange={handleChange} 
                                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                                    placeholder="Doe" 
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="block w-full rounded-lg border-slate-200 bg-slate-50 pl-9 px-3 py-2 focus:bg-white text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                                        placeholder="jane.doe@company.com" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Role Selection */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4" />
                            Access Level & Role
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ROLES.map((role) => {
                                const isSelected = formData.role === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => handleRoleSelect(role.id)}
                                        className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] h-full ${
                                            isSelected 
                                            ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500' 
                                            : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex w-full justify-between items-start mb-2">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {role.icon}
                                            </div>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5 text-orange-600" />}
                                        </div>
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-orange-900' : 'text-slate-900'}`}>
                                            {role.label}
                                        </span>
                                        <span className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-orange-700' : 'text-slate-500'}`}>
                                            {role.description}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
                            {error}
                        </div>
                    )}
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all"
                    >
                        Send Invitation
                    </button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default InviteUserModal;
