
import React, { useMemo, useState } from "react";
import { Customer, Currency, Industry, LoyaltyTier } from "../types";
import { Button, Input, ModalShell, Select, SubtleCard, Textarea } from "./UiKit";
import { toTitle } from "../utils/toTitle";

type NewCustomer = Omit<
    Customer,
    "id" | "created_at" | "updated_at" | "user_id" | "total_spent" | "total_bookings" | "loyalty_points" | "is_verified"
>;

interface AddCustomerModalProps {
    onClose: () => void;
    onAddCustomer: (customer: NewCustomer) => void;
}

/**
 * Modal for adding a new customer record with billing details.
 */
const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, onAddCustomer }) => {
    const [error, setError] = useState<string>("");

    const [form, setForm] = useState({
        company_name: "ZimBuild Construction",
        company_registration: "",
        industry: Industry.OTHER,
        address_line1: "101 Samora Machel Ave",
        address_line2: "",
        city: "Harare",
        country: "Zimbabwe",
        postal_code: "",
        billing_email: "accounts@zimbuild.co.zw",
        billing_phone: "+263 242 778899",
        tax_id: "100-223344-Z",
        loyalty_tier: LoyaltyTier.SILVER,
        preferred_currency: Currency.USD,
        credit_limit: "",
        payment_terms: "30",
        notes: "Major contractor for government projects. Requires POD for all deliveries.",
    });

    const industryOptions = useMemo(() => Object.values(Industry), []);
    const tierOptions = useMemo(() => Object.values(LoyaltyTier), []);
    const currencyOptions = useMemo(() => Object.values(Currency), []);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.company_name.trim()) return setError("Company name is required.");
        if (!form.address_line1.trim()) return setError("Address line 1 is required.");
        if (!form.city.trim()) return setError("City is required.");
        if (!form.country.trim()) return setError("Country is required.");
        if (!form.billing_email.trim()) return setError("Billing email is required.");

        const payload: NewCustomer = {
            company_name: form.company_name.trim(),
            company_registration: form.company_registration.trim() || undefined,
            industry: String(form.industry),
            address_line1: form.address_line1.trim(),
            address_line2: form.address_line2.trim() || undefined,
            city: form.city.trim(),
            country: form.country.trim(),
            postal_code: form.postal_code.trim() || undefined,
            billing_email: form.billing_email.trim(),
            billing_phone: form.billing_phone.trim() || undefined,
            tax_id: form.tax_id.trim() || undefined,
            loyalty_tier: form.loyalty_tier,
            preferred_currency: form.preferred_currency,
            credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined,
            payment_terms: form.payment_terms ? Number(form.payment_terms) : undefined,
            notes: form.notes.trim() || undefined,
        };

        onAddCustomer(payload);
        onClose();
    };

    return (
        <ModalShell
            isOpen={true}
            title="Add customer"
            description="Create a customer account with billing + preferences."
            onClose={onClose}
            maxWidthClass="max-w-3xl"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="add-customer-form">
                        Save customer
                    </Button>
                </div>
            }
        >
            <form id="add-customer-form" onSubmit={submit} className="space-y-4">
                {error ? (
                    <div className="rounded-lg border border-danger-600/30 bg-danger-600/10 px-3 py-2 text-sm text-foreground">
                        {error}
                    </div>
                ) : null}

                <SubtleCard className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Company name</label>
                            <Input value={form.company_name} onChange={set("company_name")} placeholder="Company name" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Industry</label>
                            <Select value={form.industry} onChange={set("industry")}>
                                {industryOptions.map((v) => (
                                    <option key={v} value={v}>
                                        {toTitle(String(v))}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address line 1</label>
                            <Input value={form.address_line1} onChange={set("address_line1")} placeholder="Street address" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address line 2</label>
                            <Input value={form.address_line2} onChange={set("address_line2")} placeholder="Suite, building, etc" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
                            <Input value={form.city} onChange={set("city")} placeholder="City" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Country</label>
                            <Input value={form.country} onChange={set("country")} placeholder="Country" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Postal code</label>
                            <Input value={form.postal_code} onChange={set("postal_code")} placeholder="Postal code" />
                        </div>
                    </div>
                </SubtleCard>

                <SubtleCard className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Billing email</label>
                            <Input value={form.billing_email} onChange={set("billing_email")} placeholder="accounts@company.com" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Billing phone</label>
                            <Input value={form.billing_phone} onChange={set("billing_phone")} placeholder="+27 ..." />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax ID</label>
                            <Input value={form.tax_id} onChange={set("tax_id")} placeholder="VAT / Tax number" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Preferred currency</label>
                            <Select value={form.preferred_currency} onChange={set("preferred_currency")}>
                                {currencyOptions.map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment terms (days)</label>
                            <Input type="number" min={0} value={form.payment_terms} onChange={set("payment_terms")} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Credit limit</label>
                            <Input type="number" min={0} value={form.credit_limit} onChange={set("credit_limit")} placeholder="Optional" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Loyalty tier</label>
                            <Select value={form.loyalty_tier} onChange={set("loyalty_tier")}>
                                {tierOptions.map((v) => (
                                    <option key={v} value={v}>
                                        {toTitle(String(v))}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                            <Textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Internal notes..." />
                        </div>
                    </div>
                </SubtleCard>
            </form>
        </ModalShell>
    );
};

export default AddCustomerModal;
