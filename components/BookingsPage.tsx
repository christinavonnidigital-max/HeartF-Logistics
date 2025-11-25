
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import EmptyState from './EmptyState';
import { DocumentTextIcon, MapPinIcon, TruckIcon, ClockIcon, SearchIcon, PlusIcon, CalendarDaysIcon } from './icons/Icons';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../contexts/DataContext';
import AddBookingModal from './AddBookingModal';
import BookingDetailsModal from './BookingDetailsModal';
import { StatusPill } from './UiKit';

const statusToLabelAndTone = (status: Booking['status'] | string) => {
  const normalized = (status || '').toString();
  switch (normalized) {
    case 'pending': return { label: 'Pending', toneClass: 'bg-amber-50 text-amber-700 border border-amber-200' };
    case 'confirmed': return { label: 'Confirmed', toneClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    case 'in_transit': return { label: 'In Transit', toneClass: 'bg-sky-50 text-sky-700 border border-sky-200' };
    case 'delivered': return { label: 'Delivered', toneClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
    case 'cancelled': return { label: 'Cancelled', toneClass: 'bg-rose-50 text-rose-700 border border-rose-200' };
    default: return { label: normalized, toneClass: 'bg-slate-50 text-slate-600 border border-slate-200' };
  }
};

type BoardColumnKey = 'pending' | 'confirmed' | 'in_transit' | 'delivered';

const BOARD_COLUMNS: { key: BoardColumnKey; title: string; subtitle: string; color: string; accent: string }[] = [
  { key: 'pending', title: 'Planned', subtitle: 'Awaiting confirmation', color: 'bg-amber-50', accent: 'border-amber-400' },
  { key: 'confirmed', title: 'Confirmed', subtitle: 'Ready to dispatch', color: 'bg-emerald-50', accent: 'border-emerald-400' },
  { key: 'in_transit', title: 'In Transit', subtitle: 'On the road', color: 'bg-sky-50', accent: 'border-sky-400' },
  { key: 'delivered', title: 'Delivered', subtitle: 'Completed jobs', color: 'bg-slate-50', accent: 'border-slate-400' },
];

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const { bookings, addBooking, updateBooking } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const isCustomer = user?.role === 'customer';

  const filteredBookings = useMemo(() => {
    let baseData = bookings;
    if (isCustomer) {
        const customerId = Number(user?.id);
        baseData = !isNaN(customerId) ? bookings.filter(b => b.customer_id === customerId) : [];
    }

    return baseData.filter(b => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            b.booking_number.toLowerCase().includes(lowerTerm) ||
            b.pickup_city.toLowerCase().includes(lowerTerm) ||
            b.delivery_city.toLowerCase().includes(lowerTerm)
        );
    });
  }, [bookings, user, searchTerm, statusFilter, isCustomer]);

  const bookingsByStatus = useMemo(() => {
    const grouped: Record<string, Booking[]> = { pending: [], confirmed: [], in_transit: [], delivered: [], cancelled: [] };
    filteredBookings.forEach(b => {
        if (grouped[b.status]) grouped[b.status].push(b);
        else grouped['pending'].push(b); 
    });
    return grouped;
  }, [filteredBookings]);

  return (
    <div className="space-y-6 h-auto lg:h-[calc(100vh-8rem)] flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Bookings Board</h2>
                <p className="text-xs text-slate-500">Manage logistics pipeline and active loads</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95">
                <PlusIcon className="w-4 h-4" />
                <span>{isCustomer ? 'Request Booking' : 'New Booking'}</span>
            </button>
        </div>
        <div className="flex gap-3">
            <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search bookings..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
            </div>
            <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as BookingStatus | 'all')} 
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
            </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 lg:pb-0">
        <div className="flex h-full gap-4 min-w-max lg:min-w-0">
            {BOARD_COLUMNS.map(col => (
                <div key={col.key} className="w-80 flex flex-col h-full rounded-2xl bg-slate-100/50 border border-slate-200/60 overflow-hidden shrink-0 lg:shrink">
                    {/* Column Header */}
                    <div className={`p-3 border-t-4 ${col.accent} bg-white border-b border-slate-100`}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{col.title}</h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md">
                                {bookingsByStatus[col.key]?.length || 0}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{col.subtitle}</p>
                    </div>
                    
                    {/* Column Body */}
                    <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar max-h-[500px] lg:max-h-none">
                        {bookingsByStatus[col.key]?.map(booking => (
                            <div 
                                key={booking.id} 
                                onClick={() => setSelectedBooking(booking)}
                                className="group bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{booking.booking_number}</span>
                                    <span className="text-xs font-bold text-slate-700">${booking.total_price.toLocaleString()}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <span className="truncate max-w-[100px] min-w-0">{booking.pickup_city}</span>
                                        <span className="text-slate-300">→</span>
                                        <span className="truncate max-w-[100px] min-w-0">{booking.delivery_city}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{booking.cargo_description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <CalendarDaysIcon className="w-3 h-3" />
                                        {new Date(booking.pickup_date).toLocaleDateString()}
                                    </div>
                                    {booking.driver_id && (
                                        <div className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                            <TruckIcon className="w-3 h-3" />
                                            Driver
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!bookingsByStatus[col.key] || bookingsByStatus[col.key].length === 0) && (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                                No bookings
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {isAddModalOpen && <AddBookingModal onClose={() => setIsAddModalOpen(false)} onAddBooking={(b) => { addBooking({...b, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); setIsAddModalOpen(false); }} />}
      {selectedBooking && <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onUpdateBooking={updateBooking} userRole={user?.role} />}
    </div>
  );
};

export default BookingsPage;
