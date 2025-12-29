import type { Booking } from '../../types';
import { BookingStatus } from '../../types';
import type { UserRole } from '../../auth/AuthContext';
import { bookingTransitions } from '../../utils/booking';

export type Action =
  | 'booking.view'
  | 'booking.update'
  | 'booking.status.change'
  | 'booking.assign'
  | 'audit.view';

export function can(action: Action, role?: UserRole, _entity?: unknown): boolean {
  if (!role) return false;
  if (role === 'admin') return true;

  switch (action) {
    case 'booking.view':
      return true; // everyone logged in can view

    case 'booking.update':
      return role === 'dispatcher' || role === 'customer' || role === 'ops_manager';

    case 'booking.status.change':
      return role === 'dispatcher' || role === 'driver' || role === 'ops_manager';

    case 'booking.assign':
      return role === 'dispatcher' || role === 'ops_manager';

    case 'audit.view':
      return role === 'dispatcher' || role === 'ops_manager' || role === 'finance';

    default:
      return false;
  }
}

const transitionRoleMap: Record<UserRole, Partial<Record<BookingStatus, BookingStatus[]>>> = {
  admin: {},
  dispatcher: bookingTransitions,
  ops_manager: bookingTransitions,
  driver: {
    [BookingStatus.CONFIRMED]: [BookingStatus.IN_TRANSIT],
    [BookingStatus.IN_TRANSIT]: [BookingStatus.DELIVERED],
  },
  customer: {
    [BookingStatus.PENDING]: [BookingStatus.CANCELLED],
  },
  finance: {},
};

export function canTransitionBookingStatus(args: {
  role?: UserRole;
  from: BookingStatus;
  to: BookingStatus;
}): boolean {
  const { role, from, to } = args;
  if (!role) return false;
  if (role === 'admin') return true;

  const allowed = transitionRoleMap[role]?.[from] ?? [];
  return allowed.includes(to);
}

export function canChangeBookingStatus(role?: UserRole, booking?: Booking) {
  return can('booking.status.change', role, booking);
}

export function canTransition(role: UserRole | undefined, from: BookingStatus, to: BookingStatus) {
  return canTransitionBookingStatus({ role, from, to });
}
