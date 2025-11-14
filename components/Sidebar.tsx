
import React, { Fragment } from 'react';
import { BarChartIcon, BriefcaseIcon, CreditCardIcon, DriverIcon, MapIcon, SettingsIcon, TruckIcon, UsersIcon, GridIcon, DocumentTextIcon, CampaignIcon } from './icons/Icons';
import { View } from '../App';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
    view: View;
    activeView: View;
    setActiveView: (view: View) => void;
    setIsOpen: (isOpen: boolean) => void;
    icon: React.ReactNode;
    name: string;
}> = ({ view, activeView, setActiveView, setIsOpen, icon, name }) => {
    const isActive = activeView === view;
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setActiveView(view);
                setIsOpen(false);
            }}
            className={`flex items-center py-2.5 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-[#2C2F3E] text-white border-l-4 border-orange-500 pl-3 font-semibold'
                  : 'text-gray-300 hover:bg-[#2C2F3E] hover:text-white px-4'
            }`}
        >
            {icon}
            <span className="ml-3">{name}</span>
        </a>
    );
};

const PlaceholderLink: React.FC<{ name: string; icon: React.ReactNode; }> = ({ name, icon }) => (
    <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            alert(`${name} module is not yet implemented.`);
        }}
        className="flex items-center px-4 py-2.5 rounded-lg text-gray-400 hover:bg-[#2C2F3E] hover:text-white"
    >
        {icon}
        <span className="ml-3">{name}</span>
    </a>
);


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
    
    const navContent = (
        <div className="w-64 bg-[#1A1D29] flex flex-col h-full">
            <div className="h-16 flex items-center justify-center text-2xl font-bold text-white border-b border-gray-700/50">
                Heartfledge
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
                <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<GridIcon className="w-6 h-6" />} name="Dashboard" />
                
                <div className="pt-4 mt-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operations</h3>
                    <div className="mt-2 space-y-1">
                        <NavLink view="fleet" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<TruckIcon className="w-6 h-6" />} name="Fleet" />
                        <NavLink view="bookings" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<DocumentTextIcon className="w-6 h-6" />} name="Bookings" />
                        <NavLink view="drivers" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<DriverIcon className="w-6 h-6" />} name="Drivers" />
                        <NavLink view="customers" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<UsersIcon className="w-6 h-6" />} name="Customers" />
                        <NavLink view="routes" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<MapIcon className="w-6 h-6" />} name="Routes" />
                    </div>
                </div>

                <div className="pt-4 mt-2">
                     <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Marketing</h3>
                     <div className="mt-2 space-y-1">
                        <NavLink view="leads" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<BriefcaseIcon className="w-6 h-6" />} name="Leads / CRM" />
                        <NavLink view="marketing" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<CampaignIcon className="w-6 h-6" />} name="Marketing" />
                        <NavLink view="campaigns" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<CampaignIcon className="w-6 h-6" />} name="Campaigns" />
                     </div>
                </div>
                 <div className="pt-4 mt-2">
                     <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</h3>
                     <div className="mt-2 space-y-1">
                        <NavLink view="financials" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<CreditCardIcon className="w-6 h-6" />} name="Financials" />
                        <NavLink view="reports" activeView={activeView} setActiveView={setActiveView} setIsOpen={setIsOpen} icon={<BarChartIcon className="w-6 h-6" />} name="Reports" />
                    </div>
                </div>
            </nav>
            <div className="px-2 py-4 border-t border-gray-700/50">
                 <PlaceholderLink name="Settings" icon={<SettingsIcon className="w-6 h-6" />} />
            </div>
             <div className="px-4 py-2 text-center text-xs text-gray-500">
                Icons by <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Icons8</a>
            </div>
        </div>
    );

  return (
    <>
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsOpen(false)}></div>
            <div className={`relative transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {navContent}
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
             <div className="fixed inset-y-0 left-0 w-64">
                {navContent}
            </div>
        </div>
    </>
  );
};

export default Sidebar;
