import React from "react";
import {
  BarChartIcon,
  BriefcaseIcon,
  CreditCardIcon,
  DriverIcon,
  UsersIcon,
  TruckIcon,
  GridIcon,
  SettingsIcon,
  MapIcon,
  DocumentTextIcon,
  CampaignIcon,
  ChartPieIcon,
} from "./icons/Icons";
import { View } from "../App";
import { useAuth, UserRole } from "../auth/AuthContext";

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type NavItemConfig = {
  view: View;
  label: string;
  icon: React.ReactNode;
  allowedRoles?: UserRole[];
};

type NavSectionConfig = {
  label: string;
  allowedRoles?: UserRole[];
  items: NavItemConfig[];
};

const navSections: NavSectionConfig[] = [
  {
    label: "Command center",
    items: [
      {
        view: "dashboard",
        label: "Overview",
        icon: <GridIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Fleet ops",
    allowedRoles: ["admin", "dispatcher", "ops_manager"],
    items: [
      { view: "fleet", label: "Fleet", icon: <TruckIcon className="h-5 w-5" /> },
      {
        view: "bookings",
        label: "Bookings",
        icon: <DocumentTextIcon className="h-5 w-5" />,
      },
      { view: "routes", label: "Routes", icon: <MapIcon className="h-5 w-5" /> },
      { view: "drivers", label: "Drivers", icon: <DriverIcon className="h-5 w-5" /> },
    ],
  },
  {
    label: "Customers",
    items: [
      { 
        view: "leads", 
        label: "Leads", 
        icon: <BriefcaseIcon className="h-5 w-5" />,
        allowedRoles: ["admin", "ops_manager", "dispatcher"] 
      },
      { 
        view: "customers", 
        label: "Customers", 
        icon: <UsersIcon className="h-5 w-5" /> 
      },
    ],
  },
  {
    label: "Growth",
    allowedRoles: ["admin", "ops_manager"],
    items: [
      {
        view: "marketing",
        label: "Campaigns",
        icon: <CampaignIcon className="h-5 w-5" />,
      },
      {
        view: "campaigns",
        label: "Sequences",
        icon: <DocumentTextIcon className="h-5 w-5" />,
      },
      {
        view: "analytics",
        label: "Performance",
        icon: <ChartPieIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Finance",
    allowedRoles: ["admin", "finance", "ops_manager"],
    items: [
      {
        view: "financials",
        label: "Financials",
        icon: <CreditCardIcon className="h-5 w-5" />,
      },
      {
        view: "reports",
        label: "Reports",
        icon: <BarChartIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "System",
    allowedRoles: ["admin"],
    items: [
      {
        view: "settings",
        label: "Settings",
        icon: <SettingsIcon className="h-5 w-5" />,
        allowedRoles: ["admin"],
      },
    ],
  },
];

interface NavItemProps {
  item: NavItemConfig;
  activeView: View;
  onClick: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, activeView, onClick }) => {
  const isActive = item.view === activeView;

  return (
    <button
      type="button"
      onClick={() => onClick(item.view)}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-[#273465] text-white font-semibold ring-1 ring-orange-400/70"
          : "text-slate-200 hover:bg-[#273465] hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors",
          isActive
            ? "border-orange-300 bg-orange-500 text-white"
            : "border-slate-700 bg-transparent text-slate-200 group-hover:border-slate-500",
        ].join(" ")}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  );
};

const SidebarShell: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  setIsOpen,
}) => {
  const { user } = useAuth();

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const hasAccess = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles) return true;
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-[#202A56] text-slate-100 shadow-2xl">
      {/* Brand */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800/60 px-4">
        <img
          src="/heartfledge-logo-transparent-white.png"
          alt="Heartfledge Logistics"
          className="h-10 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 custom-scrollbar">
        {navSections.map((section) => {
          if (!hasAccess(section.allowedRoles)) return null;

          const visibleItems = section.items.filter(item => hasAccess(item.allowedRoles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500/80">
                {section.label}
              </p>
              <div className="space-y-1.5">
                {visibleItems.map((item) => (
                  <NavItem
                    key={item.view}
                    item={item}
                    activeView={activeView}
                    onClick={handleNavClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
        <p className="truncate">Signed in as</p>
        <p className="truncate font-medium text-slate-200">
          {user?.email || "Guest"}
        </p>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={`absolute inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarShell
            activeView={activeView}
            setActiveView={setActiveView}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64">
        <SidebarShell
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </div>
    </>
  );
};

export default Sidebar;