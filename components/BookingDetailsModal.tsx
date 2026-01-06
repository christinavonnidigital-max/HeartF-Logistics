
import React, { useMemo, useState, useEffect } from 'react';
import type { Booking } from '../types';
import { BookingStatus, ProofType } from '../types';
import { mockCustomers } from '../data/mockCrmData';
import { CloseIcon } from './icons';
import { Button, SectionHeader, StatusPill, SubtleCard, Input, Select, Label } from './UiKit';
import { bookingTransitions } from '../utils/booking';
import { can, canTransitionBookingStatus } from '../src/lib/permissions';
import type { UserRole } from '../auth/AuthContext';
import { useData } from '../contexts/DataContext';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdateBooking: (updatedBooking: Booking) => void;
  userRole?: string;
  proofMaxMb: number;
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

const dotForStatus = (status: string) => {
  const tone = toneFor(status);
  if (tone === 'success') return 'bg-emerald-500';
  if (tone === 'warn') return 'bg-amber-500';
  if (tone === 'danger') return 'bg-rose-500';
  if (tone === 'info') return 'bg-sky-500';
  return 'bg-slate-400';
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
  proofMaxMb,
}) => {
  const role = userRole as UserRole | undefined;
  const { vehicles, drivers, deliveryProofs, addDeliveryProof } = useData();

  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(booking.vehicle_id);
  const [selectedDriverId, setSelectedDriverId] = useState<number | undefined>(booking.driver_id);
  const [proofType, setProofType] = useState<ProofType>(ProofType.PHOTO);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofRecipient, setProofRecipient] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofError, setProofError] = useState('');

  const customer = mockCustomers.find((c) => c.id === booking.customer_id);
  const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);
  const driver = drivers.find((d) => d.id === booking.driver_id);

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

  const proofsForBooking = useMemo(() => {
    return deliveryProofs
      .filter((proof) => proof.booking_id === booking.id)
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  }, [deliveryProofs, booking.id]);

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

  const handleAddProof = () => {
    const needsFile = proofType === ProofType.PHOTO || proofType === ProofType.SIGNATURE;
    if (needsFile && !proofFile) {
      setProofError('Attach a proof file before saving.');
      return;
    }
    if (proofError) {
      return;
    }

    addDeliveryProof({
      booking_id: booking.id,
      driver_id: booking.driver_id ?? 0,
      proof_type: proofType,
      photo_url: proofType === ProofType.PHOTO ? proofFile?.name : undefined,
      signature_url: proofType === ProofType.SIGNATURE ? proofFile?.name : undefined,
      recipient_name: proofRecipient.trim() || undefined,
      notes: proofNotes.trim() || undefined,
      captured_at: new Date().toISOString(),
    });

    setProofFile(null);
    setProofPreviewUrl(null);
    setProofRecipient('');
    setProofNotes('');
    setProofError('');
  };

  useEffect(() => {
    setSelectedVehicleId(booking.vehicle_id);
    setSelectedDriverId(booking.driver_id);
    setProofFile(null);
    setProofPreviewUrl(null);
    setProofRecipient('');
    setProofNotes('');
    setProofError('');
  }, [booking.id, booking.vehicle_id, booking.driver_id]);

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [proofFile]);

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
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className="min-h-full flex items-start md:items-center justify-center p-4 sm:p-6 md:pl-64"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl flex flex-col">
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

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-6">
                <div className="space-y-6">
                  <SubtleCard className="p-4 space-y-3">
                    <div className="text-sm font-semibold text-foreground">Route</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-foreground-muted">Pickup</p>
                        <p className="font-semibold text-foreground">{booking.pickup_city}</p>
                        <p className="text-xs text-foreground-muted">{booking.pickup_address}</p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(booking.pickup_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-foreground-muted">Delivery</p>
                        <p className="font-semibold text-foreground">{booking.delivery_city}</p>
                        <p className="text-xs text-foreground-muted">{booking.delivery_address}</p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(booking.delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </SubtleCard>

                  <SubtleCard className="p-4 space-y-3">
                    <div className="text-sm font-semibold text-foreground">Cargo & Pricing</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-foreground-muted">Cargo</p>
                        <p className="font-semibold text-foreground capitalize">{booking.cargo_type}</p>
                        <p className="text-xs text-foreground-muted">{booking.cargo_description}</p>
                        <p className="text-xs text-foreground-muted">
                          {booking.weight_tonnes} tonnes
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-foreground-muted">Pricing</p>
                        <p className="font-semibold text-foreground">
                          {new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: booking.currency,
                            maximumFractionDigits: 0,
                          }).format(booking.total_price)}
                        </p>
                        <p className="text-xs text-foreground-muted">Payment: {booking.payment_status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    {booking.notes ? (
                      <p className="text-xs text-foreground-muted">Notes: {booking.notes}</p>
                    ) : null}
                  </SubtleCard>

                  <div className="space-y-3">
                    <SectionHeader title="Status timeline" subtitle="Latest transitions and context" />
                    <div className="space-y-3">
                      {statusHistory.map((event, idx) => (
                        <div key={`${event.at}-${idx}`} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={`mt-1 h-2 w-2 rounded-full ${dotForStatus(event.to)}`} />
                            {idx < statusHistory.length - 1 ? (
                              <span className="flex-1 w-px bg-border mt-1" />
                            ) : null}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-foreground">
                                Moved to {prettyStatus(event.to)}
                              </span>
                              <span className="text-xs text-foreground-muted">{formatAt(event.at)}</span>
                            </div>
                            {event.by?.role ? (
                              <div className="text-xs text-foreground-muted">By {event.by.role}</div>
                            ) : null}
                            {event.note ? (
                              <div className="text-xs text-foreground-muted">{event.note}</div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <SubtleCard className="p-4 space-y-3">
                    <SectionHeader
                      title="Assignment"
                      subtitle="Vehicle + driver pairing"
                      right={
                        isCustomer ? null : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAssignmentEditing((prev) => !prev)}
                          >
                            {isAssignmentEditing ? 'Cancel' : 'Edit'}
                          </Button>
                        )
                      }
                    />
                    {isAssignmentEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Vehicle</Label>
                          <Select
                            value={selectedVehicleId ?? ''}
                            onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Unassigned</option>
                            {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.registration_number} • {v.make} {v.model}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Driver</Label>
                          <Select
                            value={selectedDriverId ?? ''}
                            onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Unassigned</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                Driver #{d.id} • {d.license_number}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedVehicleId(booking.vehicle_id);
                              setSelectedDriverId(booking.driver_id);
                              setIsAssignmentEditing(false);
                            }}
                          >
                            Reset
                          </Button>
                          <Button variant="primary" size="sm" onClick={doSaveAssignment}>
                            Save assignment
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground-muted">Vehicle</p>
                          <p className="font-semibold text-foreground">
                            {vehicle
                              ? `${vehicle.registration_number} • ${vehicle.make} ${vehicle.model}`
                              : 'Unassigned'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground-muted">Driver</p>
                          <p className="font-semibold text-foreground">
                            {driver ? `Driver #${driver.id} • ${driver.license_number}` : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    )}
                  </SubtleCard>

                  <SubtleCard className="p-4 space-y-3">
                    <SectionHeader title="Next status" subtitle="Move booking forward" />
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.length ? (
                        nextStatuses.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant="secondary"
                            onClick={() => doStatusUpdate(status)}
                            disabled={!canGoTo(status)}
                          >
                            {prettyStatus(status)}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs text-foreground-muted">No further transitions available.</p>
                      )}
                    </div>
                  </SubtleCard>

                  <SubtleCard className="p-4 space-y-3">
                    <SectionHeader title="Proof of delivery" subtitle="Upload or review delivery evidence" />
                    {!isCustomer && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Proof type</Label>
                          <Select
                            value={proofType}
                            onChange={(e) => setProofType(e.target.value as ProofType)}
                          >
                            {Object.values(ProofType).map((type) => (
                              <option key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Attachment</Label>
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              if (!file) {
                                setProofFile(null);
                                setProofError('');
                                return;
                              }
                              const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
                              const maxBytes = Math.max(1, proofMaxMb) * 1024 * 1024;
                              if (!allowedTypes.includes(file.type)) {
                                setProofFile(null);
                                setProofError('Only PNG, JPG, or PDF files are allowed.');
                                return;
                              }
                              if (file.size > maxBytes) {
                                setProofFile(null);
                                setProofError(`File exceeds ${Math.max(1, proofMaxMb)} MB.`);
                                return;
                              }
                              setProofFile(file);
                              setProofError('');
                            }}
                            className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                          />
                        </div>
                        {proofFile ? (
                          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{proofFile.name}</span>
                              <span className="text-foreground-muted">{Math.round(proofFile.size / 1024)} KB</span>
                            </div>
                            {proofPreviewUrl && proofFile.type.startsWith('image/') ? (
                              <img
                                src={proofPreviewUrl}
                                alt="Proof preview"
                                className="mt-3 max-h-40 w-full rounded-lg border border-border object-contain bg-white"
                              />
                            ) : null}
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <Label>Recipient name</Label>
                          <Input value={proofRecipient} onChange={(e) => setProofRecipient(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input value={proofNotes} onChange={(e) => setProofNotes(e.target.value)} />
                        </div>
                        {proofError ? <p className="text-xs text-rose-600">{proofError}</p> : null}
                        <div className="flex justify-end">
                          <Button variant="primary" size="sm" onClick={handleAddProof}>
                            Add proof
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {proofsForBooking.length ? (
                        proofsForBooking.map((proof) => (
                          <div key={proof.id} className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground capitalize">
                                {proof.proof_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-foreground-muted">{formatAt(proof.captured_at)}</span>
                            </div>
                            {proof.photo_url || proof.signature_url ? (
                              <div className="text-foreground-muted mt-1">
                                File: {proof.photo_url ?? proof.signature_url}
                              </div>
                            ) : null}
                            {proof.recipient_name ? (
                              <div className="text-foreground-muted">Recipient: {proof.recipient_name}</div>
                            ) : null}
                            {proof.notes ? <div className="text-foreground-muted">Notes: {proof.notes}</div> : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-foreground-muted">No proofs uploaded yet.</p>
                      )}
                    </div>
                  </SubtleCard>
                </div>
              </div>
            </div>
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
