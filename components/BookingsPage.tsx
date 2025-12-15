
import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import EmptyState from './EmptyState';
import { DocumentTextIcon, MapPinIcon, TruckIcon, ClockIcon, SearchIcon, PlusIcon, CalendarDaysIcon } from './icons';
import { SparklesIcon } from './icons';
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

const BOARD_COLUMNS: { key: BoardColumnKey; title: string; subtitle: string; color: string; accent: string; borderColor: string }[] = [
  { key: 'pending', title: 'Planned', subtitle: 'Awaiting confirmation', color: 'bg-amber-50/50', accent: 'bg-amber-400', borderColor: 'border-amber-200' },
  { key: 'confirmed', title: 'Confirmed', subtitle: 'Ready to dispatch', color: 'bg-emerald-50/50', accent: 'bg-emerald-400', borderColor: 'border-emerald-200' },
  { key: 'in_transit', title: 'In Transit', subtitle: 'On the road', color: 'bg-sky-50/50', accent: 'bg-sky-400', borderColor: 'border-sky-200' },
  { key: 'delivered', title: 'Delivered', subtitle: 'Completed jobs', color: 'bg-slate-50/50', accent: 'bg-slate-400', borderColor: 'border-slate-200' },
];

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const { bookings, addBooking, updateBooking } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

    // Dev/test helper: listen for a custom event to open a booking details modal.
    // This allows tests to open the modal reliably without relying on complex UI interactions.
    React.useEffect(() => {
        const handler = (ev: Event) => {
            try {
                // @ts-ignore
                const d = (ev as CustomEvent).detail;
                if (d && d.bookingId != null) setSelectedBookingId(Number(d.bookingId));
            } catch {
                // ignore
            }
        };
        window.addEventListener('hf:open-booking', handler as EventListener);
        return () => window.removeEventListener('hf:open-booking', handler as EventListener);
    }, []);

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
    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Bookings Board</h2>
            <p className="text-xs text-slate-500">Manage logistics pipeline and active loads</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search route, ID..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95">
                <PlusIcon className="w-4 h-4" />
                <span>{isCustomer ? 'Request Booking' : 'New Booking'}</span>
            </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 lg:pb-0">
        <div className="flex h-full gap-5 min-w-max lg:min-w-0 px-1">
            {BOARD_COLUMNS.map(col => (
                <div key={col.key} className="w-80 flex flex-col h-full rounded-2xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 lg:shrink">
                    {/* Column Header */}
                    <div className="p-3 bg-white border-b border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${col.accent}`}></div>
                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{col.title}</h3>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                {bookingsByStatus[col.key]?.length || 0}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-700 ml-4">{col.subtitle}</p>
                    </div>
                    
                    {/* Column Body */}
                    <div className={`p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar max-h-125 lg:max-h-none ${col.color}`}>
                        {bookingsByStatus[col.key]?.map(booking => (
                            <div 
                                key={booking.id} 
                                onClick={() => setSelectedBookingId(booking.id)}
                                className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] hover:border-orange-200/60 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
                            >
                                {/* Status Indicator Line on Hover */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${col.accent}`}></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase font-mono bg-slate-50 px-1.5 py-0.5 rounded">{booking.booking_number}</span>
                                    {booking.requires_refrigeration && (
                                         <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                            Cold
                                         </div>
                                    )}
                                </div>

                                {/* Route Visual */}
                                <div className="mb-4 relative pl-1">
                                    <div className="absolute left-[3.5px] top-2 bottom-2 w-px bg-linear-to-b from-orange-300 to-slate-300"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-50 z-10 relative shadow-sm"></div>
                                            <span className="text-sm font-bold text-slate-800 truncate">{booking.pickup_city}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-800 ring-4 ring-slate-50 z-10 relative shadow-sm"></div>
                                            <span className="text-sm font-bold text-slate-800 truncate">{booking.delivery_city}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="flex items-end justify-between pt-3 border-t border-slate-50 mt-2">
                                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                                        <span className="text-xs text-slate-500 truncate font-medium">{booking.cargo_description}</span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700">
                                            <CalendarDaysIcon className="w-3 h-3 shrink-0" />
                                            {new Date(booking.pickup_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    
                                    <div className="text-right shrink-0">
                                         {booking.driver_id && (
                                            <div className="mb-1 flex justify-end">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                    <TruckIcon className="w-3 h-3" />
                                                    Assigned
                                                </div>
                                            </div>
                                         )}
                                         <p className="text-sm font-bold text-slate-900">
                                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: booking.currency, maximumFractionDigits: 0 }).format(booking.total_price)}
                                         </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!bookingsByStatus[col.key] || bookingsByStatus[col.key].length === 0) && (
                            <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic bg-slate-50/50">
                                <DocumentTextIcon className="w-6 h-6 mb-1 opacity-50" />
                                No bookings
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

            {isAddModalOpen && <AddBookingModal onClose={() => setIsAddModalOpen(false)} onAddBooking={(b) => { addBooking({...b, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); setIsAddModalOpen(false); }} />}
            {(
                selectedBookingId == null
                ? null
                : (bookings.find(b => b.id === selectedBookingId) ?? null)
            ) && (
                <BookingDetailsModal
                    booking={bookings.find(b => b.id === selectedBookingId) as Booking}
                    onClose={() => setSelectedBookingId(null)}
                    onUpdateBooking={updateBooking}
                    userRole={user?.role}
                />
            )}
    </div>
  );
};

export default BookingsPage;
