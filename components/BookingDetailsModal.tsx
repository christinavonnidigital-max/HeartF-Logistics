
import React, { useState } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { mockVehicles } from '../data/mockData';
import { mockDrivers, mockUsersForDrivers } from '../data/mockDriversData';
import { CloseIcon, MapPinIcon, CalendarDaysIcon, TruckIcon, CurrencyDollarIcon, DocumentTextIcon, UserCircleIcon, PencilSquareIcon, CheckCircleIcon } from './icons/Icons';
import { StatusPill, SubtleCard } from './UiKit';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdateBooking: (updatedBooking: Booking) => void;
  userRole?: string;
}

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; rightAction?: React.ReactNode; className?: string }> = ({ title, icon, children, rightAction, className = "" }) => (
  <div className={`mb-6 ${className}`}>
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        {icon}
        {title}
        </h3>
        {rightAction}
    </div>
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
      {children}
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-900 font-medium text-right truncate ml-4">{value || '—'}</span>
  </div>
);

// Helper to get driver name
const getDriverName = (driverId?: number) => {
    if (!driverId) return 'Unassigned';
    const driver = mockDrivers.find(d => d.id === driverId);
    if (!driver) return 'Unknown Driver';
    const user = mockUsersForDrivers.find(u => u.id === driver.user_id);
    return user ? `${user.first_name} ${user.last_name}` : `Driver #${driverId}`;
};

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose, onUpdateBooking, userRole }) => {
  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(booking.vehicle_id);
  const [selectedDriverId, setSelectedDriverId] = useState(booking.driver_id);

  const customer = mockCustomers.find(c => c.id === booking.customer_id);
  const vehicle = mockVehicles.find(v => v.id === booking.vehicle_id);
  const driverName = getDriverName(booking.driver_id);

  const isCustomer = userRole === 'customer';

  const handleStatusUpdate = (status: BookingStatus) => {
    if (isCustomer) return;
    onUpdateBooking({ ...booking, status });
    onClose();
  };

  const handleSaveAssignment = () => {
    onUpdateBooking({
        ...booking,
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId,
    });
    setIsAssignmentEditing(false);
  };

  const handleCancelAssignment = () => {
    setSelectedVehicleId(booking.vehicle_id);
    setSelectedDriverId(booking.driver_id);
    setIsAssignmentEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div 
        className="bg-slate-50 w-full max-w-lg h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-slate-200 p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{booking.booking_number}</h2>
              <StatusPill label={booking.status.replace('_', ' ')} tone={booking.status === 'confirmed' ? 'success' : booking.status === 'in_transit' ? 'info' : 'neutral'} />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {customer ? customer.company_name : `Customer #${booking.customer_id}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 space-y-6">
          
          {/* Route Visualization Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Route Itinerary</span>
             </div>
             <div className="p-5 relative">
                {/* Connecting Line */}
                <div className="absolute left-[29px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-slate-200"></div>
                
                {/* Pickup */}
                <div className="relative flex gap-4 mb-8">
                  <div className="w-5 h-5 rounded-full bg-white border-4 border-orange-500 z-10 flex-shrink-0"></div>
                  <div className="-mt-1">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Pickup</p>
                    <p className="text-lg font-semibold text-slate-900 leading-tight">{booking.pickup_city}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{booking.pickup_address}</p>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                      <CalendarDaysIcon className="w-3.5 h-3.5" /> 
                      {new Date(booking.pickup_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="relative flex gap-4">
                  <div className="w-5 h-5 rounded-full bg-slate-800 z-10 flex-shrink-0"></div>
                  <div className="-mt-1">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Delivery</p>
                    <p className="text-lg font-semibold text-slate-900 leading-tight">{booking.delivery_city}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{booking.delivery_address}</p>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                      <CalendarDaysIcon className="w-3.5 h-3.5" /> 
                      {new Date(booking.delivery_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6">
              
              <DetailSection title="Cargo Manifest" icon={<DocumentTextIcon className="w-4 h-4"/>}>
                <DetailRow label="Description" value={booking.cargo_description} />
                <DetailRow label="Type" value={<span className="capitalize">{booking.cargo_type.replace('_', ' ')}</span>} />
                <DetailRow label="Weight" value={`${booking.weight_tonnes} tonnes`} />
                {booking.requires_refrigeration && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sky-700 bg-sky-50 p-2 rounded-lg text-xs font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        Requires Cold Chain / Refrigeration
                    </div>
                  </div>
                )}
              </DetailSection>

              <DetailSection 
                title="Fleet Assignment" 
                icon={<TruckIcon className="w-4 h-4"/>}
                rightAction={
                    !isCustomer && !isAssignmentEditing && (
                        <button 
                            onClick={() => setIsAssignmentEditing(true)}
                            className="text-xs text-orange-600 font-bold uppercase tracking-wide hover:text-orange-800 transition-colors"
                        >
                            Edit
                        </button>
                    )
                }
              >
                {isAssignmentEditing ? (
                    <div className="space-y-3 animate-in fade-in">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned Vehicle</label>
                            <select 
                                value={selectedVehicleId || ''} 
                                onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-lg border border-slate-300 text-sm p-2.5 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                <option value="">Unassigned</option>
                                {mockVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration_number})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned Driver</label>
                            <select 
                                value={selectedDriverId || ''} 
                                onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-lg border border-slate-300 text-sm p-2.5 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                <option value="">Unassigned</option>
                                {mockDrivers.map(d => {
                                    const name = getDriverName(d.id);
                                    return <option key={d.id} value={d.id}>{name}</option>
                                })}
                            </select>
                        </div>
                        <div className="flex gap-2 mt-2 pt-2">
                            <button onClick={handleSaveAssignment} className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition shadow-sm">Save Assignment</button>
                            <button onClick={handleCancelAssignment} className="flex-1 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vehicle ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <TruckIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Vehicle</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration_number})` : 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${booking.driver_id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                <UserCircleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Driver</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {booking.driver_id ? driverName : 'Unassigned'}
                                </p>
                            </div>
                        </div>
                    </>
                )}
              </DetailSection>

              <DetailSection title="Financials" icon={<CurrencyDollarIcon className="w-4 h-4"/>}>
                <DetailRow label="Total Price" value={<span className="font-mono text-base">{new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(booking.total_price)}</span>} />
                <DetailRow label="Status" value={<StatusPill label={booking.payment_status} tone={booking.payment_status === 'paid' ? 'success' : 'warn'} />} />
              </DetailSection>
          </div>

        </div>

        {/* Footer Actions */}
        {!isCustomer && (
          <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">Workflow Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {booking.status === BookingStatus.PENDING && (
                <button onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)} className="col-span-2 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm shadow-emerald-200">
                  Confirm Booking
                </button>
              )}
              {booking.status === BookingStatus.CONFIRMED && (
                <button onClick={() => handleStatusUpdate(BookingStatus.IN_TRANSIT)} className="col-span-2 py-2.5 px-4 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition shadow-sm shadow-sky-200">
                  Dispatch Driver
                </button>
              )}
              {booking.status === BookingStatus.IN_TRANSIT && (
                <button onClick={() => handleStatusUpdate(BookingStatus.DELIVERED)} className="col-span-2 py-2.5 px-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition shadow-sm">
                  Mark Delivered
                </button>
              )}
              {booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.DELIVERED && (
                 <button onClick={() => handleStatusUpdate(BookingStatus.CANCELLED)} className="col-span-2 mt-1 py-2 px-4 bg-white border border-slate-200 text-rose-600 rounded-xl font-medium hover:bg-rose-50 hover:border-rose-100 transition">
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailsModal;
