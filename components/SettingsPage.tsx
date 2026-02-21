import React, { useEffect, useMemo, useState } from "react";
import { ShellCard, SectionHeader, StatusPill } from "./UiKit";
import { AppSettings, View } from "../App";
import { useAuth, UserRole } from "../auth/AuthContext";
import { useData } from "../contexts/DataContext";

interface SettingsPageProps {
  settings: AppSettings;
  onChangeSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const viewTitles: Record<View, string> = {
  dashboard: "Dashboard",
  fleet: "Fleet",
  bookings: "Bookings",
  drivers: "Drivers",
  customers: "Customers",
  routes: "Routes",
  leads: "Leads",
  campaigns: "Sequences",
  "new-campaign": "New Campaign",
  financials: "Financials",
  reports: "Reports",
  marketing: "Campaigns",
  settings: "Settings",
  analytics: "Analytics",
  "lead-finder": "Lead Finder",
};

const SettingsToggle: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
    <div>
      <span className="text-sm text-slate-800 font-medium">{label}</span>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      aria-label={label || "Toggle setting"}
      role="switch"
      aria-checked={enabled ? "true" : "false"}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
        enabled ? "bg-orange-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onChangeSettings }) => {
  const { user } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useData();
  const isAdmin = user?.role === "admin";

  const [entryEmail, setEntryEmail] = useState("");
  const [entryRole, setEntryRole] = useState<UserRole>("pending");
  const [entryFirst, setEntryFirst] = useState("");
  const [entryLast, setEntryLast] = useState("");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [pendingRoleSelection, setPendingRoleSelection] = useState<Record<string, UserRole>>({});

  const roleOptions: { id: UserRole; label: string }[] = useMemo(
    () => [
      { id: "pending", label: "Pending approval" },
      { id: "admin", label: "Admin" },
      { id: "ops_manager", label: "Ops Manager" },
      { id: "dispatcher", label: "Dispatcher" },
      { id: "finance", label: "Finance" },
      { id: "customer", label: "Customer" },
      { id: "driver", label: "Driver" },
    ],
    []
  );

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMessage(null);
    const email = entryEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setUserMessage("Enter a valid email.");
      return;
    }
    await addUser({
      email,
      role: entryRole,
      firstName: entryFirst.trim(),
      lastName: entryLast.trim(),
    } as any);
    setUserMessage(`Saved ${email} as ${entryRole}.`);
  };

  const handleDeleteUser = async (id: string | number) => {
    await deleteUser(id);
    setUserMessage(`Removed user.`);
  };

  const handleToggle = (key: keyof AppSettings) => {
    onChangeSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onChangeSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue = value === "" ? 0 : Number(value);
    onChangeSettings((prev) => ({ ...prev, [name]: Number.isFinite(nextValue) ? nextValue : 0 }));
  };

  const pendingUsers = users.filter((u) => u.role === "pending");
  const otherUsers = users.filter((u) => u.role !== "pending");

  useEffect(() => {
    setPendingRoleSelection((prev) => {
      const next: Record<string, UserRole> = {};
      for (const u of pendingUsers) {
        const key = String(u.id);
        next[key] = prev[key] || "dispatcher";
      }
      return next;
    });
  }, [pendingUsers]);

  return (
    <div className="space-y-6">
      <ShellCard className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">System settings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage application preferences and approve pending signups (stored in the database).
            </p>
          </div>
          <div className="text-xs text-slate-500">Signed in as {user?.email || "guest"}</div>
        </div>
      </ShellCard>

      {isAdmin && (
        <ShellCard className="px-5 py-4 space-y-4">
          <SectionHeader title="Pending users" subtitle="Approve new signups and set their role." />
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-slate-600">No pending users right now.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{u.email}</div>
                    <div className="text-xs text-slate-500">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "No name"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Set role for ${u.email}`}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={pendingRoleSelection[String(u.id)] || "dispatcher"}
                      onChange={(e) =>
                        setPendingRoleSelection((prev) => ({
                          ...prev,
                          [String(u.id)]: e.target.value as UserRole,
                        }))
                      }
                    >
                      <option value="dispatcher">Dispatcher</option>
                      <option value="ops_manager">Ops Manager</option>
                      <option value="finance">Finance</option>
                      <option value="admin">Admin</option>
                      <option value="customer">Customer (magic links only)</option>
                      <option value="driver">Driver</option>
                    </select>
                    <button
                      className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
                      onClick={async () => {
                        const role = pendingRoleSelection[String(u.id)] || "dispatcher";
                        await updateUser({ ...u, role });
                        setUserMessage(`Approved ${u.email} as ${role}.`);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:border-slate-300"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ShellCard>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <ShellCard className="px-5 py-4">
          <SectionHeader title="Application preferences" subtitle="Control how Heartfledge behaves for all users." />
          <div className="mt-4 space-y-4">
            <SettingsToggle
              label="Enable AI Assistant"
              description="Show the AI assistant widget on all pages."
              enabled={settings.enableAssistant}
              onToggle={() => handleToggle("enableAssistant")}
            />
            <SettingsToggle
              label="Show Financial Summaries"
              description="Display revenue card on the main dashboard."
              enabled={settings.showFinancialSummary}
              onToggle={() => handleToggle("showFinancialSummary")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="defaultView" className="block text-sm font-medium text-slate-700">
                  Default View
                </label>
                <select
                  id="defaultView"
                  name="defaultView"
                  value={settings.defaultView}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  {Object.entries(viewTitles).map(([key, title]) => (
                    <option key={key} value={key}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="distanceUnit" className="block text-sm font-medium text-slate-700">
                  Distance unit
                </label>
                <select
                  id="distanceUnit"
                  name="distanceUnit"
                  value={settings.distanceUnit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  <option value="km">Kilometers</option>
                  <option value="mi">Miles</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="ZWL">ZWL</option>
                </select>
              </div>
              <div>
                <label htmlFor="serviceDueSoonKm" className="block text-sm font-medium text-slate-700">
                  Service due soon (km)
                </label>
                <input
                  id="serviceDueSoonKm"
                  name="serviceDueSoonKm"
                  type="number"
                  value={settings.serviceDueSoonKm}
                  onChange={handleNumberChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </ShellCard>

        <ShellCard className="px-5 py-4">
          <SectionHeader title="User management" subtitle="Database directory that maps emails to roles." />
          {isAdmin ? (
            <div className="space-y-4">
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSaveUser}>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={entryEmail}
                    onChange={(e) => setEntryEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="user@company.com"
                    type="email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">First name</label>
                  <input
                    value={entryFirst}
                    onChange={(e) => setEntryFirst(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Last name</label>
                  <input
                    value={entryLast}
                    onChange={(e) => setEntryLast(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    value={entryRole}
                    onChange={(e) => setEntryRole(e.target.value as UserRole)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                  >
                    Save user
                  </button>
                </div>
              </form>

              {userMessage && <StatusPill tone="info" label={userMessage} />}

              <div>
                <h3 className="text-sm font-semibold text-slate-800">Directory</h3>
                {users.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-1">No users added yet.</p>
                ) : (
                  <div className="mt-2 divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">{u.email}</div>
                          <div className="text-xs text-slate-500">
                            {(u as any).first_name || (u as any).firstName || ""} {(u as any).last_name || (u as any).lastName || ""} • {u.role}
                          </div>
                        </div>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>User management is available to admins.</p>
            </div>
          )}
        </ShellCard>
      </div>
    </div>
  );
};

export default SettingsPage;
