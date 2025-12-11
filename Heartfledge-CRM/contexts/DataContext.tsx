

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    Booking, Vehicle, Lead, Opportunity, Invoice, Expense, Driver, 
    VehicleMaintenance, VehicleExpense, User, Customer 
} from '../types';
import { mockVehicles, mockMaintenance, mockExpenses } from '../data/mockData';
import { mockBookings } from '../data/mockBookingsData';
import { mockLeads, mockOpportunities, mockCustomers } from '../data/mockCrmData';
import { mockInvoices, mockAllExpenses } from '../data/mockFinancialsData';
import { mockDrivers, mockUsersForDrivers, mockDriverAssignments } from '../data/mockDriversData';

interface DataContextType {
    // Data
    vehicles: Vehicle[];
    bookings: Booking[];
    leads: Lead[];
    opportunities: Opportunity[];
    invoices: Invoice[];
    expenses: Expense[];
    drivers: Driver[];
    customers: Customer[];
    users: User[];
    
    // Actions
    addBooking: (booking: Booking) => void;
    updateBooking: (booking: Booking) => void;
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (id: number) => void;
    addLead: (lead: Lead) => void;
    updateLead: (lead: Lead) => void;
    deleteLead: (id: number) => void;
    addOpportunity: (opp: Opportunity) => void;
    updateOpportunity: (opp: Opportunity) => void;
    addInvoice: (invoice: Invoice) => void;
    addExpense: (expense: Expense) => void;
    addDriver: (driver: Driver) => void;
    addUser: (user: User) => void;
    deleteUser: (id: number | string) => void;
    
    // Reset
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'hf_global_data_v1';

// Initial User Data based on AuthContext's DEMO_USERS
const initialUsers: User[] = [
  {
    id: "u1",
    first_name: "Dispatch",
    last_name: "Desk",
    email: "dispatcher@heartfledge.local",
    role: "dispatcher",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "u2",
    first_name: "Ops",
    last_name: "Manager",
    email: "ops@heartfledge.local",
    role: "ops_manager",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "u3",
    first_name: "Finance",
    last_name: "Desk",
    email: "finance@heartfledge.local",
    role: "finance",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "u4",
    first_name: "System",
    last_name: "Admin",
    email: "admin@heartfledge.local",
    role: "admin",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "101",
    first_name: "Retail",
    last_name: "Giant",
    email: "customer@heartfledge.local",
    role: "customer",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from localStorage or fall back to mocks
    const [data, setData] = useState(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load data", e);
        }
        // Default initial state
        return {
            vehicles: mockVehicles,
            bookings: mockBookings,
            leads: mockLeads,
            opportunities: mockOpportunities,
            invoices: mockInvoices,
            expenses: mockAllExpenses,
            drivers: mockDrivers,
            customers: mockCustomers,
            maintenance: mockMaintenance, // Keeping these in state even if not explicitly exposed yet
            vehicleExpenses: mockExpenses,
            users: initialUsers,
        };
    });

    // Persist to localStorage whenever data changes
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save data", e);
        }
    }, [data]);

    // --- Action Handlers ---

    const addBooking = (booking: Booking) => {
        setData((prev: any) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
    };

    const updateBooking = (updatedBooking: Booking) => {
        setData((prev: any) => ({
            ...prev,
            bookings: prev.bookings.map((b: Booking) => b.id === updatedBooking.id ? updatedBooking : b)
        }));
    };

    const addVehicle = (vehicle: Vehicle) => {
        setData((prev: any) => ({ ...prev, vehicles: [vehicle, ...prev.vehicles] }));
    };

    const updateVehicle = (updatedVehicle: Vehicle) => {
        setData((prev: any) => ({
            ...prev,
            vehicles: prev.vehicles.map((v: Vehicle) => v.id === updatedVehicle.id ? updatedVehicle : v)
        }));
    };

    const deleteVehicle = (id: number) => {
        setData((prev: any) => ({
            ...prev,
            vehicles: prev.vehicles.filter((v: Vehicle) => v.id !== id)
        }));
    };

    const addLead = (lead: Lead) => {
        setData((prev: any) => ({ ...prev, leads: [lead, ...prev.leads] }));
    };

    const updateLead = (updatedLead: Lead) => {
        setData((prev: any) => ({
            ...prev,
            leads: prev.leads.map((l: Lead) => l.id === updatedLead.id ? updatedLead : l)
        }));
    };

    const deleteLead = (id: number) => {
        setData((prev: any) => ({
            ...prev,
            leads: prev.leads.filter((l: Lead) => l.id !== id)
        }));
    };

    const addOpportunity = (opp: Opportunity) => {
        setData((prev: any) => ({ ...prev, opportunities: [opp, ...prev.opportunities] }));
    };
    
    const updateOpportunity = (updatedOpp: Opportunity) => {
        setData((prev: any) => ({
            ...prev,
            opportunities: prev.opportunities.map((o: Opportunity) => o.id === updatedOpp.id ? updatedOpp : o)
        }));
    }

    const addInvoice = (invoice: Invoice) => {
        setData((prev: any) => ({ ...prev, invoices: [invoice, ...prev.invoices] }));
    };

    const addExpense = (expense: Expense) => {
        setData((prev: any) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    };

    const addDriver = (driver: Driver) => {
        setData((prev: any) => ({ ...prev, drivers: [driver, ...prev.drivers] }));
    };

    const addUser = (user: User) => {
        setData((prev: any) => ({ ...prev, users: [user, ...(prev.users || [])] }));
    };

    const deleteUser = (id: number | string) => {
        setData((prev: any) => ({
            ...prev,
            users: (prev.users || []).filter((u: User) => u.id !== id)
        }));
    };

    const resetData = () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    };

    const value: DataContextType = {
        vehicles: data.vehicles,
        bookings: data.bookings,
        leads: data.leads,
        opportunities: data.opportunities,
        invoices: data.invoices,
        expenses: data.expenses,
        drivers: data.drivers,
        customers: data.customers,
        users: data.users || initialUsers,
        addBooking,
        updateBooking,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addLead,
        updateLead,
        deleteLead,
        addOpportunity,
        updateOpportunity,
        addInvoice,
        addExpense,
        addDriver,
        addUser,
        deleteUser,
        resetData
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};