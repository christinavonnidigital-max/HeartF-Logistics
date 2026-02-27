import React, { useEffect, useMemo, useState } from "react";
import { Driver, DriverAssignment, AssignmentStatus, User, EmploymentStatus } from "../types";
import {
  UserCircleIcon,
  PhoneIcon,
  BriefcaseIcon,
  ClipboardDocumentIcon,
  StarIcon,
  ShieldCheckIcon,
  DownloadIcon,
} from "./icons";
import { Button, ModalShell, Input, Select, Label } from "./UiKit";
import { downloadCsv } from "../dataIO/toCsv";

interface DriverDetailsProps {
  driver: Driver & { user?: User };
  assignments: DriverAssignment[];
  onSaveProfile?: (updatedDriver: Driver, updatedUser: User) => void;
}

const toTitle = (v: string) =>
  String(v)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const statusToneClass = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.COMPLETED:
      return "bg-emerald-100 text-emerald-700";
    case AssignmentStatus.IN_PROGRESS:
      return "bg-sky-100 text-sky-700";
    case AssignmentStatus.ASSIGNED:
      return "bg-amber-100 text-amber-700";
    case AssignmentStatus.CANCELLED:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const DATE_DMY_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const normalizeIsoDate = (value: string): string | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (
      dt.getUTCFullYear() !== year ||
      dt.getUTCMonth() !== month - 1 ||
      dt.getUTCDate() !== day
    ) {
      return null;
    }
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
  }

  const dmyMatch = raw.match(DATE_DMY_RE);
  if (!dmyMatch) return null;

  const day = Number(dmyMatch[1]);
  const month = Number(dmyMatch[2]);
  const year = Number(dmyMatch[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

const toDisplayDate = (value: string): string => {
  const iso = normalizeIsoDate(value);
  if (!iso) return String(value || "");
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

const DRIVER_META_START = "[HF_DRIVER_META]";
const DRIVER_META_END = "[/HF_DRIVER_META]";

type DriverMeta = {
  profile_photo_url?: string;
  documents?: {
    license_scan?: { name?: string; url?: string } | null;
    medical_scan?: { name?: string; url?: string } | null;
  };
};

const parseDriverMeta = (notes?: string): DriverMeta => {
  const text = String(notes || "");
  const start = text.indexOf(DRIVER_META_START);
  const end = text.indexOf(DRIVER_META_END);
  if (start === -1 || end === -1 || end <= start) return {};
  const raw = text.slice(start + DRIVER_META_START.length, end).trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const DriverDetails: React.FC<DriverDetailsProps> = ({ driver, assignments, onSaveProfile }) => {
  const user = driver.user;
  const driverMeta = useMemo(() => parseDriverMeta(driver.notes), [driver.notes]);
  const profilePhotoUrl = user?.avatar_url || driverMeta.profile_photo_url || "";
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || `Driver #${driver.id}`;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    license_number: driver.license_number || "",
    license_type: driver.license_type || "",
    license_expiry_date: toDisplayDate(driver.license_expiry_date || ""),
    employment_status: driver.employment_status,
    rating: String(driver.rating ?? ""),
    total_deliveries: String(driver.total_deliveries ?? ""),
  });

  useEffect(() => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      license_number: driver.license_number || "",
      license_type: driver.license_type || "",
      license_expiry_date: toDisplayDate(driver.license_expiry_date || ""),
      employment_status: driver.employment_status,
      rating: String(driver.rating ?? ""),
      total_deliveries: String(driver.total_deliveries ?? ""),
    });
    setEditError("");
  }, [
    driver.id,
    driver.license_number,
    driver.license_type,
    driver.license_expiry_date,
    driver.employment_status,
    driver.rating,
    driver.total_deliveries,
    user?.first_name,
    user?.last_name,
    user?.email,
    user?.phone,
  ]);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    );
  }, [assignments]);

  const completedCount = sortedAssignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length;
  const activeCount = sortedAssignments.filter((a) =>
    [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS].includes(a.status)
  ).length;
  const cancelledCount = sortedAssignments.filter((a) => a.status === AssignmentStatus.CANCELLED).length;

  const baseRating = Number(driver.rating || 4.4);
  const safetyScore = clamp(Math.round(baseRating * 19 + 10 - cancelledCount * 3), 60, 99);
  const onTimeRate = clamp(
    Math.round(90 + baseRating * 1.8 - cancelledCount * 2 + Math.min(completedCount, 5)),
    70,
    99
  );
  const fuelEfficiency = (2.4 + baseRating * 0.17).toFixed(1);

  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
  const trendValues = months.map((_, i) =>
    clamp(Math.round(62 + i * 6 + baseRating * 4 - cancelledCount * 2), 45, 98)
  );

  const incidentRows = [
    {
      label: "Hard Braking",
      detail: `${Math.max(0, Math.round((100 - safetyScore) / 4))} events detected`,
      tone:
        safetyScore >= 90
          ? "bg-emerald-100 text-emerald-700"
          : safetyScore >= 80
          ? "bg-amber-100 text-amber-700"
          : "bg-rose-100 text-rose-700",
      badge: safetyScore >= 90 ? "Excellent" : safetyScore >= 80 ? "Moderate" : "High",
    },
    {
      label: "Speeding",
      detail: `${cancelledCount} route exception(s)`,
      tone: cancelledCount === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      badge: cancelledCount === 0 ? "Excellent" : "Watch",
    },
  ];

  const feedbackRows = [
    {
      quote: "Arrived early and handled unloading professionally.",
      when: "Yesterday",
      stars: 5,
    },
    {
      quote: "Polite communication and followed all safety protocols.",
      when: "3 days ago",
      stars: 5,
    },
    {
      quote: "Consistent performance and great route discipline.",
      when: "Oct 12",
      stars: 4,
    },
  ];

  const certificationRows = [
    {
      name: `${driver.license_type} Certification`,
      expires: driver.license_expiry_date,
    },
    {
      name: "Defensive Driving",
      expires: driver.medical_certificate_expiry || driver.license_expiry_date,
    },
  ];

  const uploadedDocuments = [
    {
      key: "license",
      label: driverMeta.documents?.license_scan?.name || "Driver License Scan",
      url: driverMeta.documents?.license_scan?.url || "",
    },
    {
      key: "medical",
      label: driverMeta.documents?.medical_scan?.name || "Medical Certificate",
      url: driverMeta.documents?.medical_scan?.url || "",
    },
  ].filter((item) => item.url);

  const reportRows =
    sortedAssignments.length > 0
      ? sortedAssignments.map((a) => ({
          driver_id: driver.id,
          driver_name: fullName,
          driver_email: user?.email || "",
          driver_phone: user?.phone || "",
          employment_status: toTitle(String(driver.employment_status || "")),
          license_number: driver.license_number || "",
          license_type: driver.license_type || "",
          license_expiry_date: formatDate(driver.license_expiry_date),
          rating: Number(driver.rating || 0).toFixed(1),
          total_deliveries: driver.total_deliveries || 0,
          assignment_id: a.id,
          assignment_type: toTitle(a.assignment_type),
          assignment_status: toTitle(a.status),
          vehicle_id: a.vehicle_id,
          booking_id: a.booking_id || "",
          assigned_at: new Date(a.assigned_at).toLocaleString("en-GB"),
          completed_at: a.completed_at ? new Date(a.completed_at).toLocaleString("en-GB") : "",
          assignment_notes: a.notes || "",
        }))
      : [
          {
            driver_id: driver.id,
            driver_name: fullName,
            driver_email: user?.email || "",
            driver_phone: user?.phone || "",
            employment_status: toTitle(String(driver.employment_status || "")),
            license_number: driver.license_number || "",
            license_type: driver.license_type || "",
            license_expiry_date: formatDate(driver.license_expiry_date),
            rating: Number(driver.rating || 0).toFixed(1),
            total_deliveries: driver.total_deliveries || 0,
            assignment_id: "",
            assignment_type: "",
            assignment_status: "",
            vehicle_id: "",
            booking_id: "",
            assigned_at: "",
            completed_at: "",
            assignment_notes: "No assignments yet.",
          },
        ];

  const saveProfile = () => {
    if (!onSaveProfile) {
      setIsEditOpen(false);
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setEditError("First and last name are required.");
      return;
    }

    if (!form.license_number.trim() || !form.license_type.trim()) {
      setEditError("License number and type are required.");
      return;
    }
    const licenseExpiryIso = normalizeIsoDate(form.license_expiry_date);
    if (!licenseExpiryIso) {
      setEditError("License expiry must be in DD/MM/YYYY format.");
      return;
    }

    const updatedAt = new Date().toISOString();
    const baseUser: User = {
      id: user?.id ?? driver.user_id,
      role: user?.role ?? "driver",
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      is_active: user?.is_active ?? true,
      email_verified: user?.email_verified ?? true,
      created_at: user?.created_at ?? updatedAt,
      updated_at: updatedAt,
    };

    const parsedRating = Number(form.rating);
    const parsedDeliveries = Number(form.total_deliveries);

    const updatedDriver: Driver = {
      ...driver,
      license_number: form.license_number.trim(),
      license_type: form.license_type.trim(),
      license_expiry_date: licenseExpiryIso,
      employment_status: form.employment_status,
      rating: Number.isFinite(parsedRating) ? parsedRating : driver.rating,
      total_deliveries: Number.isFinite(parsedDeliveries) ? parsedDeliveries : driver.total_deliveries,
      updated_at: updatedAt,
    };

    onSaveProfile(updatedDriver, baseUser);
    setIsEditOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <p className="text-sm text-slate-500">Drivers &gt; {fullName}</p>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="h-14 w-14 text-slate-500" />
              )}
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  {driver.total_deliveries && driver.total_deliveries > 200 ? "Senior Driver" : "Driver"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-slate-600">
                <div className="inline-flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>ID #{driver.id}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  <span>{user?.email || "No email"}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{user?.phone || "No phone"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              Edit Profile
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                downloadCsv(
                  reportRows as any,
                  [
                    { key: "driver_id", header: "Driver ID" },
                    { key: "driver_name", header: "Driver Name" },
                    { key: "driver_email", header: "Email" },
                    { key: "driver_phone", header: "Phone" },
                    { key: "employment_status", header: "Employment Status" },
                    { key: "license_number", header: "License Number" },
                    { key: "license_type", header: "License Type" },
                    { key: "license_expiry_date", header: "License Expiry" },
                    { key: "rating", header: "Rating" },
                    { key: "total_deliveries", header: "Total Deliveries" },
                    { key: "assignment_id", header: "Assignment ID" },
                    { key: "assignment_type", header: "Assignment Type" },
                    { key: "assignment_status", header: "Assignment Status" },
                    { key: "vehicle_id", header: "Vehicle ID" },
                    { key: "booking_id", header: "Booking ID" },
                    { key: "assigned_at", header: "Assigned At" },
                    { key: "completed_at", header: "Completed At" },
                    { key: "assignment_notes", header: "Assignment Notes" },
                  ] as any,
                  `driver-${driver.id}-report`
                )
              }
            >
              <DownloadIcon className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Overall Safety Score</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-4xl font-semibold text-slate-900">{safetyScore}/100</p>
              <div className="rounded-full border-4 border-orange-400 px-2 py-1 text-xs font-semibold text-orange-700">
                SAFE
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">On-Time Delivery Rate</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">
              {onTimeRate}% <span className="text-lg text-emerald-600">+2.4%</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">Target: 95.0%</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Fuel Efficiency</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">
              {fuelEfficiency} <span className="text-xl">MPG</span> <span className="text-lg text-orange-600">+0.4</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">Fleet average: 2.8 MPG</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.9fr_0.9fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Monthly Performance Trend</h3>
                <div className="text-sm text-slate-500">Safety and consistency</div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                {months.map((month, i) => (
                  <div key={month} className="text-center">
                    <div className="mx-auto flex h-48 w-full max-w-[76px] items-end rounded-xl bg-slate-100 p-2">
                      <div className="w-full rounded-lg bg-orange-300/35 p-1">
                        <div
                          className="mx-auto w-4 rounded-full bg-orange-500"
                          style={{ height: `${trendValues[i]}px` }}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">{month}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Recent Safety Incidents</h3>
              <div className="mt-4 space-y-3">
                {incidentRows.map((incident) => (
                  <div
                    key={incident.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{incident.label}</p>
                      <p className="text-sm text-slate-500">{incident.detail}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${incident.tone}`}>
                      {incident.badge}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Assignment History</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Assignment</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No assignments yet.
                        </td>
                      </tr>
                    )}

                    {sortedAssignments.slice(0, 6).map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 text-slate-800">
                        <td className="px-4 py-3 font-medium">
                          {item.booking_id ? `Booking #${item.booking_id}` : `Task #${item.id}`}
                        </td>
                        <td className="px-4 py-3">{toTitle(item.assignment_type)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusToneClass(item.status)}`}>
                            {toTitle(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.assigned_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Customer Feedback</h3>
              <div className="mt-4 space-y-4">
                {feedbackRows.map((fb, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="text-amber-500">
                        {Array.from({ length: fb.stars }).map((_, i) => (
                          <StarIcon key={i} className="inline h-4 w-4" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{fb.when}</span>
                    </div>
                    <p className="mt-2 text-sm italic text-slate-700">"{fb.quote}"</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Training Certifications</h3>
              <div className="mt-4 space-y-3">
                {certificationRows.map((cert) => (
                  <div key={cert.name} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mt-0.5 rounded-lg bg-orange-100 p-2 text-orange-700">
                      <ShieldCheckIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{cert.name}</p>
                      <p className="text-sm text-slate-500">Expires: {formatDate(cert.expires)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Active assignments: <span className="font-semibold text-slate-800">{activeCount}</span> - Completed:{" "}
                <span className="font-semibold text-slate-800">{completedCount}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Uploaded Documents</h3>
              <div className="mt-4 space-y-2">
                {uploadedDocuments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No uploaded driver documents yet.
                  </div>
                ) : (
                  uploadedDocuments.map((doc) => (
                    <a
                      key={doc.key}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <span className="truncate">{doc.label}</span>
                      <span className="text-xs font-semibold text-orange-700">Open</span>
                    </a>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ModalShell
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Driver Profile"
        description="Update profile, compliance, and assignment readiness."
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-rose-600">{editError}</span>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={saveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <Label>License Number</Label>
            <Input value={form.license_number} onChange={(e) => setForm((p) => ({ ...p, license_number: e.target.value }))} />
          </div>
          <div>
            <Label>License Type</Label>
            <Input value={form.license_type} onChange={(e) => setForm((p) => ({ ...p, license_type: e.target.value }))} />
          </div>
          <div>
            <Label>License Expiry</Label>
            <Input
              placeholder="DD/MM/YYYY"
              value={form.license_expiry_date}
              onChange={(e) => setForm((p) => ({ ...p, license_expiry_date: e.target.value }))}
              onBlur={(e) => setForm((p) => ({ ...p, license_expiry_date: toDisplayDate(e.target.value) }))}
            />
          </div>
          <div>
            <Label>Employment Status</Label>
            <Select
              value={form.employment_status}
              onChange={(e) => setForm((p) => ({ ...p, employment_status: e.target.value as EmploymentStatus }))}
            >
              {Object.values(EmploymentStatus).map((s) => (
                <option key={s} value={s}>
                  {toTitle(String(s))}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Rating</Label>
            <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} />
          </div>
          <div>
            <Label>Total Deliveries</Label>
            <Input type="number" min="0" value={form.total_deliveries} onChange={(e) => setForm((p) => ({ ...p, total_deliveries: e.target.value }))} />
          </div>
        </div>
      </ModalShell>
    </div>
  );
};

export default DriverDetails;
