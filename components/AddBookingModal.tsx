
import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, CargoType, Currency, PaymentStatus } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { CloseIcon, MapPinIcon, CalendarDaysIcon, TruckIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon } from './icons/Icons';
import { useAuth } from '../auth/AuthContext';

interface AddBookingModalProps {
  onClose: () => void;
  onAddBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddBookingModal: React.FC<AddBookingModalProps> = ({ onClose, onAddBooking }) => {
  const { user } = useAuth();
  // Pre-filled for demo
  const [formData, setFormData] = useState({
    customer_id: '101', // Defaults to Retail Giant
    pickup_city: 'Harare',
    pickup_address: 'Willowvale Ind. Estate, Bay 4',
    pickup_date: new Date().toISOString().split('T')[0],
    delivery_city: 'Bulawayo',
    delivery_address: 'Belmont Depot, Unit 12',
    delivery_date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    cargo_type: CargoType.GENERAL,
    cargo_description: 'Consumer Electronics',
    weight_tonnes: '15',
    base_price: '1200',
    currency: Currency.USD,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'customer') {
      setFormData(prev => ({ ...prev, customer_id: user.id }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.pickup_city || !formData.delivery_city || !formData.base_price) {
      setError('Please fill in all required fields (*).');
      return;
    }

    const customerId = parseInt(formData.customer_id);
    const customer = mockCustomers.find(c => c.id === customerId);
    const basePrice = parseFloat(formData.base_price);

    const newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at'> = {
      booking_number: `BKN-${Date.now().toString().slice(-6)}`,
      customer_id: customerId,
      pickup_location: formData.pickup_city,
      pickup_address: formData.pickup_address,
      pickup_city: formData.pickup_city,
      pickup_country: customer?.country || 'Zimbabwe',
      pickup_date: formData.pickup_date,
      delivery_location: formData.delivery_city,
      delivery_address: formData.delivery_address,
      delivery_city: formData.delivery_city,
      delivery_country: 'Zimbabwe',
      delivery_date: formData.delivery_date,
      cargo_type: formData.cargo_type,
      cargo_description: formData.cargo_description,
      weight_tonnes: parseFloat(formData.weight_tonnes) || 0,
      requires_refrigeration: formData.cargo_type === CargoType.PERISHABLE,
      status: BookingStatus.PENDING,
      base_price: basePrice,
      total_price: basePrice,
      currency: formData.currency,
      payment_status: PaymentStatus.UNPAID,
    };

    onAddBooking(newBooking);
  };

  const isCustomer = user?.role === 'customer';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center md:pl-64 items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isCustomer ? 'Request Booking' : 'New Booking'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter route and cargo details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="p-6 space-y-8">
            
            {/* Section: Customer */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Client & Account</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircleIcon className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  disabled={isCustomer}
                  className={`block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:ring-orange-500 shadow-sm transition-shadow ${isCustomer ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Customer...</option>
                  {mockCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Route Timeline */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Route & Schedule</label>
              
              <div className="relative pl-4">
                {/* Visual Timeline Line */}
                <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-slate-200 border-l-2 border-dashed border-slate-300"></div>

                {/* Pickup Group */}
                <div className="relative flex gap-4 mb-6">
                  <div className="flex-shrink-0 z-10 mt-3">
                    <div className="w-4 h-4 rounded-full bg-white border-[3px] border-orange-500 shadow-sm"></div>
                  </div>
                  <div className="flex-grow space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-orange-600 uppercase">Pickup</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="text" name="pickup_city" placeholder="City*" value={formData.pickup_city} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <input type="text" name="pickup_address" placeholder="Specific Address / Warehouse" value={formData.pickup_address} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Group */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10 mt-3">
                    <div className="w-4 h-4 rounded-full bg-slate-800 shadow-sm"></div>
                  </div>
                  <div className="flex-grow space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase">Delivery</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="text" name="delivery_city" placeholder="City*" value={formData.delivery_city} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500" />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 text-slate-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <input type="text" name="delivery_address" placeholder="Specific Address / Warehouse" value={formData.delivery_address} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Cargo & Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo Details</label>
                <div className="space-y-3">
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <TruckIcon className="h-4 w-4 text-slate-400" />
                      </div>
                    <select name="cargo_type" value={formData.cargo_type} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pl-9 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white">
                      {Object.values(CargoType).map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <input type="text" name="cargo_description" placeholder="Description (e.g. 20 Pallets)" value={formData.cargo_description} onChange={handleChange} className="block w-full rounded-lg border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500" />
                  <div className="relative">
                    <input type="number" name="weight_tonnes" placeholder="Weight" value={formData.weight_tonnes} onChange={handleChange} className="block w-full rounded-lg border-slate-200 pr-12 text-sm focus:border-orange-500 focus:ring-orange-500" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">tonnes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Financials</label>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-orange-800 mb-1">{isCustomer ? "Offer Price / Value" : "Agreed Rate"}</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-orange-500" />
                      </div>
                      <input type="number" name="base_price" placeholder="0.00" value={formData.base_price} onChange={handleChange} className="block w-full rounded-lg border-orange-200 pl-10 text-sm focus:border-orange-500 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-orange-800 mb-1">Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="block w-full rounded-lg border-orange-200 text-sm focus:border-orange-500 focus:ring-orange-500 bg-white">
                      {Object.values(Currency).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          </main>
        </form>

        <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm shadow-orange-200 transition-all"
          >
            {isCustomer ? 'Submit Request' : 'Create Booking'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddBookingModal;
