import type { Booking } from '../../types';
import { BookingStatus } from '../../types';
import type { UserRole } from '../../auth/AuthContext';
import { bookingTransitions } from '../../utils/booking';

export type Action =
  | 'booking.view'
  | 'booking.update'
  | 'booking.status.change'
  | 'booking.assign'
  | 'audit.view'
  | 'permissions.manage'
  | 'files.view'
  | 'files.upload'
  | 'data.import'
  | 'data.export';

export type PermissionsMatrix = Record<UserRole, Partial<Record<Action, boolean>>>;

export const PERMISSIONS_STORAGE_KEY = 'hf_permissions_matrix_v1';

export const DEFAULT_PERMISSIONS: PermissionsMatrix = {
  admin: {
    'booking.view': true,
    'booking.update': true,
    'booking.status.change': true,
    'booking.assign': true,
    'audit.view': true,
    'permissions.manage': true,
    'files.view': true,
    'files.upload': true,
    'data.import': true,
    'data.export': true,
  },
  dispatcher: {
    'booking.view': true,
    'booking.update': true,
    'booking.status.change': true,
    'booking.assign': true,
    'audit.view': true,
    'permissions.manage': false,
    'files.view': true,
    'files.upload': true,
    'data.import': true,
    'data.export': true,
  },
  ops_manager: {
    'booking.view': true,
    'booking.update': true,
    'booking.status.change': true,
    'booking.assign': true,
    'audit.view': true,
    'permissions.manage': true,
    'files.view': true,
    'files.upload': true,
    'data.import': true,
    'data.export': true,
  },
  finance: {
    'booking.view': true,
    'booking.update': false,
    'booking.status.change': false,
    'booking.assign': false,
    'audit.view': true,
    'permissions.manage': false,
    'files.view': true,
    'files.upload': true,
    'data.import': true,
    'data.export': true,
  },
  customer: {
    'booking.view': true,
    'booking.update': true,
    'booking.status.change': false,
    'booking.assign': false,
    'audit.view': false,
    'permissions.manage': false,
    'files.view': true,
    'files.upload': true,
    'data.import': false,
    'data.export': false,
  },
  driver: {
    'booking.view': true,
    'booking.update': false,
    'booking.status.change': true,
    'booking.assign': false,
    'audit.view': false,
    'permissions.manage': false,
    'files.view': true,
    'files.upload': true,
    'data.import': false,
    'data.export': false,
  },
};

const loadStoredPermissions = (): PermissionsMatrix | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PermissionsMatrix;
  } catch {
    return null;
  }
};

const getMatrix = () => loadStoredPermissions() ?? DEFAULT_PERMISSIONS;

export function can(action: Action, role?: UserRole, _entity?: unknown): boolean {
  if (!role) return false;
  const matrix = getMatrix();
  const stored = matrix[role]?.[action];
  if (typeof stored === 'boolean') return stored;
  return DEFAULT_PERMISSIONS[role]?.[action] ?? false;
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
