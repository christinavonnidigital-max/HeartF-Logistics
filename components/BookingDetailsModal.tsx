
import React, { useMemo, useState } from 'react';
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

  return (
    <div
      className="fixed inset-0 z-80 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
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

          <button onClick={onClose} className="rounded-xl px-2 py-1 text-foreground/70 hover:bg-muted/60" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SubtleCard className="p-4 lg:col-span-2">
              <SectionHeader title="Route and schedule" subtitle="Pickup and delivery details" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-foreground/70">Pickup</div>
                  <div className="font-semibold">{booking.pickup_city}</div>
                  <div className="text-foreground/70">{booking.pickup_address}</div>
                  <div className="mt-1 text-foreground/70">{formatAt(booking.pickup_date)}</div>
                </div>
                <div>
                  <div className="text-foreground/70">Delivery</div>
                  <div className="font-semibold">{booking.delivery_city}</div>
                  <div className="text-foreground/70">{booking.delivery_address}</div>
                  <div className="mt-1 text-foreground/70">{formatAt(booking.delivery_date)}</div>
                </div>
              </div>
            </SubtleCard>

            <SubtleCard className="p-4">
              <SectionHeader title="Assignment" subtitle="Vehicle and driver" />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground/70">Vehicle</span>
                  <span className="font-semibold">{vehicle ? vehicle.registration_number : booking.vehicle_id ? `#${booking.vehicle_id}` : 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground/70">Driver</span>
                  <span className="font-semibold">{booking.driver_id ? `#${booking.driver_id}` : 'Unassigned'}</span>
                </div>

                {!isCustomer && can('booking.assign', role, booking) ? (
                  <div className="pt-3">
                    {!isAssignmentEditing ? (
                      <Button variant="secondary" onClick={() => setIsAssignmentEditing(true)} leftIcon={<PencilSquareIcon className="w-4 h-4" />}>Edit assignment</Button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-foreground/70">Vehicle ID</label>
                          <input aria-label="Vehicle ID" placeholder="Vehicle ID" className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" type="number" value={selectedVehicleId ?? ''} onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        <div>
                          <label className="text-xs text-foreground/70">Driver ID</label>
                          <input aria-label="Driver ID" placeholder="Driver ID" className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" type="number" value={selectedDriverId ?? ''} onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : undefined)} />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="primary" onClick={doSaveAssignment}>Save</Button>
                          <Button variant="secondary" onClick={() => { setSelectedVehicleId(booking.vehicle_id); setSelectedDriverId(booking.driver_id); setIsAssignmentEditing(false); }}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </SubtleCard>
          </div>

          {/* Status transitions */}
          <SubtleCard className="p-4">
            <SectionHeader title="Status" subtitle={isCustomer ? 'Customers cannot change operational status.' : canChangeStatus ? 'Transitions are role-gated and tracked in the timeline.' : 'You do not have permission to change status.'} />

            <div className="mt-4 flex flex-wrap gap-2">
              {nextStatuses.length === 0 ? (
                <div className="text-sm text-foreground/70">No further transitions from this state.</div>
              ) : (
                nextStatuses.map((to) => (
                  <Button key={to} variant={to === BookingStatus.CANCELLED ? 'danger' : 'secondary'} disabled={!canGoTo(to) || isCustomer} onClick={() => doStatusUpdate(to)} title={!canGoTo(to) ? 'Not allowed for your role' : undefined}>
                    Move to {prettyStatus(to)}
                  </Button>
                ))
              )}
            </div>
          </SubtleCard>

          {/* Timeline */}
          <SubtleCard className="p-4">
            <SectionHeader title="Status timeline" subtitle="Historical status changes with timestamps" />

            <ol className="mt-4 space-y-4">
              {statusHistory.slice().reverse().map((h, idx) => (
                <li key={`${h.at}-${idx}`} className="flex gap-3">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-sm text-foreground">{prettyStatus(h.to)}</div>
                      <div className="text-xs text-foreground/70">{formatAt(h.at)}</div>
                    </div>
                    {h.from ? (
                      <div className="text-xs text-foreground/70 mt-1">From {prettyStatus(h.from)}</div>
                    ) : (
                      <div className="text-xs text-foreground/70 mt-1">Created</div>
                    )}
                    {h.by ? (
                      <div className="text-xs text-foreground/70 mt-1">By {h.by.name ?? h.by.role}</div>
                    ) : null}
                    {h.note ? <div className="text-sm mt-1">{h.note}</div> : null}
                  </div>
                </li>
              ))}
            </ol>
          </SubtleCard>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
