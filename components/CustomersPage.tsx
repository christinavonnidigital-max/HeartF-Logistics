
import React, { useState, useMemo } from 'react';
import { Customer, LoyaltyTier } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { SearchIcon, UsersIcon, EnvelopeIcon, MapPinIcon, StarIcon } from './icons/Icons';
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

    const getLoyaltyColor = (tier: LoyaltyTier) => {
        switch(tier) {
            case LoyaltyTier.PLATINUM: return 'bg-slate-800 text-white border-slate-700';
            case LoyaltyTier.GOLD: return 'bg-amber-400 text-amber-900 border-amber-300';
            case LoyaltyTier.SILVER: return 'bg-slate-300 text-slate-800 border-slate-300';
            default: return 'bg-orange-100 text-orange-800 border-orange-200';
        }
    }

    const getTierAccent = (tier: LoyaltyTier) => {
        switch(tier) {
            case LoyaltyTier.PLATINUM: return 'border-l-4 border-l-slate-800';
            case LoyaltyTier.GOLD: return 'border-l-4 border-l-amber-400';
            case LoyaltyTier.SILVER: return 'border-l-4 border-l-slate-300';
            default: return 'border-l-4 border-l-orange-200';
        }
    }

  return (
    <div className="space-y-6">
        <ShellCard className="p-4 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Customers</h2>
                <p className="text-xs text-slate-500">Manage accounts and key relationships</p>
            </div>
            <div className="relative w-64">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
            </div>
        </ShellCard>
        
        {filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCustomers.map(customer => (
                <div key={customer.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-300 ${getTierAccent(customer.loyalty_tier)}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{customer.company_name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPinIcon className="w-3 h-3" /> {customer.city}
                                </p>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getLoyaltyColor(customer.loyalty_tier)}`}>
                            {customer.loyalty_tier}
                        </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{customer.billing_email}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Lifetime Value</p>
                            <p className="text-lg font-bold text-slate-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.preferred_currency }).format(customer.total_spent)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bookings</p>
                            <p className="text-lg font-bold text-slate-900">{customer.total_bookings}</p>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="h-96 flex items-center justify-center">
                <EmptyState
                    icon={<UsersIcon className="h-14 w-14" />}
                    title="No customers found"
                    message="Adjust search terms or add a new customer."
                />
            </div>
        )}
    </div>
  );
};

export default CustomersPage;
