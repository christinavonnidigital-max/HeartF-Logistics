import React, { useEffect, useMemo, useState } from "react";
import { BackgroundCheckStatus, Driver, EmploymentStatus, User } from "../types";
import { CheckCircleIcon, UploadIcon } from "./icons";
import { Button, Input, Label, ModalShell, Select, SubtleCard, Textarea } from "./UiKit";
import { toTitle } from "../utils/toTitle";

type NewDriver = Omit<Driver, "id" | "created_at" | "updated_at" | "user_id"> & {
  user: Omit<User, "id" | "created_at" | "updated_at" | "role" | "email_verified">;
};

interface AddDriverModalProps {
  onClose: () => void;
  onAddDriver: (driverData: NewDriver) => void | Promise<void>;
}

type Step = 1 | 2 | 3 | 4;

type DriverOnboardingForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  employee_id: string;
  national_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  city: string;
  country: string;
  profile_photo_name: string;
  profile_photo_url: string;

  license_number: string;
  license_type: string;
  license_expiry_date: string;
  medical_certificate_expiry: string;
  license_scan_name: string;
  license_scan_url: string;
  medical_scan_name: string;
  medical_scan_url: string;
  background_check_initiated: boolean;
  drug_test_cleared: boolean;

  hire_date: string;
  employment_status: EmploymentStatus;
  years_experience: string;
  previous_employer: string;
  reason_for_leaving: string;
  skills: string[];
  incident_free: boolean;
  incident_notes: string;

  notes: string;
};

const DRAFT_KEY = "hf:add-driver-onboarding-draft";
const DRIVER_META_START = "[HF_DRIVER_META]";
const DRIVER_META_END = "[/HF_DRIVER_META]";

const today = () => new Date().toISOString().slice(0, 10);
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

const INITIAL_FORM: DriverOnboardingForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  employee_id: "",
  national_id: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  address: "",
  city: "",
  country: "Zimbabwe",
  profile_photo_name: "",
  profile_photo_url: "",

  license_number: "",
  license_type: "",
  license_expiry_date: "",
  medical_certificate_expiry: "",
  license_scan_name: "",
  license_scan_url: "",
  medical_scan_name: "",
  medical_scan_url: "",
  background_check_initiated: false,
  drug_test_cleared: false,

  hire_date: toDisplayDate(today()),
  employment_status: EmploymentStatus.ACTIVE,
  years_experience: "",
  previous_employer: "",
  reason_for_leaving: "",
  skills: [],
  incident_free: true,
  incident_notes: "",

  notes: "",
};

const STEPS: Array<{ id: Step; label: string; subtitle: string }> = [
  { id: 1, label: "Personal Info", subtitle: "General profile and contact" },
  { id: 2, label: "License & Docs", subtitle: "License, documents, compliance" },
  { id: 3, label: "Experience", subtitle: "Skills, work history, incidents" },
  { id: 4, label: "Final Review", subtitle: "Verify and finalize onboarding" },
];

const SKILLS = [
  "Hazmat Certified",
  "Refrigerated Logistics",
  "Heavy Haul",
  "Long-haul",
  "Tanker",
  "Flatbed",
  "LTL",
  "Livestock",
  "Oversize",
];

const LICENSE_CLASSES = [
  "Class 4 (Light Motor Vehicle)",
  "Class 2 (Heavy Motor Vehicle)",
  "Class 1 (Articulated / Public Service)",
  "Class 3 (Motorcycle)",
  "Class 5 (Tractor / Construction Equipment)",
  "PDP - Goods (Code G)",
  "PDP - Passenger (Code P)",
  "PDP - Dangerous Goods (Code D)",
];

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const [, payload] = result.split(",", 2);
      resolve(payload || "");
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

const uploadDriverAsset = async (file: File, category = "drivers"): Promise<{ url: string }> => {
  const base64Data = await toBase64(file);
  const response = await fetch("/api/files/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      base64Data,
      category,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error || `Upload failed (${response.status})`);
  }

  const payload = await response.json();
  const url = payload?.file?.url;
  if (!url) throw new Error("Upload response missing URL.");
  return { url: String(url) };
};

