
import React, { useState, useMemo } from 'react';
import { Customer, LoyaltyTier } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { SearchIcon, UsersIcon, EnvelopeIcon, MapPinIcon } from './icons/Icons';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';
import EmptyState from './EmptyState';

const CustomersPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers] = useState<Customer[]>(mockCustomers);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.company_name.toLowerCase().includes(lowerTerm) ||
            c.billing_email.toLowerCase().includes(lowerTerm) ||
            c.city.toLowerCase().includes(lowerTerm)
        );
    }, [customers, searchTerm]);

    const getLoyaltyTone = (tier: LoyaltyTier) => {
        switch(tier) {
            case LoyaltyTier.PLATINUM: return 'info';
            case LoyaltyTier.GOLD: return 'warn';
            case LoyaltyTier.SILVER: return 'neutral';
            default: return 'neutral';
        }
    }

  return (
    <ShellCard className="flex flex-col min-h-[600px]">
        <div className="p-4 border-b border-slate-100">
            <SectionHeader
                title="Customer management"
                subtitle="Keep accounts, key contacts and contract details aligned with your fleet reality."
            />
            <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search customers by name, email, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
            {filteredCustomers.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition bg-white gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                    <UsersIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">{customer.company_name}</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><EnvelopeIcon className="w-3 h-3"/> {customer.billing_email}</span>
                                        <span className="hidden sm:inline text-slate-300">•</span>
                                        <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {customer.city}, {customer.country}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Spent</p>
                                    <p className="font-semibold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.preferred_currency }).format(customer.total_spent)}</p>
                                </div>
                                <div className="text-right min-w-[80px]">
                                     <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Loyalty</p>
                                     <StatusPill label={customer.loyalty_tier} tone={getLoyaltyTone(customer.loyalty_tier)} />
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <EmptyState
                    icon={<UsersIcon className="h-14 w-14" />}
                    title="No customers found"
                    message={searchTerm ? `No customers matching "${searchTerm}"` : "Get started by adding your first customer."}
                />
            )}
        </div>
    </ShellCard>
  );
};

export default CustomersPage;
