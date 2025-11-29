
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { MenuIcon } from "./icons/Icons";
import AiAssistant from "./FleetAssistant";
import { AppSettings, View } from "../App";
import { useAuth } from "../auth/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  contextData: any;
  settings?: Partial<AppSettings>;
}

const viewTitles: Record<View, string> = {
  dashboard: "Dashboard overview",
  fleet: "Fleet management",
  bookings: "Bookings",
  drivers: "Driver management",
  customers: "Customer management",
  routes: "Route management",
  leads: "Leads and pipeline",
  campaigns: "Sequences",
  "new-campaign": "Create sequence",
  financials: "Financials",
  reports: "Reports",
  marketing: "Campaigns",
  settings: "Settings",
  analytics: "Performance analytics",
};

const viewSubtitles: Partial<Record<View, string>> = {
  dashboard: "High level snapshot of fleet, customers, and cash flow",
  fleet: "Track vehicles, status, and utilization",
  bookings: "Keep upcoming jobs and loads organized",
  drivers: "Manage drivers, documents, and compliance",
  customers: "Accounts, contacts, and key relationships",
  routes: "Plan and monitor routes and waypoints",
  leads: "Capture, qualify, and move deals forward",
  campaigns: "Automated outreach across your pipeline",
  "new-campaign": "Build a new sequence in a few steps",
  financials: "Invoices, expenses, and profitability",
  reports: "Export and review performance over time",
  marketing: "Campaign overview and status",
  analytics: "See what channels are working",
};

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setActiveView,
  contextData,
  settings,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  let contextType: "fleet" | "crm" | "financials" | "routes" = "fleet";

  if (["fleet", "dashboard", "bookings", "drivers"].includes(activeView)) {
    contextType = "fleet";
  } else if (["routes"].includes(activeView)) {
    contextType = "routes";
  } else if (["financials", "reports"].includes(activeView)) {
    contextType = "financials";
  } else if (
    ["leads", "customers", "campaigns", "new-campaign", "marketing", "analytics"].includes(
      activeView
    )
  ) {
    contextType = "crm";
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="relative flex min-h-screen flex-col bg-[#EEF1FA] text-slate-900 md:pl-64 transition-all duration-300 z-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-r from-white via-white to-indigo-50/60 backdrop-blur-md shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <img
                src="/heartfledge-logo-transparent-navy.png"
                alt="Heartfledge logo"
                className="hidden h-7 w-auto object-contain md:block"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />

              <div>
                <h1 className="text-base font-semibold capitalize text-slate-900 sm:text-lg md:text-xl leading-tight">
                  {viewTitles[activeView]}
                </h1>
                {viewSubtitles[activeView] && (
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm hidden sm:block">
                    {viewSubtitles[activeView]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <>
                  <div className="hidden text-right text-xs sm:block">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] capitalize text-slate-500">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white shadow-sm ring-2 ring-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                </>
              )}

              <button
                onClick={logout}
                className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 text-[0.96rem]">
          <div className="mx-auto max-w-7xl space-y-6 relative">
            {children}
          </div>
        </main>
      </div>

      {settings?.enableAssistant !== false && (
        <AiAssistant contextData={contextData} contextType={contextType} />
      )}
    </div>
  );
};

export default Layout;
