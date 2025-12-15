
import React, { useMemo, useState } from "react";
import { Driver, EmploymentStatus, User } from "../types";
import { Button, Input, ModalShell, Select, SubtleCard, Textarea } from "./UiKit_new";

type NewDriver = Omit<Driver, "id" | "created_at" | "updated_at" | "user_id"> & {
    user: Omit<User, "id" | "created_at" | "updated_at" | "role" | "email_verified">;
};

interface AddDriverModalProps {
    onClose: () => void;
    onAddDriver: (driverData: NewDriver) => void;
}

const toTitle = (s: string) =>
    s
        .replaceAll("_", " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());

const AddDriverModal: React.FC<AddDriverModalProps> = ({ onClose, onAddDriver }) => {
    const [error, setError] = useState<string>("");

    const [form, setForm] = useState({
        first_name: "Blessing",
        last_name: "Chikwama",
        email: "blessing.c@heartfledge.local",
        phone: "+263 77 111 2222",

        license_number: "77889900-B",
        license_type: "Class 2 (HGV)",
        license_expiry_date: "2026-11-30",
        date_of_birth: "1988-04-12",
        hire_date: "2024-01-15",
        employment_status: EmploymentStatus.ACTIVE,

        national_id: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        address: "",
        city: "",
        country: "",
        notes: "",
    });

    const statusOptions = useMemo(() => Object.values(EmploymentStatus), []);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.first_name.trim()) return setError("First name is required.");
        if (!form.last_name.trim()) return setError("Last name is required.");
        if (!form.email.trim()) return setError("Email is required.");
        if (!form.license_number.trim()) return setError("License number is required.");
        if (!form.license_expiry_date.trim()) return setError("License expiry date is required.");
        if (!form.hire_date.trim()) return setError("Hire date is required.");

        const payload: NewDriver = {
            user: {
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone: form.phone.trim() || undefined,
                avatar_url: undefined,
                is_active: true,
            },

            license_number: form.license_number.trim(),
            license_type: form.license_type.trim(),
            license_expiry_date: form.license_expiry_date,
            date_of_birth: form.date_of_birth,
            hire_date: form.hire_date,
            employment_status: form.employment_status,

            national_id: form.national_id.trim() || undefined,
            emergency_contact_name: form.emergency_contact_name.trim() || undefined,
            emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            country: form.country.trim() || undefined,
            notes: form.notes.trim() || undefined,

            medical_certificate_expiry: undefined,
            background_check_date: undefined,
            background_check_status: undefined,
            rating: undefined,
            total_deliveries: undefined,
        };

        onAddDriver(payload);
        onClose();
    };

    return (
        <ModalShell
            isOpen={true}
            title="Add driver"
            description="Create a driver profile (and the linked user account)."
            onClose={onClose}
            maxWidthClass="max-w-3xl"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="add-driver-form">
                        Save driver
                    </Button>
                </div>
            }
        >
            <form id="add-driver-form" onSubmit={submit} className="space-y-4">
                {error ? (
                    <div className="rounded-xl border border-danger-600/30 bg-danger-600/10 px-3 py-2 text-sm text-foreground">
                        {error}
                    </div>
                ) : null}

                <SubtleCard className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">First name</label>
                            <Input value={form.first_name} onChange={set("first_name")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Last name</label>
                            <Input value={form.last_name} onChange={set("last_name")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
                            <Input value={form.phone} onChange={set("phone")} placeholder="Optional" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                            <Input value={form.email} onChange={set("email")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Employment status</label>
                            <Select value={form.employment_status} onChange={set("employment_status")}>
                                {statusOptions.map((v) => (
                                    <option key={v} value={v}>
                                        {toTitle(String(v))}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </SubtleCard>

                <SubtleCard className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">License number</label>
                            <Input value={form.license_number} onChange={set("license_number")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">License type</label>
                            <Input value={form.license_type} onChange={set("license_type")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">License expiry</label>
                            <Input type="date" value={form.license_expiry_date} onChange={set("license_expiry_date")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Date of birth</label>
                            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hire date</label>
                            <Input type="date" value={form.hire_date} onChange={set("hire_date")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">National ID</label>
                            <Input value={form.national_id} onChange={set("national_id")} placeholder="Optional" />
                        </div>
                    </div>
                </SubtleCard>

                <SubtleCard className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Emergency contact name</label>
                            <Input value={form.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="Optional" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Emergency contact phone</label>
                            <Input value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} placeholder="Optional" />
                        </div>

                        <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
                            <Input value={form.address} onChange={set("address")} placeholder="Optional" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
                            <Input value={form.city} onChange={set("city")} placeholder="Optional" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Country</label>
                            <Input value={form.country} onChange={set("country")} placeholder="Optional" />
                        </div>

                        <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                            <Textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Optional" />
                        </div>
                    </div>
                </SubtleCard>
            </form>
        </ModalShell>
    );
};

export default AddDriverModal;
