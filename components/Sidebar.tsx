
import React from 'react';
import { BarChartIcon, DashboardIcon, DriverIcon, SettingsIcon, TruckIcon, UsersIcon } from './icons/Icons';

const Sidebar: React.FC = () => {
  const navItems = [
    { icon: <DashboardIcon className="w-6 h-6" />, name: 'Dashboard' },
    { icon: <TruckIcon className="w-6 h-6" />, name: 'Fleet', active: true },
    { icon: <DriverIcon className="w-6 h-6" />, name: 'Drivers' },
    { icon: <UsersIcon className="w-6 h-6" />, name: 'Customers' },
    { icon: <BarChartIcon className="w-6 h-6" />, name: 'Analytics' },
    { icon: <SettingsIcon className="w-6 h-6" />, name: 'Settings' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
        LogiPro
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`flex items-center px-4 py-2 text-lg rounded-lg transition-colors duration-200 ${
              item.active
                ? 'bg-blue-500 text-white dark:bg-blue-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span className="ml-3">{item.name}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
