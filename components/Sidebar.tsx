import React from 'react';
import {
  BarChartIcon,
  BriefcaseIcon,
  CampaignIcon,
  ChartPieIcon,
  CreditCardIcon,
  DriverIcon,
  MapIcon,
  SettingsIcon,
  TruckIcon,
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
} from './icons/Icons';
import { View } from '../App';

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
};

type NavSectionConfig = {
  label: string;
  items: NavItemConfig[];
};

const navSections: NavSectionConfig[] = [
  {
    label: 'Operations',
    items: [
      { view: 'dashboard', label: 'Overview', icon: <BarChartIcon className="h-5 w-5" /> },
      { view: 'fleet', label: 'Fleet', icon: <TruckIcon className="h-5 w-5" /> },
      {
        view: 'bookings',
        label: 'Bookings',
        icon: <ClipboardDocumentIcon className="h-5 w-5" />,
      },
      { view: 'drivers', label: 'Drivers', icon: <DriverIcon className="h-5 w-5" /> },
      { view: 'routes', label: 'Routes', icon: <MapIcon className="h-5 w-5" /> },
    ],
  },
  {
    label: 'CRM',
    items: [
      { view: 'leads', label: 'Leads', icon: <BriefcaseIcon className="h-5 w-5" /> },
      { view: 'customers', label: 'Customers', icon: <UsersIcon className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { view: 'marketing', label: 'Marketing home', icon: <CampaignIcon className="h-5 w-5" /> },
      { view: 'campaigns', label: 'Sequences', icon: <DocumentTextIcon className="h-5 w-5" /> },
      { view: 'analytics', label: 'Analytics', icon: <ChartPieIcon className="h-5 w-5" /> },
      { view: 'new-campaign', label: 'New sequence', icon: <CampaignIcon className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Finance',
    items: [
      { view: 'financials', label: 'Financials', icon: <CreditCardIcon className="h-5 w-5" /> },
      { view: 'reports', label: 'Reports', icon: <DocumentTextIcon className="h-5 w-5" /> },
    ],
  },
  {
    label: 'System',
    items: [{ view: 'settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5" /> }],
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
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
        isActive
          ? 'bg-orange-500 text-white shadow-sm'
          : 'text-slate-200 hover:bg-slate-800 hover:text-white',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm',
          isActive
            ? 'border-orange-400 bg-orange-500/90 text-white'
            : 'border-slate-700 bg-slate-900 text-slate-200 group-hover:border-slate-500',
        ].join(' ')}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  );
};

const SidebarShell: React.FC<SidebarProps & { variant?: 'mobile' | 'desktop' }> = ({
  activeView,
  setActiveView,
  setIsOpen,
}) => {
  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsOpen(false);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-[#0B1020] text-slate-100 shadow-xl">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          <TruckIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Heartfledge</span>
          <span className="text-[11px] text-slate-400">Logistics and CRM hub</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(item => (
                <NavItem
                  key={item.view}
                  item={item}
                  activeView={activeView}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 py-3 text-xs text-slate-500">
        <p className="truncate">Signed in as</p>
        <p className="truncate font-medium text-slate-200">dispatcher@heartfledge.local</p>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Scrim */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute inset-y-0 left-0 w-64 transform bg-[#0B1020] transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
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