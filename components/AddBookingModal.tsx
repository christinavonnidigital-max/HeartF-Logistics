import React, { useEffect, useMemo, useState } from "react";
import { Booking, BookingStatus, CargoType, Currency, PaymentStatus } from "../types";
import { mockCustomers } from "../data/mockCrmData";
import {
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from "./icons";
import { ModalShell, Button, Input, Select, SectionHeader, Label } from "./UiKit";
import { useAuth } from "../auth/AuthContext";

type BookingFormState = {
  customer_id: string;
  pickup_city: string;
  pickup_address: string;
  pickup_date: string;
  delivery_city: string;
  delivery_address: string;
  delivery_date: string;
  cargo_type: CargoType;
  cargo_description: string;
  weight_tonnes: string;
  base_price: string;
  currency: Currency;
};

interface AddBookingModalProps {
  onClose: () => void;
  onAddBooking: (booking: Omit<Booking, "id" | "created_at" | "updated_at">) => void;
  initialData?: Partial<BookingFormState>;
}

const toTitle = (s: string) =>
  String(s)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const ErrorText = ({ msg }: { msg?: string }) => {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
};

const AddBookingModal: React.FC<AddBookingModalProps> = ({ onClose, onAddBooking, initialData }) => {
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";

  const [formData, setFormData] = useState<BookingFormState>({
    customer_id: "101",
    pickup_city: "Harare",
    pickup_address: "Willowvale Ind. Estate, Bay 4",
    pickup_date: new Date().toISOString().split("T")[0],
    delivery_city: "Bulawayo",
    delivery_address: "Belmont Depot, Unit 12",
    delivery_date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split("T")[0],
    cargo_type: CargoType.GENERAL,
    cargo_description: "Consumer Electronics",
    weight_tonnes: "15",
    base_price: "1200",
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        pickup_date: initialData.pickup_date || prev.pickup_date,
        delivery_date: initialData.delivery_date || prev.delivery_date,
        currency: initialData.currency || prev.currency,
        cargo_type: initialData.cargo_type || prev.cargo_type,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (user?.role === "customer") {
      setFormData((prev) => ({ ...prev, customer_id: String(user.userId) }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBanner("");
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const required = useMemo(
    () => ["customer_id", "pickup_city", "delivery_city", "base_price"] as const,
    []
  );

  const validate = () => {
    const next: Record<string, string> = {};
    for (const k of required) {
      if (!String(formData[k] ?? "").trim()) next[k] = "Required";
    }
    if (formData.base_price && Number.isNaN(Number(formData.base_price))) {
      next.base_price = "Must be a number";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBanner("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setBanner("Please fix the highlighted fields.");
      return;
    }

    const customerId = parseInt(formData.customer_id, 10);
    const customer = mockCustomers.find((c) => c.id === customerId);
    const basePrice = parseFloat(formData.base_price);

    const newBooking: Omit<Booking, "id" | "created_at" | "updated_at"> = {
      booking_number: `BKN-${Date.now().toString().slice(-6)}`,
      customer_id: customerId,

      pickup_location: formData.pickup_city,
      pickup_address: formData.pickup_address,
      pickup_city: formData.pickup_city,
      pickup_country: customer?.country || "Zimbabwe",
      pickup_date: formData.pickup_date,

      delivery_location: formData.delivery_city,
      delivery_address: formData.delivery_address,
      delivery_city: formData.delivery_city,
      delivery_country: "Zimbabwe",
      delivery_date: formData.delivery_date,

      cargo_type: formData.cargo_type,
      cargo_description: formData.cargo_description,
      weight_tonnes: parseFloat(formData.weight_tonnes) || 0,
      requires_refrigeration: formData.cargo_type === CargoType.PERISHABLE,

      status: BookingStatus.PENDING,
      base_price: Number.isFinite(basePrice) ? basePrice : 0,
      total_price: Number.isFinite(basePrice) ? basePrice : 0,
      currency: formData.currency,
      payment_status: PaymentStatus.UNPAID,
    };

    onAddBooking(newBooking);
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={isCustomer ? "Request a booking" : "Create booking"}
      description="Capture the route, cargo, and pricing. Required fields are marked with *."
      icon={<TruckIcon className="w-5 h-5" />}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-foreground/60">
            {banner ? (
              <span className="text-rose-400">{banner}</span>
            ) : (
              <span>Tip: You can edit assignment and status after creation.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose} className="transition active:scale-[0.97]">
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="add-booking-form" className="transition active:scale-[0.97]">
              {isCustomer ? "Submit request" : "Create booking"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="animate-in fade-in zoom-in-95 duration-200">
        <form id="add-booking-form" onSubmit={handleSubmit} className="space-y-6">
          <main className="p-6 space-y-8">
            <SectionHeader title="Customer" actions={<UserCircleIcon className="h-5 w-5 text-foreground-muted" />} />
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircleIcon className="h-5 w-5 text-foreground-muted" />
                </div>
                <Select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  disabled={isCustomer}
                  className={`block w-full rounded-lg border bg-card pl-10 py-2.5 text-sm font-medium shadow-sm transition ${
                    errors.customer_id ? "border-red-400" : "border-border"
                  } ${isCustomer ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Customer*</option>
                  {mockCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </Select>
              </div>
              <ErrorText msg={errors.customer_id} />
            </div>

            <SectionHeader title="Route & Schedule" actions={<MapPinIcon className="h-4 w-4 text-foreground-muted" />} />
            <div className="space-y-4">
              <div className="relative pl-4">
                <div className="absolute left-5.5 top-8 bottom-8 w-0.5 bg-muted border-l-2 border-dashed border-border" />

                <div className="relative flex gap-4 mb-6">
                  <div className="shrink-0 z-10 mt-3">
                    <div className="w-4 h-4 rounded-full bg-card border-[3px] border-warn-600 shadow-sm" />
                  </div>
                  <div className="grow space-y-3 p-4 bg-card rounded-xl border border-border">
                    <h4 className="text-xs font-semibold text-orange-600 uppercase">Pickup</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-4 w-4 text-foreground-muted" />
                        </div>
                        <Input
                          type="text"
                          name="pickup_city"
                          placeholder="City*"
                          value={formData.pickup_city}
                          onChange={handleChange}
                          className={`pl-9 ${errors.pickup_city ? "border-red-400" : ""}`}
                        />
                        <ErrorText msg={errors.pickup_city} />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDaysIcon className="h-4 w-4 text-foreground-muted" />
                        </div>
                        <Input type="date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} className="pl-9" />
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Address</Label>
                        <Input
                          type="text"
                          name="pickup_address"
                          placeholder="Specific Address / Warehouse"
                          value={formData.pickup_address}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative flex gap-4">
                  <div className="shrink-0 z-10 mt-3">
                    <div className="w-4 h-4 rounded-full bg-muted shadow-sm" />
                  </div>
                  <div className="grow space-y-3 p-4 bg-card rounded-xl border border-border">
                    <h4 className="text-xs font-semibold text-foreground uppercase">Delivery</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-4 w-4 text-foreground-muted" />
                        </div>
                        <Input
                          type="text"
                          name="delivery_city"
                          placeholder="City*"
                          value={formData.delivery_city}
                          onChange={handleChange}
                          className={`pl-9 ${errors.delivery_city ? "border-red-400" : ""}`}
                        />
                        <ErrorText msg={errors.delivery_city} />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDaysIcon className="h-4 w-4 text-foreground-muted" />
                        </div>
                        <Input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="pl-9" />
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Address</Label>
                        <Input
                          type="text"
                          name="delivery_address"
                          placeholder="Specific Address / Warehouse"
                          value={formData.delivery_address}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <SectionHeader title="Cargo Details" />
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TruckIcon className="h-4 w-4 text-foreground-muted" />
                    </div>
                    <Select name="cargo_type" value={formData.cargo_type} onChange={handleChange} className="pl-9">
                      {Object.values(CargoType).map((t) => (
                        <option key={t} value={t}>
                          {toTitle(String(t))}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Input
                    type="text"
                    name="cargo_description"
                    placeholder="Description (e.g. 20 Pallets)"
                    value={formData.cargo_description}
                    onChange={handleChange}
                  />

                  <div className="relative">
                    <Input
                      type="number"
                      name="weight_tonnes"
                      placeholder="Weight"
                      value={formData.weight_tonnes}
                      onChange={handleChange}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-foreground-muted sm:text-sm">tonnes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <SectionHeader title="Financials" />
                <div className="bg-warn-50 rounded-lg p-4 border border-warn-100 space-y-3">
                  <div>
                    <Label>{isCustomer ? "Offer Price / Value" : "Agreed Rate"}*</Label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-foreground-muted" />
                      </div>
                      <Input
                        type="number"
                        name="base_price"
                        placeholder="0.00"
                        value={formData.base_price}
                        onChange={handleChange}
                        className={`pl-10 ${errors.base_price ? "border-red-400" : ""}`}
                      />
                    </div>
                    <ErrorText msg={errors.base_price} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1">Currency</label>
                    <Select name="currency" value={formData.currency} onChange={handleChange}>
                      {Object.values(Currency).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </form>
      </div>
    </ModalShell>
  );
};

export default AddBookingModal;
