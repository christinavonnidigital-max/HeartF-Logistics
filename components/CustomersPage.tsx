
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, LoyaltyTier } from '../types';
import { SearchIcon, UsersIcon, EnvelopeIcon, MapPinIcon, TrashIcon, PlusIcon, CurrencyDollarIcon } from './icons';
import { SectionHeader, StatusPill, ShellCard, StatCard } from './UiKit';
import EmptyState from './EmptyState';
import { useData } from '../contexts/DataContext';
import AddCustomerModal from './AddCustomerModal';
import ConfirmModal from './ConfirmModal';
import { downloadCsv } from '../dataIO/toCsv';
import { downloadXlsx } from '../dataIO/toXlsx';
import ImportModal from '../dataIO/ImportModal';

const CustomersPage: React.FC = () => {
    const { customers, addCustomer, deleteCustomer, logAuditEvent } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Set selected customer when customers load
    useEffect(() => {
        if (!selectedCustomer && customers.length > 0) {
            setSelectedCustomer(customers[0]);
        }
    }, [customers, selectedCustomer]);

    const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'total_spent' | 'total_bookings' | 'loyalty_points' | 'is_verified'>) => {
        const newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
            ...customerData,
            total_spent: 0,
            total_bookings: 0,
            loyalty_points: 0,
            is_verified: true,
        };
        addCustomer(newCustomer);
        setIsAddModalOpen(false);
    };

    const handleDeleteCustomer = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete);
            setCustomerToDelete(null);
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.company_name.toLowerCase().includes(lowerTerm) ||
            c.billing_email.toLowerCase().includes(lowerTerm) ||
            c.city.toLowerCase().includes(lowerTerm)
        );
    }, [customers, searchTerm]);

    useEffect(() => {
        if (filteredCustomers.length === 0) {
            setSelectedCustomer(null);
            return;
        }
        if (!selectedCustomer || !filteredCustomers.find(c => c.id === selectedCustomer.id)) {
            setSelectedCustomer(filteredCustomers[0]);
        }
    }, [filteredCustomers, selectedCustomer]);

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

    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

    const customerColumns = [
        { key: 'company_name', header: 'Company' },
        { key: 'billing_email', header: 'Billing Email' },
        { key: 'city', header: 'City' },
        { key: 'country', header: 'Country' },
        { key: 'loyalty_tier', header: 'Tier' },
        { key: 'total_spent', header: 'Total Spent' },
        { key: 'total_bookings', header: 'Total Bookings' },
    ];

    const customerXlsxColumns = customerColumns.map((c) => ({ title: c.header, key: c.key, width: 18 }));

    const handleExportCsv = () => downloadCsv(customers, customerColumns as any, 'customers');
    const handleExportXlsx = () => downloadXlsx(customers, customerXlsxColumns as any, 'customers');

    const handleImportCustomers = (rows: Record<string, any>[], meta: { imported: number; failed: number }) => {
        let success = 0;
        let failed = 0;
        rows.forEach((row) => {
            try {
                const newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
                    company_name: row.company_name || 'New Customer',
                    billing_email: row.billing_email || '',
                    city: row.city || '',
                    country: row.country || '',
                    address_line1: row.address_line1 || '',
                    loyalty_tier: Object.values(LoyaltyTier).includes(row.loyalty_tier as LoyaltyTier) ? row.loyalty_tier as LoyaltyTier : LoyaltyTier.BRONZE,
                    loyalty_points: Number(row.loyalty_points) || 0,
                    total_spent: Number(row.total_spent) || 0,
                    total_bookings: Number(row.total_bookings) || 0,
                    preferred_currency: row.preferred_currency || 'USD',
                    is_verified: true,
                    billing_phone: row.billing_phone || '',
                    postal_code: row.postal_code || '',
                } as any;
                addCustomer(newCustomer);
                success += 1;
            } catch {
                failed += 1;
            }
        });
        logAuditEvent({
            action: 'data.import',
            entity: { type: 'customer' },
            meta: { imported: success, failed: failed || meta.failed, source: 'customers.import' },
        });
    };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Total Accounts" value={customers.length} />
                <StatCard label="Total Lifetime Value" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(totalRevenue)} />
            </div>

        <ShellCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Customer Directory</h2>
                <p className="text-xs text-slate-500">Manage accounts and key relationships</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2 flex-wrap justify-end">
                <div className="relative grow sm:grow-0 sm:w-64">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => setIsImportOpen(true)}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                >
                    Import
                </button>
                <button
                    onClick={handleExportCsv}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                >
                    Export CSV
                </button>
                <button
                    onClick={handleExportXlsx}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
                >
                    Export XLSX
                </button>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Customer</span>
                </button>
            </div>
        </ShellCard>
        
        {filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCustomers.map(customer => {
                const isSelected = selectedCustomer?.id === customer.id;
                return (
                <ShellCard
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-5 hover:shadow-md transition-all duration-300 relative cursor-pointer ${getTierAccent(customer.loyalty_tier)} ${isSelected ? 'ring-2 ring-orange-100 border-orange-300' : ''}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
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
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <EnvelopeIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">{customer.billing_email}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Lifetime Value</p>
                            <p className="text-lg font-bold text-slate-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.preferred_currency }).format(customer.total_spent)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Bookings</p>
                            <p className="text-lg font-bold text-slate-900">{customer.total_bookings}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); setCustomerToDelete(customer.id); }}
                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Customer"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </ShellCard>
            )})}
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

        {selectedCustomer && (
            <ShellCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Profile</p>
                        <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.company_name}</h3>
                        <p className="text-xs text-slate-500">{selectedCustomer.city}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getLoyaltyColor(selectedCustomer.loyalty_tier)}`}>
                        {selectedCustomer.loyalty_tier}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billing Email</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{selectedCustomer.billing_email}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lifetime Value</p>
                        <p className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCustomer.preferred_currency }).format(selectedCustomer.total_spent)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bookings</p>
                        <p className="text-lg font-bold text-slate-900">{selectedCustomer.total_bookings}</p>
                    </div>
                </div>
            </ShellCard>
        )}

        {isAddModalOpen && (
            <AddCustomerModal onClose={() => setIsAddModalOpen(false)} onAddCustomer={handleAddCustomer} />
        )}

        {isImportOpen && (
            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Import customers"
                description="Upload a CSV with customer details, map columns, and import."
                targetFields={[
                    { key: 'company_name', label: 'Company', required: true },
                    { key: 'billing_email', label: 'Billing Email', required: true },
                    { key: 'city', label: 'City' },
                    { key: 'country', label: 'Country' },
                    { key: 'loyalty_tier', label: 'Loyalty Tier' },
                    { key: 'total_spent', label: 'Total Spent' },
                    { key: 'total_bookings', label: 'Total Bookings' },
                ]}
                onImport={handleImportCustomers}
            />
        )}

        <ConfirmModal
            isOpen={customerToDelete !== null}
            onClose={() => setCustomerToDelete(null)}
            onConfirm={handleDeleteCustomer}
            title="Delete Customer"
            message="Are you sure you want to remove this customer? This will also affect their historical bookings."
            confirmLabel="Delete Account"
        />
    </div>
  );
};

export default CustomersPage;