const AddDriverModal: React.FC<AddDriverModalProps> = ({ onClose, onAddDriver }) => {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [form, setForm] = useState<DriverOnboardingForm>(INITIAL_FORM);

  const statusOptions = useMemo(() => Object.values(EmploymentStatus), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { step?: Step; form?: DriverOnboardingForm; savedAt?: string };
      if (parsed?.form) {
        const merged = { ...INITIAL_FORM, ...parsed.form };
        merged.date_of_birth = toDisplayDate(merged.date_of_birth);
        merged.license_expiry_date = toDisplayDate(merged.license_expiry_date);
        merged.medical_certificate_expiry = toDisplayDate(merged.medical_certificate_expiry);
        merged.hire_date = toDisplayDate(merged.hire_date);
        setForm(merged);
      }
      if (parsed?.step && [1, 2, 3, 4].includes(parsed.step)) {
        setStep(parsed.step);
      }
      if (parsed?.savedAt) {
        setSavedAt(parsed.savedAt);
      }
    } catch {
      // Ignore malformed draft data.
    }
  }, []);

  const setField = <K extends keyof DriverOnboardingForm>(key: K, value: DriverOnboardingForm[K]) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    setField(
      "skills",
      form.skills.includes(skill) ? form.skills.filter((item) => item !== skill) : [...form.skills, skill]
    );
  };

  const pickAndUploadFile = (
    nameKey: "profile_photo_name" | "license_scan_name" | "medical_scan_name",
    urlKey: "profile_photo_url" | "license_scan_url" | "medical_scan_url"
  ) => {
    return async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setField(nameKey, file.name);
      setUploadingField(nameKey);
      try {
        const uploaded = await uploadDriverAsset(file, "drivers");
        setField(urlKey, uploaded.url);
      } catch {
        setField(urlKey, "");
        setError(`${file.name} was selected, but upload failed. It will be saved as filename only.`);
      } finally {
        setUploadingField(null);
        event.target.value = "";
      }
    };
  };

  const validate = (target: Step = step) => {
    if (target === 1) {
      if (!form.first_name.trim()) return "First name is required.";
      if (!form.last_name.trim()) return "Last name is required.";
      if (!form.email.trim()) return "Email address is required.";
      if (!form.phone.trim()) return "Mobile number is required.";
      if (!form.date_of_birth.trim()) return "Date of birth is required.";
      if (!normalizeIsoDate(form.date_of_birth)) return "Date of birth must be in DD/MM/YYYY format.";
      return "";
    }

    if (target === 2) {
      if (!form.license_number.trim()) return "License number is required.";
      if (!form.license_type.trim()) return "License class is required.";
      if (!form.license_expiry_date.trim()) return "License expiry date is required.";
      if (!normalizeIsoDate(form.license_expiry_date)) return "License expiry date must be in DD/MM/YYYY format.";
      if (form.medical_certificate_expiry.trim() && !normalizeIsoDate(form.medical_certificate_expiry)) {
        return "Medical certificate expiry must be in DD/MM/YYYY format.";
      }
      return "";
    }

    if (target === 3) {
      if (!form.hire_date.trim()) return "Hire date is required.";
      if (!normalizeIsoDate(form.hire_date)) return "Hire date must be in DD/MM/YYYY format.";
      if (!form.incident_free && !form.incident_notes.trim()) {
        return "Add incident notes or mark the driver as incident free.";
      }
      return "";
    }

    return "";
  };

  const nextStep = () => {
    const validationError = validate(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((prev) => Math.min(4, prev + 1) as Step);
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const saveDraft = () => {
    const payload = {
      step,
      form,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
  };

  const clearDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setSavedAt(null);
  };

  const submit = async () => {
    const validationError =
      validate(1) || validate(2) || validate(3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    const dobIso = normalizeIsoDate(form.date_of_birth);
    const licenseExpiryIso = normalizeIsoDate(form.license_expiry_date);
    const medicalExpiryIso = form.medical_certificate_expiry.trim()
      ? normalizeIsoDate(form.medical_certificate_expiry)
      : null;
    const hireDateIso = normalizeIsoDate(form.hire_date);
    if (!dobIso || !licenseExpiryIso || !hireDateIso || (form.medical_certificate_expiry.trim() && !medicalExpiryIso)) {
      setError("Please use DD/MM/YYYY for all date fields.");
      setIsSubmitting(false);
      return;
    }

    const backgroundStatus = !form.incident_free && form.incident_notes.trim()
      ? BackgroundCheckStatus.FLAGGED
      : form.background_check_initiated && form.drug_test_cleared
      ? BackgroundCheckStatus.CLEARED
      : BackgroundCheckStatus.PENDING;

    const contextNotes = [
      form.employee_id.trim() ? `Employee ID: ${form.employee_id.trim()}` : "",
      form.previous_employer.trim() ? `Previous employer: ${form.previous_employer.trim()}` : "",
      form.years_experience.trim() ? `Years experience: ${form.years_experience.trim()}` : "",
      form.reason_for_leaving.trim() ? `Reason for leaving: ${form.reason_for_leaving.trim()}` : "",
      form.skills.length ? `Skills: ${form.skills.join(", ")}` : "",
      `Incident free (last 5 years): ${form.incident_free ? "Yes" : "No"}`,
      form.incident_notes.trim() ? `Incident notes: ${form.incident_notes.trim()}` : "",
      form.license_scan_name.trim()
        ? `License scan: ${form.license_scan_name.trim()}${form.license_scan_url ? ` (${form.license_scan_url})` : ""}`
        : "",
      form.medical_scan_name.trim()
        ? `Medical certificate: ${form.medical_scan_name.trim()}${form.medical_scan_url ? ` (${form.medical_scan_url})` : ""}`
        : "",
      form.profile_photo_name.trim()
        ? `Profile photo: ${form.profile_photo_name.trim()}${form.profile_photo_url ? ` (${form.profile_photo_url})` : ""}`
        : "",
      form.notes.trim() ? form.notes.trim() : "",
    ]
      .filter(Boolean)
      .join("\n");

    const metaPayload = {
      profile_photo_url: form.profile_photo_url || "",
      documents: {
        license_scan: form.license_scan_url
          ? { name: form.license_scan_name || "License scan", url: form.license_scan_url }
          : null,
        medical_scan: form.medical_scan_url
          ? { name: form.medical_scan_name || "Medical certificate", url: form.medical_scan_url }
          : null,
      },
    };
    const hasMeta =
      Boolean(metaPayload.profile_photo_url) ||
      Boolean(metaPayload.documents.license_scan) ||
      Boolean(metaPayload.documents.medical_scan);
    const metaBlock = hasMeta ? `${DRIVER_META_START}${JSON.stringify(metaPayload)}${DRIVER_META_END}` : "";
    const finalNotes = [metaBlock, contextNotes].filter(Boolean).join("\n");

    const payload: NewDriver = {
      user: {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || undefined,
        avatar_url: form.profile_photo_url || undefined,
        is_active: true,
      },
      license_number: form.license_number.trim(),
      license_type: form.license_type.trim(),
      license_expiry_date: licenseExpiryIso,
      date_of_birth: dobIso,
      hire_date: hireDateIso,
      employment_status: form.employment_status,
      national_id: form.national_id.trim() || undefined,
      emergency_contact_name: form.emergency_contact_name.trim() || undefined,
      emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
      notes: finalNotes || undefined,
      medical_certificate_expiry: medicalExpiryIso || undefined,
      background_check_date: form.background_check_initiated ? today() : undefined,
      background_check_status: backgroundStatus,
      rating: undefined,
      total_deliveries: undefined,
    };

    try {
      await onAddDriver(payload);
      clearDraft();
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to save driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="text-xs text-slate-500">
        {savedAt
          ? `Draft saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Long form? Save draft anytime."}
      </div>

      <div className="flex items-center gap-2">
        {step > 1 ? (
          <Button variant="secondary" type="button" onClick={prevStep}>
            Back
          </Button>
        ) : null}
        <Button variant="ghost" type="button" onClick={saveDraft}>
          Save Draft
        </Button>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        {step < 4 ? (
          <Button variant="primary" type="button" onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button variant="primary" type="button" onClick={submit} disabled={isSubmitting || !!uploadingField}>
            {isSubmitting ? "Finalizing..." : uploadingField ? "Uploading files..." : "Finalize Onboarding"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <ModalShell
      isOpen={true}
      title="Add New Driver"
      description={`Step ${step} of 4: ${STEPS.find((item) => item.id === step)?.subtitle}`}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      footer={footer}
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <SubtleCard className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {STEPS.map((item) => {
              const isDone = item.id < step;
              const isCurrent = item.id === step;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    isCurrent
                      ? "border-orange-300 bg-orange-50"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                        isCurrent
                          ? "bg-orange-500 text-white"
                          : isDone
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isDone ? <CheckCircleIcon className="h-3.5 w-3.5" /> : item.id}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </SubtleCard>

        {step === 1 ? (
          <SubtleCard className="space-y-4 p-4">
            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-orange-600">
                  <UploadIcon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">Upload Photo</p>
                <p className="text-xs text-slate-500">JPG/PNG up to 5MB</p>
                <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Select file
                  <input className="hidden" type="file" accept="image/*" onChange={pickAndUploadFile("profile_photo_name", "profile_photo_url")} />
                </label>
                {form.profile_photo_name ? (
                  <p className="mt-2 truncate text-xs text-slate-600">{form.profile_photo_name}</p>
                ) : null}
                {uploadingField === "profile_photo_name" ? <p className="mt-1 text-xs text-slate-500">Uploading...</p> : null}
                {form.profile_photo_url ? <p className="mt-1 text-xs text-emerald-600">Uploaded</p> : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>First name *</Label>
                  <Input value={form.first_name} onChange={(e) => setField("first_name", e.target.value)} />
                </div>
                <div>
                  <Label>Last name *</Label>
                  <Input value={form.last_name} onChange={(e) => setField("last_name", e.target.value)} />
                </div>
                <div>
                  <Label>Email address *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </div>
                <div>
                  <Label>Mobile number *</Label>
                  <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Date of birth *</Label>
                  <Input
                    placeholder="DD/MM/YYYY"
                    value={form.date_of_birth}
                    onChange={(e) => setField("date_of_birth", e.target.value)}
                    onBlur={(e) => {
                      const display = toDisplayDate(e.target.value);
                      if (display) setField("date_of_birth", display);
                    }}
                  />
                </div>
                <div>
                  <Label>Employee ID</Label>
                  <Input placeholder="HF-DR-0001" value={form.employee_id} onChange={(e) => setField("employee_id", e.target.value)} />
                </div>
                <div>
                  <Label>Emergency contact</Label>
                  <Input value={form.emergency_contact_name} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
                </div>
                <div>
                  <Label>Emergency phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => setField("country", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>National ID</Label>
                  <Input value={form.national_id} onChange={(e) => setField("national_id", e.target.value)} />
                </div>
              </div>
            </div>
          </SubtleCard>
        ) : null}

        {step === 2 ? (
          <SubtleCard className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>License number *</Label>
                <Input value={form.license_number} onChange={(e) => setField("license_number", e.target.value)} />
              </div>
              <div>
                <Label>License class *</Label>
                <Select value={form.license_type} onChange={(e) => setField("license_type", e.target.value)}>
                  <option value="">Select class</option>
                  {LICENSE_CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Expiry date *</Label>
                <Input
                  placeholder="DD/MM/YYYY"
                  value={form.license_expiry_date}
                  onChange={(e) => setField("license_expiry_date", e.target.value)}
                  onBlur={(e) => {
                    const display = toDisplayDate(e.target.value);
                    if (display) setField("license_expiry_date", display);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                <Label>Driver's license scan</Label>
                <label className="mt-1 inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <UploadIcon className="h-3.5 w-3.5" /> Upload file
                  <input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickAndUploadFile("license_scan_name", "license_scan_url")} />
                </label>
                <p className="mt-2 truncate text-xs text-slate-500">{form.license_scan_name || "No file selected"}</p>
                {uploadingField === "license_scan_name" ? <p className="mt-1 text-xs text-slate-500">Uploading...</p> : null}
                {form.license_scan_url ? <p className="mt-1 text-xs text-emerald-600">Uploaded</p> : null}
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                <Label>Medical certificate</Label>
                <label className="mt-1 inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <UploadIcon className="h-3.5 w-3.5" /> Upload file
                  <input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickAndUploadFile("medical_scan_name", "medical_scan_url")} />
                </label>
                <p className="mt-2 truncate text-xs text-slate-500">{form.medical_scan_name || "No file selected"}</p>
                {uploadingField === "medical_scan_name" ? <p className="mt-1 text-xs text-slate-500">Uploading...</p> : null}
                {form.medical_scan_url ? <p className="mt-1 text-xs text-emerald-600">Uploaded</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Medical certificate expiry</Label>
                <Input
                  placeholder="DD/MM/YYYY"
                  value={form.medical_certificate_expiry}
                  onChange={(e) => setField("medical_certificate_expiry", e.target.value)}
                  onBlur={(e) => {
                    const display = toDisplayDate(e.target.value);
                    if (display) setField("medical_certificate_expiry", display);
                  }}
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700">Background check initiated</p>
                <button
                  type="button"
                  onClick={() => setField("background_check_initiated", !form.background_check_initiated)}
                  className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    form.background_check_initiated ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {form.background_check_initiated ? "Yes" : "No"}
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700">Drug test cleared</p>
                <button
                  type="button"
                  onClick={() => setField("drug_test_cleared", !form.drug_test_cleared)}
                  className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    form.drug_test_cleared ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {form.drug_test_cleared ? "Yes" : "No"}
                </button>
              </div>
            </div>
          </SubtleCard>
        ) : null}

        {step === 3 ? (
          <SubtleCard className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Hire date *</Label>
                <Input
                  placeholder="DD/MM/YYYY"
                  value={form.hire_date}
                  onChange={(e) => setField("hire_date", e.target.value)}
                  onBlur={(e) => {
                    const display = toDisplayDate(e.target.value);
                    if (display) setField("hire_date", display);
                  }}
                />
              </div>
              <div>
                <Label>Employment status</Label>
                <Select
                  value={form.employment_status}
                  onChange={(e) => setField("employment_status", e.target.value as EmploymentStatus)}
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {toTitle(item)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Years of experience</Label>
                <Input type="number" min="0" value={form.years_experience} onChange={(e) => setField("years_experience", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Previous employer</Label>
                <Input value={form.previous_employer} onChange={(e) => setField("previous_employer", e.target.value)} />
              </div>
              <div>
                <Label>Reason for leaving</Label>
                <Input value={form.reason_for_leaving} onChange={(e) => setField("reason_for_leaving", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Skills and certifications</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {SKILLS.map((skill) => {
                  const active = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                        active ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">No incidents in the last 5 years?</p>
                  <p className="text-xs text-slate-500">Accidents, major violations, or suspensions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setField("incident_free", !form.incident_free)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    form.incident_free ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {form.incident_free ? "Yes" : "No"}
                </button>
              </div>
              {!form.incident_free ? (
                <div className="mt-3">
                  <Label>Incident notes *</Label>
                  <Textarea value={form.incident_notes} onChange={(e) => setField("incident_notes", e.target.value)} rows={3} />
                </div>
              ) : null}
            </div>

            <div>
              <Label>Additional notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
            </div>
          </SubtleCard>
        ) : null}

        {step === 4 ? (
          <SubtleCard className="space-y-4 p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-slate-900">Profile Summary</h4>
                <Button variant="ghost" size="sm" type="button" onClick={() => setStep(1)}>
                  Edit
                </Button>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {[form.first_name, form.last_name].filter(Boolean).join(" ") || "Unnamed Driver"}
              </p>
              <p className="text-sm text-slate-600">{form.employee_id || "No employee ID"}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h5 className="font-semibold text-slate-900">Contact Details</h5>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setStep(1)}>
                    Edit
                  </Button>
                </div>
                <p className="text-sm text-slate-700">Email: {form.email || "-"}</p>
                <p className="text-sm text-slate-700">Phone: {form.phone || "-"}</p>
                <p className="text-sm text-slate-700">DOB: {toDisplayDate(form.date_of_birth) || "-"}</p>
                <p className="text-sm text-slate-700">Emergency: {form.emergency_contact_name || "-"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h5 className="font-semibold text-slate-900">Compliance & License</h5>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setStep(2)}>
                    Edit
                  </Button>
                </div>
                <p className="text-sm text-slate-700">License #: {form.license_number || "-"}</p>
                <p className="text-sm text-slate-700">Class: {form.license_type || "-"}</p>
                <p className="text-sm text-slate-700">Expiry: {toDisplayDate(form.license_expiry_date) || "-"}</p>
                <p className="text-sm text-slate-700">Background check: {form.background_check_initiated ? "Initiated" : "Not started"}</p>
                <p className="text-sm text-slate-700">Drug test: {form.drug_test_cleared ? "Cleared" : "Pending"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h5 className="font-semibold text-slate-900">Experience Profile</h5>
                <Button variant="ghost" size="sm" type="button" onClick={() => setStep(3)}>
                  Edit
                </Button>
              </div>
              <p className="text-sm text-slate-700">Hire date: {toDisplayDate(form.hire_date) || "-"}</p>
              <p className="text-sm text-slate-700">Status: {toTitle(form.employment_status)}</p>
              <p className="text-sm text-slate-700">Years of experience: {form.years_experience || "-"}</p>
              <p className="text-sm text-slate-700">Previous employer: {form.previous_employer || "-"}</p>
              <p className="text-sm text-slate-700">Skills: {form.skills.length ? form.skills.join(", ") : "-"}</p>
              <p className="text-sm text-slate-700">Incident free: {form.incident_free ? "Yes" : "No"}</p>
            </div>
          </SubtleCard>
        ) : null}
      </div>
    </ModalShell>
  );
};

export default AddDriverModal;
