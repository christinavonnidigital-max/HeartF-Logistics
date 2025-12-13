
import React, { useState } from 'react';
import { Customer, LoyaltyTier, Currency, Industry } from '../types';
import { CloseIcon, UserCircleIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeIcon, BuildingOfficeIcon, CreditCardIcon } from './icons/Icons';

interface AddCustomerModalProps {
  onClose: () => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'total_spent' | 'total_bookings' | 'loyalty_points' | 'is_verified'>) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, onAddCustomer }) => {
    // Pre-filled demo data
    const [formData, setFormData] = useState({
        company_name: 'ZimBuild Construction',
        industry: Industry.OTHER,
        address_line1: '101 Samora Machel Ave',
        city: 'Harare',
        country: 'Zimbabwe',
        billing_email: 'accounts@zimbuild.co.zw',
        billing_phone: '+263 242 778899',
        loyalty_tier: LoyaltyTier.SILVER,
        preferred_currency: Currency.USD,
        tax_id: '100-223344-Z',
        payment_terms: '30',
        notes: 'Major contractor for government projects. Requires POD for all deliveries.',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name || !formData.billing_email) {
            setError('Company Name and Billing Email are required.');
            return;
        }
        setError('');
        onAddCustomer({
            ...formData,
            industry: formData.industry as string, // Cast or map if needed
            payment_terms: parseInt(formData.payment_terms) || 30
        });
    };

    return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center md:pl-64 items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Add New Customer</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Register a new corporate account</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                <main className="p-6 space-y-8">
                    
                    {/* Company Identity */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Company Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Company Name*</label>
                                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-sm focus:border-orange-500 focus:ring-orange-500 font-semibold" placeholder="Acme Corp" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
                                <select name="industry" value={formData.industry} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(Industry).map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Tax ID / Reg Number</label>
                                <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="block w-full rounded-lg border-slate-400 bg-slate-50 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="123-456-789" />
                            </div>
                        </div>
                    </div>

                    {/* Location & Contact Panel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            Location & Billing
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" placeholder="Street Address" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                                <input type="text" name="country" value={formData.country} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Billing Email*</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="email" name="billing_email" value={formData.billing_email} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Billing Phone</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="tel" name="billing_phone" value={formData.billing_phone} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Terms */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <CreditCardIcon className="w-4 h-4" />
                            Financial Terms
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Default Currency</label>
                                <select name="preferred_currency" value={formData.preferred_currency} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white">
                                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                                <select name="payment_terms" value={formData.payment_terms} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white">
                                    <option value="0">Immediate</option>
                                    <option value="15">Net 15</option>
                                    <option value="30">Net 30</option>
                                    <option value="60">Net 60</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Loyalty Tier</label>
                                <select name="loyalty_tier" value={formData.loyalty_tier} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 capitalize bg-white">
                                    {Object.values(LoyaltyTier).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500 resize-none" placeholder="Internal notes about this account..."></textarea>
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">{error}</div>}
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all">Add Customer</button>
                </footer>
            </form>
        </div>
    </div>
    );
};

export default AddCustomerModal;
