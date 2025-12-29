
import React, { useMemo, useState, useEffect } from 'react';
import type { Booking } from '../types';
import { BookingStatus } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { mockVehicles } from '../data/mockData';
import { CloseIcon, PencilSquareIcon } from './icons';
import { Button, SectionHeader, StatusPill, SubtleCard } from './UiKit';
import { bookingTransitions } from '../utils/booking';
import { can, canTransitionBookingStatus } from '../src/lib/permissions';
import type { UserRole } from '../auth/AuthContext';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdateBooking: (updatedBooking: Booking) => void;
  userRole?: string;
}

const prettyStatus = (s?: string | null) =>
  (s ?? '')
    .toString()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const toneFor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'delivered' || s === 'closed') return 'success';
  if (s === 'pending' || s === 'scheduled') return 'warn';
  if (s === 'cancelled') return 'danger';
  if (s === 'in_transit' || s === 'dispatched') return 'info';
  return 'neutral';
};

const formatAt = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onUpdateBooking,
  userRole,
}) => {
  const role = userRole as UserRole | undefined;

  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(booking.vehicle_id);
  const [selectedDriverId, setSelectedDriverId] = useState<number | undefined>(booking.driver_id);

  const customer = mockCustomers.find((c) => c.id === booking.customer_id);
  const vehicle = mockVehicles.find((v) => v.id === booking.vehicle_id);

  const statusHistory = useMemo(() => {
    const list = booking.status_history ?? [];
    const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at));
    if (sorted.length) return sorted;

    // fallback: show at least "created"
    return [
      {
        at: booking.created_at,
        from: null,
        to: booking.status,
        by: undefined,
      },
    ];
  }, [booking]);

  const canChangeStatus = can('booking.status.change', role, booking);

  const nextStatuses = bookingTransitions[booking.status] ?? [];

  const doStatusUpdate = (next: BookingStatus) => {
    onUpdateBooking({ ...booking, status: next });
  };

  const canGoTo = (to: BookingStatus) => {
    if (!canChangeStatus) return false;
    return canTransitionBookingStatus({ role, from: booking.status, to });
  };

  const doSaveAssignment = () => {
    onUpdateBooking({
      ...booking,
      vehicle_id: selectedVehicleId,
      driver_id: selectedDriverId,
    });
    setIsAssignmentEditing(false);
  };

  const isCustomer = role === 'customer';

  useEffect(() => {
    // lock body scroll when details modal is mounted
    const origOverflow = document.body.style.overflow;
    const origPaddingRight = document.body.style.paddingRight || '';
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = origOverflow;
      document.body.style.paddingRight = origPaddingRight;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start w-full">
        <div className="w-full md:w-[calc(100%-16rem)] flex items-start md:items-center justify-center p-4 sm:p-6">
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground truncate">{booking.booking_number}</h2>
              <StatusPill label={prettyStatus(booking.status)} tone={toneFor(booking.status)} />
            </div>
            <p className="mt-1 text-sm text-foreground/70">
              {customer ? customer.company_name : `Customer #${booking.customer_id}`}
            </p>
          </div>

          <button onClick={onClose} className="rounded-md px-2 py-1 text-foreground/70 hover:bg-muted/60" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

        {/* Body (truncated for diagnostics) */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-sm text-foreground/70">(body truncated for diagnostics)</div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default BookingDetailsModal;
