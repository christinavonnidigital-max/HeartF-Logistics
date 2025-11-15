
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons/Icons';
import AiAssistant from './FleetAssistant';
import { View } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  contextData: any;
}

const viewTitles: { [K in View]: string } = {
  dashboard: 'Dashboard overview',
  fleet: 'Fleet management',
  bookings: 'Bookings',
  drivers: 'Driver management',
  customers: 'Customer management',
  routes: 'Route management',
  reports: 'Reports and analytics',
  leads: 'Leads and pipeline',
  campaigns: 'Sequences and campaigns',
  'new-campaign': 'Create sequence',
  financials: 'Financials',
  marketing: 'Marketing hub',
  settings: 'Settings',
  analytics: 'Campaign analytics',
};

const viewSubtitles: Partial<{ [K in View]: string }> = {
  dashboard: 'High level snapshot of fleet, CRM, and cash flow',
  fleet: 'Track vehicles, status, and utilization',
  bookings: 'Keep upcoming jobs and loads organized',
  drivers: 'Manage drivers, compliance, and performance',
  customers: 'Accounts, contacts, and key relationships',
  routes: 'Plan and monitor routes and waypoints',
  reports: 'Export, audit, and deep dive into performance',
  leads: 'Capture, qualify, and move deals forward',
  campaigns: 'Run repeatable outreach and follow ups',
  'new-campaign': 'Build a new automated sales sequence',
  financials: 'Invoices, expenses, and profitability',
  marketing: 'Top of funnel activity across channels',
  analytics: 'Channel and campaign performance',
  settings: 'System and account configuration',
};

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setActiveView,
  contextData,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Map UI view to assistant context
  let contextType: 'fleet' | 'crm' | 'financials' | 'routes' = 'fleet';

  if (['fleet', 'dashboard', 'bookings', 'drivers'].includes(activeView)) {
    contextType = 'fleet';
  } else if (['routes'].includes(activeView)) {
    contextType = 'routes';
  } else if (['financials', 'reports'].includes(activeView)) {
    contextType = 'financials';
  } else if (
    ['leads', 'customers', 'campaigns', 'new-campaign', 'marketing', 'analytics'].includes(
      activeView,
    )
  ) {
    contextType = 'crm';
  }

  return (
    <div className="min-h-screen bg-[#1A1D29]">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="relative flex min-h-screen flex-col bg-[#F5F7FA] text-gray-900 md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-base font-semibold capitalize text-gray-900 sm:text-lg md:text-xl">
                  {viewTitles[activeView]}
                </h1>
                {viewSubtitles[activeView] && (
                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    {viewSubtitles[activeView]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Simple stub for profile area, easy to wire up later */}
              <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:flex">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                  HF
                </span>
                <span>Heartfledge Ops</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Floating AI assistant button and panel */}
      <AiAssistant contextData={contextData} contextType={contextType} />
    </div>
  );
};

export default Layout;
