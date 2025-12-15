
import React, { useState } from "react";
import { ShellCard, SubtleCard, SectionHeader, StatusPill } from "./UiKit";
import {
  UsersIcon,
  CogIcon,
  SparklesIcon,
  LockIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  TrashIcon,
} from "./icons/Icons";
import { AppSettings, View } from "../App";
import { Currency, User } from "../types";
import { useData } from "../contexts/DataContext";
import InviteUserModal from "./InviteUserModal";
import ConfirmModal from "./ConfirmModal";
import AuditLogModal from './AuditLogModal';
import { useAuth } from '../auth/AuthContext';
import { can } from '../src/lib/permissions';

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
      aria-label={label || 'Toggle setting'}
      role="switch"
      aria-checked={enabled ? 'true' : 'false'}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
        enabled ? 'bg-orange-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);


const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onChangeSettings }) => {
  const { users, addUser, deleteUser } = useData();
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | number | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const handleToggle = (key: keyof AppSettings) => {
    onChangeSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChangeSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'email_verified'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now(),
      is_active: true,
      email_verified: false, // Invite flow usually means pending verification
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addUser(newUser);
    setIsInviteModalOpen(false);
  };

  const confirmDeleteUser = () => {
    if (userToDelete !== null) {
      deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const getRoleTone = (role: User['role']) => {
    switch(role) {
      case 'admin': return 'danger';
      case 'ops_manager': return 'warn';
      case 'finance': return 'success';
      case 'dispatcher': return 'info';
      case 'customer': return 'neutral';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <ShellCard className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              System settings
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage application preferences and user access for your Heartfledge
              workspace.
            </p>
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-5 md:grid-cols-2">
        <ShellCard className="px-5 py-4">
          <SectionHeader
            title="Application preferences"
            subtitle="Control how Heartfledge behaves for all users."
          />
          <div className="mt-4 space-y-4">
              <SettingsToggle
                label="Enable AI Assistant"
                description="Show the AI assistant widget on all pages."
                enabled={settings.enableAssistant}
                onToggle={() => handleToggle('enableAssistant')}
              />
               <SettingsToggle
                label="Show Financial Summaries"
                description="Display revenue card on the main dashboard."
                enabled={settings.showFinancialSummary}
                onToggle={() => handleToggle('showFinancialSummary')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="defaultView" className="block text-sm font-medium text-slate-700">Default View</label>
                      <select id="defaultView" name="defaultView" value={settings.defaultView} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm">
                          {Object.entries(viewTitles).map(([key, title]) => (
                            <option key={key} value={key}>{title}</option>
                          ))}
                      </select>
                  </div>
                   <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Default Currency</label>
                      <select id="currency" name="currency" value={settings.currency} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm">
                          <option value="USD">USD</option>
                          <option value="ZWL">ZWL</option>
                      </select>
                  </div>
                   <div>
                      <label htmlFor="distanceUnit" className="block text-sm font-medium text-slate-700">Distance Unit</label>
                      <select id="distanceUnit" name="distanceUnit" value={settings.distanceUnit} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm">
                          <option value="km">Kilometers (km)</option>
                          <option value="mi">Miles (mi)</option>
                      </select>
                  </div>
              </div>
          </div>
        </ShellCard>
        
        <ShellCard className="px-5 py-4 flex flex-col">
          <SectionHeader
            title="User management"
            subtitle="Manage access for your team."
            actions={
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-orange-100 transition"
              >
                <UserPlusIcon className="w-4 h-4" />
                Invite User
              </button>
            }
          />
          <div className="mt-4 flex-1 overflow-y-auto max-h-80 -mx-2 px-2">
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={user.role.replace('_', ' ')} tone={getRoleTone(user.role)} />
                    <button 
                      onClick={() => setUserToDelete(user.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove User"
                      aria-label={`Remove ${user.first_name} ${user.last_name}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ShellCard>

        <ShellCard className="px-5 py-4">
          <SectionHeader
            title="Security"
            subtitle="Protect your account and organization."
            actions={(
              can('audit.view', user?.role) ? (
                <button onClick={() => setIsAuditOpen(true)} className="text-xs px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100">View Audit Log</button>
              ) : null
            )}
          />
           <div className="mt-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <LockIcon className="h-5 w-5" /> 
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-900">Password</p>
                        <p className="text-slate-500">Last changed 3 months ago</p>
                    </div>
                </div>
                <button className="text-sm font-medium text-orange-600 hover:text-orange-700">Change</button>
             </div>
             
             <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <ShieldExclamationIcon className="h-5 w-5" /> 
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-900">Two-factor authentication</p>
                        <p className="text-slate-500">Add an extra layer of security</p>
                    </div>
                </div>
                <SettingsToggle 
                    label="" 
                    description="" 
                    enabled={false} 
                    onToggle={() => alert("2FA setup would open here.")} 
                />
             </div>
             
             <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-sm text-slate-500 w-full text-center bg-orange-50 p-2 rounded-lg border border-orange-100">
                    <p>Session timeout enabled: 30 mins</p>
                </div>
             </div>
           </div>
        </ShellCard>

      </div>

      {isInviteModalOpen && (
        <InviteUserModal 
          onClose={() => setIsInviteModalOpen(false)} 
          onInvite={handleInviteUser} 
        />
      )}

      <AuditLogModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      <ConfirmModal
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Remove User"
        message="Are you sure you want to remove this user? They will lose access to the platform immediately."
        confirmLabel="Remove"
      />
    </div>
  );
};

export default SettingsPage;
