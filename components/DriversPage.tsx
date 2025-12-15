
import React, { useState, useMemo, useEffect } from 'react';
import { Driver, User, DriverAssignment, EmploymentStatus } from '../types';
import { PlusIcon, SearchIcon, IllustrationTruckIcon } from './icons';
import EmptyState from './EmptyState';
import AddDriverModal from './AddDriverModal';
import DriverDetails from './DriverDetails';
import { ShellCard, SectionHeader, StatusPill } from './UiKit';

interface DriversPageProps {
  data: {
    drivers: Driver[];
    users: User[];
    assignments: DriverAssignment[];
  };
}

const DriversPage: React.FC<DriversPageProps> = ({ data }) => {
  // Keep a local copy of drivers so we can update it locally (and sync from props)
  const [drivers, setDrivers] = useState<Driver[]>(data.drivers);

  useEffect(() => {
    setDrivers(data.drivers);
  }, [data.drivers]);
  const [selectedDriver, setSelectedDriver] = useState<(Driver & { user?: User }) | null>(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>('all');

  const driversWithUsers = useMemo(() => {
    return drivers.map(driver => {
      const user = data.users.find(u => u.id === driver.user_id);
      return { ...driver, user };
    });
  }, [drivers, data.users]);

  const filteredDrivers = useMemo(() => {
    return driversWithUsers
      .filter(driver => statusFilter === 'all' || driver.employment_status === statusFilter)
      .filter(driver => {
        if (!searchTerm) return true;
        const lowercasedFilter = searchTerm.toLowerCase();
        const fullName = `${driver.user?.first_name || ''} ${driver.user?.last_name || ''}`.toLowerCase();
        return fullName.includes(lowercasedFilter) || driver.license_number.toLowerCase().includes(lowercasedFilter);
      });
  }, [driversWithUsers, searchTerm, statusFilter]);

  useEffect(() => {
    if (!selectedDriver && filteredDrivers.length > 0) {
      setSelectedDriver(filteredDrivers[0]);
    } else if (selectedDriver && !filteredDrivers.find(d => d.id === selectedDriver.id)) {
      setSelectedDriver(filteredDrivers.length > 0 ? filteredDrivers[0] : null);
    }
  }, [filteredDrivers, selectedDriver]);

  const handleAddDriver = (newDriverData: Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'role' | 'email_verified'>}) => {
    const newUserId = Date.now() + 1;
    const newUser: User = {
        ...newDriverData.user,
        id: newUserId,
        role: 'driver',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    
    const newDriver: Driver = {
      ...newDriverData,
      id: Date.now(),
      user_id: newUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDrivers(prev => [newDriver, ...prev]);
    setIsAddDriverModalOpen(false);
    setSelectedDriver({ ...newDriver, user: newUser });
  };
  
  const getStatusTone = (status: EmploymentStatus) => {
    switch (status) {
        case EmploymentStatus.ACTIVE: return 'success';
        case EmploymentStatus.ON_LEAVE: return 'info';
        case EmploymentStatus.SUSPENDED: return 'warn';
        case EmploymentStatus.TERMINATED: return 'danger';
        default: return 'neutral';
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <ShellCard className="flex flex-col p-4">
            <SectionHeader
              title={`Driver Roster (${filteredDrivers.length})`}
              subtitle="Manage driver profiles and compliance"
              actions={
                <button
                  className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition shrink-0"
                  onClick={() => setIsAddDriverModalOpen(true)}
                  aria-label="Add new driver"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              }
            />
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <div className="relative grow">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-4 h-4 text-slate-500" />
                </div>
              </div>
               <div>
                 <label htmlFor="driverStatusFilter" className="sr-only">Driver status filter</label>
                 <select
                   id="driverStatusFilter"
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value as EmploymentStatus | 'all')}
                   className="rounded-xl border border-slate-200 bg-white text-slate-900 pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                 >
                  <option value="all">All Statuses</option>
                  {Object.values(EmploymentStatus).map(status => (
                    <option key={status} value={status} className="capitalize">{status.replace(/_/g, ' ')}</option>
                  ))}
                 </select>
               </div>
            </div>
          <div className="mt-3 -mx-2 px-2 flex-1 space-y-1 overflow-y-auto">
            {filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => {
                  const isSelected = selectedDriver?.id === driver.id;
                  return (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition ${
                        isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{driver.user?.first_name} {driver.user?.last_name}</p>
                          <p className="text-sm text-slate-500">{driver.license_number}</p>
                        </div>
                        <StatusPill label={driver.employment_status.replace('_', ' ')} tone={getStatusTone(driver.employment_status)} />
                      </div>
                    </button>
                  )
                })
            ) : (
              <div className="p-8 text-center text-slate-500">
                  <p>No drivers found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
              </div>
            )}
          </div>
        </ShellCard>
        
        <div className="flex flex-col">
          {selectedDriver ? (
            <DriverDetails 
                driver={selectedDriver}
                assignments={data.assignments.filter(a => a.driver_id === selectedDriver.id)}
            />
          ) : (
             <EmptyState 
               icon={<IllustrationTruckIcon />}
               title={drivers.length > 0 ? "Select a Driver" : "No Drivers in System"}
               message={drivers.length > 0 ? "Choose a driver from the list to view their details, compliance status, and history." : "Get started by adding your first driver to the system."}
             />
          )}
        </div>
      </div>
      {isAddDriverModalOpen && (
        <AddDriverModal
            onClose={() => setIsAddDriverModalOpen(false)}
            onAddDriver={handleAddDriver}
        />
      )}
    </>
  );
};

export default DriversPage;
