#!/usr/bin/env node
// Simple smoke script to simulate a booking status change and audit entry generation
// Mirrors the logic in contexts/DataContext.updateBooking

const nowIso = new Date().toISOString();

// Simulated BookingStatus enum (string values as used in app)
const BookingStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

// Sample booking to change
const booking = {
  id: 42,
  booking_number: 'BKN-042',
  status: BookingStatus.SCHEDULED,
  status_history: [],
  booking_number_display: 'BKN-042',
};

// Simulated actor (what would be read from localStorage 'hf_current_user')
const actor = {
  id: 'u2',
  role: 'ops_manager',
};

function makeStatusChange(prevStatus, nextStatus, actor) {
  const id = `st_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    id,
    at: new Date().toISOString(),
    from: prevStatus ?? null,
    to: nextStatus,
    actor_user_id: actor?.id,
    actor_role: actor?.role,
  };
}

function makeAuditEntry(prevStatus, nextStatus, booking, actor) {
  const id = `au_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    id,
    at: new Date().toISOString(),
    actor_user_id: actor?.id,
    actor_role: actor?.role,
    action: 'booking.status_change',
    entity_type: 'booking',
    entity_id: booking.id,
    summary: `Booking ${booking.booking_number}: ${prevStatus} -> ${nextStatus}`,
    meta: { from: prevStatus, to: nextStatus },
  };
}

// Simulate changing status from SCHEDULED -> DISPATCHED
const prevStatus = booking.status;
const nextStatus = BookingStatus.DISPATCHED;

// Create status change entry
const statusChange = makeStatusChange(prevStatus, nextStatus, actor);

// Apply to booking
booking.status = nextStatus;
booking.updated_at = nowIso;
booking.status_history = [...(booking.status_history || []), statusChange].slice(-50);

// Create audit entry
const auditEntry = makeAuditEntry(prevStatus, nextStatus, booking, actor);

// In the real app this audit would be appended to data.audit_log and persisted to localStorage
const audit_log = [auditEntry];

console.log('Simulated booking after status change:');
console.log(JSON.stringify(booking, null, 2));

console.log('\nSimulated audit entry:');
console.log(JSON.stringify(auditEntry, null, 2));

console.log('\nSimulated audit_log array:');
console.log(JSON.stringify(audit_log, null, 2));

process.exit(0);
