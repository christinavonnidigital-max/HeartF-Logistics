
import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleExpense, ExpenseType, Currency, VehicleDocument, DocumentType } from '../types';
import { mockMaintenance } from '../data/mockData';
import { CogIcon, CurrencyDollarIcon, GaugeIcon, PlusIcon, RoadIcon, WrenchIcon, FuelIcon, ShieldCheckIcon, ClipboardDocumentIcon, TicketIcon, DocumentDuplicateIcon, TrashIcon, UploadIcon, DocumentTextIcon, CalendarDaysIcon } from './icons/Icons';
import { ShellCard, SubtleCard } from "./UiKit";
import AddDocumentModal from './AddDocumentModal';
import ConfirmModal from './ConfirmModal';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  expenses: VehicleExpense[];
  onAddExpenseClick: () => void;
  onDeleteVehicle: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <SubtleCard 
    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 transition cursor-pointer" 
    onClick={() => alert(`Viewing details for ${label}`)}
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  </SubtleCard>
);


const getExpenseTypeUI = (type: ExpenseType) => {
    switch(type) {
        case ExpenseType.FUEL:
            return { icon: <FuelIcon className="w-5 h-5" />, color: 'text-red-600', bgColor: 'bg-red-100' };
        case ExpenseType.MAINTENANCE:
            return { icon: <WrenchIcon className="w-5 h-5" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        case ExpenseType.INSURANCE:
            return { icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-100' };
        case ExpenseType.LICENSE:
            return { icon: <ClipboardDocumentIcon className="w-5 h-5" />, color: 'text-indigo-600', bgColor: 'bg-indigo-100' };
        case ExpenseType.TOLLS:
        case ExpenseType.PARKING:
            return { icon: <TicketIcon className="w-5 h-5" />, color: 'text-purple-600', bgColor: 'bg-purple-100' };
        case ExpenseType.OTHER:
        default:
            return { icon: <DocumentDuplicateIcon className="w-5 h-5" />, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
}


const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, expenses, onAddExpenseClick, onDeleteVehicle }) => {
  const [filterType, setFilterType] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  // Initialize documents with some data based on vehicle properties for demonstration
  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    const docs: VehicleDocument[] = [];
    let idCounter = 1;
    if (vehicle.insurance_expiry_date) {
        docs.push({
            id: idCounter++,
            vehicle_id: vehicle.id,
            document_type: DocumentType.INSURANCE,
            document_name: `Insurance - ${vehicle.insurance_provider || 'Policy'}`,
            file_url: '#',
            expiry_date: vehicle.insurance_expiry_date,
            uploaded_at: vehicle.updated_at,
            uploaded_by: 1
        });
    }
    if (vehicle.license_disc_expiry) {
        docs.push({
            id: idCounter++,
            vehicle_id: vehicle.id,
            document_type: DocumentType.LICENSE_DISC,
            document_name: `License Disc`,
            file_url: '#',
            expiry_date: vehicle.license_disc_expiry,
            uploaded_at: vehicle.updated_at,
            uploaded_by: 1
        });
    }
    if (vehicle.fitness_certificate_expiry) {
        docs.push({
            id: idCounter++,
            vehicle_id: vehicle.id,
            document_type: DocumentType.FITNESS,
            document_name: `Fitness Certificate`,
            file_url: '#',
            expiry_date: vehicle.fitness_certificate_expiry,
            uploaded_at: vehicle.updated_at,
            uploaded_by: 1
        });
    }
    return docs;
  });
  
  const maintenanceHistory = mockMaintenance.filter((m) => m.vehicle_id === vehicle.id);
  
  const filteredExpenses = useMemo(() => {
    const expenseHistory = expenses.filter((e) => e.vehicle_id === vehicle.id);

    if (filterType === 'all') {
      return expenseHistory;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenseHistory.filter(expense => {
      // Append T00:00:00 to parse date string in local timezone
      const expenseDate = new Date(expense.expense_date + 'T00:00:00');

      switch (filterType) {
        case '7days': {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return expenseDate >= sevenDaysAgo;
        }
        case '30days': {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return expenseDate >= thirtyDaysAgo;
        }
        case 'thisMonth': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return expenseDate >= startOfMonth;
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) return false;
          const start = new Date(customStartDate + 'T00:00:00');
          const end = new Date(customEndDate + 'T00:00:00');
          return expenseDate >= start && expenseDate <= end;
        }
        default:
          return true;
      }
    });
  }, [expenses, vehicle.id, filterType, customStartDate, customEndDate]);

  const expenseTotalByCurrency = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
        const currency = expense.currency;
        if (!acc[currency]) {
            acc[currency] = 0;
        }
        acc[currency] += expense.amount;
        return acc;
    }, {} as Record<Currency, number>);
  }, [filteredExpenses]);

  // Estimate next service date based on average usage
  const estimatedServiceDate = useMemo(() => {
    if (vehicle.next_service_due_date) {
         return new Date(vehicle.next_service_due_date).toLocaleDateString();
    }
    
    const today = new Date();
    // Use purchase date to calculate average daily KM usage
    const startDate = new Date(vehicle.purchase_date); 
    const daysActive = Math.max(1, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyKm = vehicle.current_km / daysActive;
    
    const kmRemaining = vehicle.next_service_due_km - vehicle.current_km;
    
    if (kmRemaining <= 0) return 'Overdue';
    if (avgDailyKm <= 0) return 'Unknown';
    
    const daysRemaining = Math.ceil(kmRemaining / avgDailyKm);
    const estDate = new Date(today);
    estDate.setDate(today.getDate() + daysRemaining);
    
    return `${estDate.toLocaleDateString()} (Est.)`;
  }, [vehicle]);

  const handleAddDocument = (doc: Omit<VehicleDocument, 'id' | 'vehicle_id' | 'uploaded_at' | 'uploaded_by'>) => {
    const newDoc: VehicleDocument = {
        ...doc,
        id: Date.now(),
        vehicle_id: vehicle.id,
        uploaded_at: new Date().toISOString(),
        uploaded_by: 1 // Mock user ID
    };
    setDocuments(prev => [...prev, newDoc]);
    setIsAddDocumentModalOpen(false);
  };

  const confirmDeleteDocument = () => {
    if (documentToDelete !== null) {
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete));
        setDocumentToDelete(null);
    }
  };

  const confirmDeleteVehicle = () => {
    onDeleteVehicle();
    setIsDeleteVehicleModalOpen(false);
  }

  return (
    <>
    <ShellCard className="p-6 overflow-y-auto relative">
        <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
            <div>
                <h3 className="text-2xl font-bold leading-6 text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
                <p className="mt-1 text-md text-gray-500">{vehicle.registration_number}</p>
            </div>
            <button
                onClick={() => setIsDeleteVehicleModalOpen(true)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Vehicle"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-5 h-5"/>} label="Current KM" value={new Intl.NumberFormat().format(vehicle.current_km)} />
        <StatCard icon={<GaugeIcon className="w-5 h-5"/>} label="Capacity" value={`${vehicle.capacity_tonnes} t`} />
        <StatCard icon={<WrenchIcon className="w-5 h-5"/>} label="Next Service KM" value={`${new Intl.NumberFormat().format(vehicle.next_service_due_km)}`} />
        <StatCard icon={<CalendarDaysIcon className="w-5 h-5"/>} label="Next Service Date" value={estimatedServiceDate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubtleCard className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center"><CogIcon className="w-5 h-5 mr-2 text-gray-500"/>Maintenance</h4>
          <div className="space-y-2">
            {maintenanceHistory.length > 0 ? maintenanceHistory.map((item) => (
              <div key={item.id} className="p-3 bg-white rounded-lg ring-1 ring-slate-100">
                <p className="font-semibold text-sm">{item.description}</p>
                <p className="text-xs text-gray-500">{new Date(item.service_date).toLocaleDateString()} - {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.cost)}</p>
              </div>
            )) : <p className="text-sm text-gray-500 p-3">No maintenance records.</p>}
          </div>
        </SubtleCard>
        
        <SubtleCard className="p-4">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold flex items-center"><CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500"/>Expenses</h4>
                <button
                    onClick={onAddExpenseClick}
                    className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                    aria-label="Add Expense"
                >
                    <PlusIcon className="w-4 h-4"/>
                </button>
            </div>
             <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom Range</option>
                </select>
                {filterType === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap">
                         <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                         />
                         <span>to</span>
                         <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                         />
                    </div>
                )}
            </div>
            <div className="mt-4 p-3 bg-white ring-1 ring-slate-100 rounded-lg text-sm">
              <h5 className="font-semibold text-gray-700 mb-1">Total for Period</h5>
              {Object.keys(expenseTotalByCurrency).length > 0 ? (
                  Object.entries(expenseTotalByCurrency).map(([currency, total]) => (
                      <p key={currency} className="text-lg font-bold text-gray-900">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency, minimumFractionDigits: 2 }).format(Number(total))}
                      </p>
                  ))
              ) : (
                  <p className="text-gray-500 italic">No expenses in this period.</p>
              )}
            </div>
           <div className="space-y-3 mt-4">
            {filteredExpenses.length > 0 ? filteredExpenses.map((item) => {
                const ui = getExpenseTypeUI(item.expense_type);
                return (
                    <div key={item.id} className="p-3 bg-white rounded-lg flex items-start gap-4 ring-1 ring-slate-100">
                        <div className={`flex-shrink-0 p-2 rounded-full ${ui.bgColor} ${ui.color}`}>
                            {ui.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                              <p className="font-semibold capitalize">{item.expense_type.replace('_', ' ')}</p>
                              <p className="font-bold text-gray-800">{new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency, minimumFractionDigits: 2}).format(Number(item.amount))}</p>
                          </div>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(item.expense_date + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                    </div>
                )
            }) : <p className="text-sm text-gray-500 p-3 italic">No expense records for the selected period.</p>}
          </div>
        </SubtleCard>

        {/* Documents Section */}
        <SubtleCard className="p-4 md:col-span-2">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold flex items-center"><ClipboardDocumentIcon className="w-5 h-5 mr-2 text-gray-500"/>Documents & Compliance</h4>
                <button
                    onClick={() => setIsAddDocumentModalOpen(true)}
                    className="flex items-center gap-1 p-1.5 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                    aria-label="Add Document"
                >
                    <UploadIcon className="w-4 h-4"/>
                    <span>Upload</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.length > 0 ? documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-white rounded-lg ring-1 ring-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                <DocumentTextIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate" title={doc.document_name}>{doc.document_name}</p>
                                <p className="text-xs text-slate-500 truncate capitalize">{doc.document_type.replace('_', ' ')}</p>
                                {doc.expiry_date && (
                                    <p className={`text-[10px] mt-0.5 ${new Date(doc.expiry_date) < new Date() ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                        Exp: {new Date(doc.expiry_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setDocumentToDelete(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <div className="col-span-full py-8 text-center text-slate-500 text-sm italic">
                        No documents uploaded for this vehicle.
                    </div>
                )}
            </div>
        </SubtleCard>
      </div>
    </ShellCard>
    {isAddDocumentModalOpen && (
        <AddDocumentModal 
            onClose={() => setIsAddDocumentModalOpen(false)}
            onAddDocument={handleAddDocument}
        />
    )}
    
    <ConfirmModal 
        isOpen={isDeleteVehicleModalOpen}
        onClose={() => setIsDeleteVehicleModalOpen(false)}
        onConfirm={confirmDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicle.registration_number}? This action cannot be undone and will remove all associated data.`}
        confirmLabel="Delete Vehicle"
    />

    <ConfirmModal 
        isOpen={documentToDelete !== null}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete Document"
    />
    </>
  );
};

export default VehicleDetails;
