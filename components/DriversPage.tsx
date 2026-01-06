import React, { useState, useMemo, useEffect, useRef } from "react";
import { Driver, User, DriverAssignment, EmploymentStatus } from "../types";
import { PlusIcon, SearchIcon, IllustrationTruckIcon } from "./icons";
import EmptyState from "./EmptyState";
import AddDriverModal from "./AddDriverModal";
import DriverDetails from "./DriverDetails";
import { ShellCard, SectionHeader, StatusPill, ModalShell } from "./UiKit";

interface DriversPageProps {
  data: {
    drivers: Driver[];
    users: User[];
    assignments: DriverAssignment[];
  };
}

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
);

function useIsMobile(breakpointPx = 1024) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return isMobile;
}

const DriversPage: React.FC<DriversPageProps> = ({ data }) => {
  const isMobile = useIsMobile(1024);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [drivers, setDrivers] = useState<Driver[]>(data.drivers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDrivers(data.drivers);
    setLoading(false);
  }, [data.drivers]);

  const [selectedDriver, setSelectedDriver] = useState<(Driver & { user?: User }) | null>(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | "all">("all");

  const driversWithUsers = useMemo(() => {
    return drivers.map((driver) => {
      const user = data.users.find((u) => u.id === driver.user_id);
      return { ...driver, user };
    });
  }, [drivers, data.users]);

  const filteredDrivers = useMemo(() => {
    return driversWithUsers
      .filter((driver) => statusFilter === "all" || driver.employment_status === statusFilter)
      .filter((driver) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const fullName = `${driver.user?.first_name || ""} ${driver.user?.last_name || ""}`.toLowerCase();
        return fullName.includes(q) || driver.license_number.toLowerCase().includes(q);
      });
  }, [driversWithUsers, searchTerm, statusFilter]);

  useEffect(() => {
    if (!selectedDriver && filteredDrivers.length > 0) {
      setSelectedDriver(filteredDrivers[0]);
      return;
    }
    if (selectedDriver && !filteredDrivers.find((d) => d.id === selectedDriver.id)) {
      setSelectedDriver(filteredDrivers.length > 0 ? filteredDrivers[0] : null);
    }
  }, [filteredDrivers, selectedDriver]);

  const handleAddDriver = (
    newDriverData: Omit<Driver, "id" | "created_at" | "updated_at" | "user_id"> & {
      user: Omit<User, "id" | "created_at" | "updated_at" | "role" | "email_verified">;
    }
  ) => {
    const newUserId = Date.now() + 1;
    const newUser: User = {
      ...newDriverData.user,
      id: newUserId,
      role: "driver",
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

    setDrivers((prev) => [newDriver, ...prev]);
    setIsAddDriverModalOpen(false);
    setSelectedDriver({ ...newDriver, user: newUser });
  };

  const getStatusTone = (status: EmploymentStatus) => {
    switch (status) {
      case EmploymentStatus.ACTIVE:
        return "good";
      case EmploymentStatus.ON_LEAVE:
        return "neutral";
      case EmploymentStatus.SUSPENDED:
        return "warn";
      case EmploymentStatus.TERMINATED:
        return "bad";
      default:
        return "neutral";
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as any)?.isContentEditable;

      if (!typing && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (!typing && e.key.toLowerCase() === "n") {
        setIsAddDriverModalOpen(true);
        return;
      }

      if (e.key === "Escape" && isMobile) {
        setSelectedDriver(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile]);

  const assignmentsForSelected = useMemo(() => {
    if (!selectedDriver) return [];
    return data.assignments.filter((a) => a.driver_id === selectedDriver.id);
  }, [data.assignments, selectedDriver]);

  const listPanel = (
    <ShellCard className="flex flex-col p-4">
      <SectionHeader
        title={`Driver Roster (${loading ? "…" : filteredDrivers.length})`}
        subtitle="Manage driver profiles and compliance"
        actions={
          <button
            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition active:scale-95 shrink-0"
            onClick={() => setIsAddDriverModalOpen(true)}
            aria-label="Add new driver"
            title="Add new driver (N)"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative grow">
          <input
            ref={searchRef}
            type="text"
            placeholder='Search name or licence (press "/")'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        <div className="shrink-0">
          <label htmlFor="driverStatusFilter" className="sr-only">
            Driver status filter
          </label>
          <select
            id="driverStatusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmploymentStatus | "all")}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white text-slate-900 pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          >
            <option value="all">All statuses</option>
            {Object.values(EmploymentStatus).map((status) => (
              <option key={status} value={status} className="capitalize">
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
        {loading ? (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver) => {
            const isSelected = selectedDriver?.id === driver.id;
            return (
              <button
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition active:scale-[0.99] ${
                  isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {driver.user?.first_name} {driver.user?.last_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{driver.license_number}</p>
                  </div>
                  <StatusPill
                    label={driver.employment_status.replace(/_/g, " ")}
                    tone={getStatusTone(driver.employment_status) as any}
                  />
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p>No drivers found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>
          </div>
        )}
      </div>
    </ShellCard>
  );

  const detailsPanel = (
    <div className="flex flex-col">
      {selectedDriver ? (
        <DriverDetails driver={selectedDriver} assignments={assignmentsForSelected} />
      ) : (
        <EmptyState
          icon={<IllustrationTruckIcon />}
          title={drivers.length > 0 ? "Select a Driver" : "No Drivers in System"}
          message={
            drivers.length > 0
              ? "Choose a driver from the list to view their details, compliance status, and history."
              : "Get started by adding your first driver to the system."
          }
        />
      )}
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {listPanel}

        {!isMobile && detailsPanel}
      </div>

      {isMobile && selectedDriver && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedDriver(null)}
          title={`${selectedDriver.user?.first_name || ""} ${selectedDriver.user?.last_name || ""}`.trim() || "Driver details"}
          description="Driver profile and assignments"
          maxWidthClass="max-w-3xl"
          footer={
            <div className="flex justify-end">
              <button
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition"
                onClick={() => setSelectedDriver(null)}
                type="button"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">{detailsPanel}</div>
        </ModalShell>
      )}

      {isAddDriverModalOpen && (
        <AddDriverModal onClose={() => setIsAddDriverModalOpen(false)} onAddDriver={handleAddDriver} />
      )}
    </>
  );
};

export default DriversPage;
