import React, { useEffect, useMemo, useState } from "react";
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
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "./icons/Icons";
import { View } from "../App";
import { useAuth, UserRole } from "../auth/AuthContext";

type SidebarProps = {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
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
  "lead-finder": ["admin", "ops_manager", "dispatcher"],
  marketing: ["admin", "ops_manager"],
  campaigns: ["admin", "ops_manager"],
  "new-campaign": ["admin", "ops_manager"],
  analytics: ["admin", "ops_manager"],
  financials: ["admin", "finance", "ops_manager", "customer"],
  reports: ["admin", "finance", "ops_manager"],
  settings: ["admin"],
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
      { label: "Lead Finder", view: "lead-finder", icon: SearchIcon },
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
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user } = useAuth();
  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";
  const storageKey = "hf-sidebar-open-sections";

  const isAllowed = (view: View) => {
    if (!user) return false;
    const roles = viewPermissions[view];
    return !roles || roles.includes(user.role);
  };

  const sectionMap = useMemo(
    () =>
      navSections.map((section) => ({
        ...section,
        items: section.items.filter((item) => isAllowed(item.view)),
      })),
    [user?.role]
  );

  const defaultOpenSections = useMemo(() => {
    const activeSection = sectionMap.find((section) =>
      section.items.some((item) => item.view === activeView)
    )?.title;
    return sectionMap.reduce<Record<string, boolean>>((acc, section, index) => {
      acc[section.title] = section.title === activeSection || index === 0;
      return acc;
    }, {});
  }, [sectionMap, activeView]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(defaultOpenSections);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setOpenSections(defaultOpenSections);
        return;
      }
      const parsed = JSON.parse(raw);
      const next = sectionMap.reduce<Record<string, boolean>>((acc, section) => {
        acc[section.title] =
          typeof parsed?.[section.title] === "boolean"
            ? parsed[section.title]
            : defaultOpenSections[section.title];
        return acc;
      }, {});
      setOpenSections(next);
    } catch {
      setOpenSections(defaultOpenSections);
    }
  }, [defaultOpenSections, sectionMap]);

  useEffect(() => {
    setOpenSections((prev) => {
      const activeSection = sectionMap.find((section) =>
        section.items.some((item) => item.view === activeView)
      )?.title;
      if (!activeSection || prev[activeSection]) return prev;
      const next = { ...prev, [activeSection]: true };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  }, [activeView, sectionMap]);

  const handleSelect = (view: View) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      window.localStorage.setItem("hf-sidebar-collapsed", String(next));
    } catch {
      // ignore localStorage errors
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 transform bg-[#1e2b57] text-white border-r border-white/10 shadow-xl transition-all duration-300 md:translate-x-0 ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* This wrapper is the whole trick: gives nav a real height to scroll inside */}
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <div className={`flex items-center ${isCollapsed ? "justify-center w-full md:w-auto" : "gap-3"}`}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#f5993b] to-amber-500 flex items-center justify-center text-sm font-semibold shadow-lg shadow-orange-500/25 text-white shrink-0">
                HF
              </div>
              {!isCollapsed && (
                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Heartfledge</p>
                  <p className="text-sm font-semibold text-white">Logistics</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="hidden md:inline-flex rounded-lg border border-white/15 p-2 text-white hover:bg-white/10"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
              >
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-0" : "rotate-180"}`} />
              </button>
              <button
                className="md:hidden rounded-lg border border-white/15 p-2 text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User card on mobile */}
          <div className="px-4 py-3 md:hidden">
            {user ? (
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-white/70 capitalize">{user.role.replace("_", " ")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MenuIcon className="h-4 w-4" /> Not signed in
              </div>
            )}
          </div>

          {/* Scrollable nav */}
          <nav className={`min-h-0 flex-1 overflow-y-auto pb-6 pt-3 custom-scrollbar ${isCollapsed ? "px-2" : "px-3"}`}>
            <div className="space-y-3">
              {sectionMap.map((section) => {
                const visibleItems = section.items;
                if (!visibleItems.length) return null;
                const isExpanded = openSections[section.title] ?? true;
                const hasActiveItem = visibleItems.some((item) => item.view === activeView);

                if (isCollapsed) {
                  return (
                    <div
                      key={section.title}
                      className={`overflow-hidden rounded-2xl border px-2 py-2 ${
                        hasActiveItem
                          ? "border-white/15 bg-white/8"
                          : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                        {section.title.slice(0, 3)}
                      </div>
                      <div className="space-y-1">
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeView === item.view;
                          return (
                            <button
                              key={item.view}
                              onClick={() => handleSelect(item.view)}
                              className={`flex w-full items-center justify-center rounded-xl px-2 py-2.5 transition ${
                                isActive
                                  ? "bg-white text-[#1e2b57] shadow-sm"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              }`}
                              title={item.label}
                              aria-label={item.label}
                            >
                              <Icon
                                className={`h-4.5 w-4.5 shrink-0 ${
                                  isActive ? "text-[#f5993b]" : "text-white/60"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={section.title}
                    className={`overflow-hidden rounded-2xl border transition ${
                      hasActiveItem
                        ? "border-white/15 bg-white/8"
                        : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                      aria-expanded={isExpanded}
                    >
                      <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                        {section.title}
                      </span>
                      <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                        {visibleItems.length}
                      </span>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-white/60 transition-transform ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 border-t border-white/8 px-2 py-2">
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeView === item.view;

                          return (
                            <button
                              key={item.view}
                              onClick={() => handleSelect(item.view)}
                              className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                                isActive
                                  ? "bg-white text-[#1e2b57] shadow-sm"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <Icon
                                className={`h-4.5 w-4.5 shrink-0 ${
                                  isActive ? "text-[#f5993b]" : "text-white/55"
                                }`}
                              />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>

                              {item.badge && (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {user && (
            <div className={`border-t border-white/10 px-3 py-3 ${isCollapsed ? "hidden md:block" : ""}`}>
              {isCollapsed ? (
                <div
                  className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] py-3"
                  title={`${displayName} (${user.role.replace("_", " ")})`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                  <div className="mt-0.5 text-xs capitalize text-white/65 truncate">
                    {user.role.replace("_", " ")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
