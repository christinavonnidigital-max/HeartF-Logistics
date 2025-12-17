import React from "react";
import {
  GridIcon,
  TruckIcon,
  DocumentTextIcon,
  DriverIcon,
  UsersIcon,
  MapIcon,
  BarChartIcon,
  CampaignIcon,
  MegaphoneIcon,
  WorkflowIcon,
  AnalyticsIcon,
  CreditCardIcon,
  SettingsIcon,
  CloseIcon,
  MenuIcon,
} from "./icons/Icons";
import { View } from "../App";
import { useAuth, UserRole } from "../auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

type SidebarProps = {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

type NavItem = {
  label: string;
  view: View;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ThemeToggle is imported from components/ThemeToggle

const viewPermissions: Partial<Record<View, UserRole[]>> = {
  fleet: ["admin", "dispatcher", "ops_manager"],
  bookings: ["admin", "dispatcher", "ops_manager", "customer"],
  drivers: ["admin", "dispatcher", "ops_manager"],
  routes: ["admin", "dispatcher", "ops_manager"],
  leads: ["admin", "ops_manager", "dispatcher"],
  marketing: ["admin", "ops_manager"],
  campaigns: ["admin", "ops_manager"],
  "new-campaign": ["admin", "ops_manager"],
  analytics: ["admin", "ops_manager"],
  financials: ["admin", "finance", "ops_manager", "customer"],
  reports: ["admin", "finance", "ops_manager"],
  settings: ["admin", "ops_manager", "finance"],
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", view: "dashboard", icon: GridIcon }],
  },
  {
    title: "Operations",
    items: [
      { label: "Fleet", view: "fleet", icon: TruckIcon },
      { label: "Bookings", view: "bookings", icon: DocumentTextIcon },
      { label: "Drivers", view: "drivers", icon: DriverIcon },
      { label: "Routes", view: "routes", icon: MapIcon },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Leads", view: "leads", icon: UsersIcon },
      { label: "Customers", view: "customers", icon: UsersIcon },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns", view: "campaigns", icon: CampaignIcon },
      { label: "Sequences", view: "new-campaign", icon: WorkflowIcon },
      { label: "Analytics", view: "analytics", icon: AnalyticsIcon },
      { label: "Marketing", view: "marketing", icon: MegaphoneIcon },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Financials", view: "financials", icon: CreditCardIcon },
      { label: "Reports", view: "reports", icon: BarChartIcon },
    ],
  },
  {
    title: "Admin",
    items: [{ label: "Settings", view: "settings", icon: SettingsIcon }],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}) => {
  const { user } = useAuth();

  const isAllowed = (view: View) => {
    if (!user) return false;
    const roles = viewPermissions[view];
    return !roles || roles.includes(user.role);
  };

  const handleSelect = (view: View) => {
    setActiveView(view);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-muted/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0B1220] text-slate-200 border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm font-semibold text-slate-100">
              HF
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Heartfledge
              </p>
              <p className="text-sm font-semibold text-slate-200">Logistics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle />
            <button
              className="md:hidden rounded-lg border border-white/10 p-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 md:hidden shrink-0">
          {user ? (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-foreground-muted capitalize">{user.role.replace("_", " ")}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <MenuIcon className="h-4 w-4" /> Not signed in
            </div>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 min-h-0 p-2 overflow-y-auto custom-scrollbar">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              isAllowed(item.view)
            );
            if (!visibleItems.length) return null;
            return (
              <div key={section.title} className="space-y-2">
                  <p className="px-2 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => handleSelect(item.view)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition
  ${isActive
    ? "bg-white text-slate-900 shadow-sm"
    : "text-slate-200/80 hover:bg-white/8 hover:text-white"
  }`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isActive ? "text-orange-600" : "text-slate-300/80 group-hover:text-white"}`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-200">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </nav>
      </aside>
    </>
  );
};

export default Sidebar;
