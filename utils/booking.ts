import { BookingStatus } from '../types';

export const bookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.DRAFT]: [BookingStatus.SCHEDULED, BookingStatus.CANCELLED],
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.SCHEDULED]: [BookingStatus.DISPATCHED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.DISPATCHED, BookingStatus.IN_TRANSIT, BookingStatus.CANCELLED],
  [BookingStatus.DISPATCHED]: [BookingStatus.IN_TRANSIT, BookingStatus.CANCELLED],
  [BookingStatus.IN_TRANSIT]: [BookingStatus.DELIVERED, BookingStatus.CANCELLED],
  [BookingStatus.DELIVERED]: [BookingStatus.CLOSED],
  [BookingStatus.CLOSED]: [],
  [BookingStatus.CANCELLED]: [],
};

export const canTransition = (from: BookingStatus, to: BookingStatus) => {
  return bookingTransitions[from]?.includes(to) || false;
};
