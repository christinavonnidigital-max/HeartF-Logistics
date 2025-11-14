
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { MenuIcon, TruckIcon } from './icons/Icons';
import AiAssistant from './AiAssistant';
import { View } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  contextData: any;
}

const viewTitles: { [key in View]: string } = {
    dashboard: 'Dashboard Overview',
    fleet: 'Fleet Management',
    bookings: 'Bookings',
    drivers: 'Driver Management',
    customers: 'Customer Management',
    routes: 'Route Management',
    reports: 'Reports & Analytics',
    leads: 'Leads Management',
    campaigns: 'Marketing Campaigns',
    financials: 'Financials',
    marketing: 'Marketing Hub',
    settings: 'Settings',
    analytics: 'Analytics',
};


const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, contextData }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contextType = activeView === 'leads' ? 'crm' : activeView;

  return (
    <div className="relative md:flex min-h-screen bg-[#F5F7FA] text-gray-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center">
            <button className="md:hidden mr-4" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon className="w-6 h-6"/>
            </button>
            <h1 className="text-xl md:text-2xl font-semibold capitalize">{viewTitles[activeView]}</h1>
          </div>
          <div>
            {/* User profile section can go here */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      <AiAssistant contextData={contextData} contextType={contextType as any} />
    </div>
  );
};

export default Layout;
