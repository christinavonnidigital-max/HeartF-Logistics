import React, { useEffect, useMemo, useRef, useState } from "react";
import { Driver, User, DriverAssignment, EmploymentStatus } from "../types";
import { PlusIcon, SearchIcon, DownloadIcon, StarIcon } from "./icons";
import EmptyState from "./EmptyState";
import AddDriverModal from "./AddDriverModal";
import DriverDetails from "./DriverDetails";
import { ModalShell, StatusPill, Button } from "./UiKit";
import { downloadCsv } from "../dataIO/toCsv";
import { useData } from "../contexts/DataContext";
import { mockUsersForDrivers } from "../data/mockDriversData";

interface DriversPageProps {
  data: {
    drivers: Driver[];
    users: User[];
    assignments: DriverAssignment[];
  };
}

type DriverFilter = "all" | "on_duty" | "off_duty" | "on_leave";
type DriverWithUser = Driver & { user?: User };

const toTitle = (v: string) =>
  String(v)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getFullName = (user?: User) =>
  `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

function useIsMobile(breakpointPx = 1024) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => setIsMobile(mq.matches);
    update();

    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return isMobile;
}

const renderStars = (rating: number) => {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${rating.toFixed(1)}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-3.5 w-3.5 ${i < rounded ? "text-amber-500" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
};

const classifyDriver = (driver: Driver): Exclude<DriverFilter, "all"> => {
  if (driver.employment_status === EmploymentStatus.ON_LEAVE) return "on_leave";
  if (driver.employment_status === EmploymentStatus.ACTIVE) return "on_duty";
  return "off_duty";
};

const dutyStatusMeta = (status: Exclude<DriverFilter, "all">) => {
  if (status === "on_duty") return { label: "On Duty", tone: "success" as const };
  if (status === "on_leave") return { label: "On Leave", tone: "warn" as const };
  return { label: "Off Duty", tone: "neutral" as const };
};

const DriversPage: React.FC<DriversPageProps> = ({ data }) => {
  const { addUser, addDriver, updateUser, updateDriver } = useData();
  const isMobile = useIsMobile(1024);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [drivers, setDrivers] = useState<Driver[]>(data.drivers);
  const [users, setUsers] = useState<User[]>(data.users);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithUser | null>(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [driverFilter, setDriverFilter] = useState<DriverFilter>("all");

  useEffect(() => {
    setDrivers(data.drivers);
  }, [data.drivers]);

  useEffect(() => {
    setUsers(data.users);
  }, [data.users]);

  const driversWithUsers = useMemo<DriverWithUser[]>(() => {
    const usersById = new Map<string, User>();
    (mockUsersForDrivers || []).forEach((u) => usersById.set(String(u.id), u));
    users.forEach((u) => usersById.set(String(u.id), u));

    return drivers.map((driver) => {
      const user = usersById.get(String(driver.user_id));
      return { ...driver, user };
    });
  }, [drivers, users]);

  const latestAssignmentByDriver = useMemo(() => {
    const map = new Map<number, DriverAssignment>();
    const sorted = [...(data.assignments || [])].sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    );

    sorted.forEach((assignment) => {
      if (!map.has(assignment.driver_id)) {
        map.set(assignment.driver_id, assignment);
      }
    });

    return map;
  }, [data.assignments]);

  const filteredDrivers = useMemo(() => {
    let list = driversWithUsers;

    if (driverFilter !== "all") {
      list = list.filter((driver) => classifyDriver(driver) === driverFilter);
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((driver) => {
      const fullName = getFullName(driver.user).toLowerCase();
      const latestAssignment = latestAssignmentByDriver.get(driver.id);

      return (
        fullName.includes(q) ||
        String(driver.license_number || "").toLowerCase().includes(q) ||
        String(driver.user?.email || "").toLowerCase().includes(q) ||
        String(driver.user?.phone || "").toLowerCase().includes(q) ||
        `emp-${driver.id}`.includes(q) ||
        String(latestAssignment?.vehicle_id || "").includes(q)
      );
    });
  }, [driversWithUsers, searchTerm, driverFilter, latestAssignmentByDriver]);

  useEffect(() => {
    if (!selectedDriver && filteredDrivers.length > 0) {
      setSelectedDriver(filteredDrivers[0]);
      return;
    }

    if (selectedDriver && !filteredDrivers.find((d) => d.id === selectedDriver.id)) {
      setSelectedDriver(filteredDrivers.length > 0 ? filteredDrivers[0] : null);
    }
  }, [filteredDrivers, selectedDriver]);

  const handleAddDriver = async (
    newDriverData: Omit<Driver, "id" | "created_at" | "updated_at" | "user_id"> & {
      user: Omit<User, "id" | "created_at" | "updated_at" | "role" | "email_verified">;
    }
  ) => {
    const now = new Date().toISOString();

    const createdUser = await addUser({
      ...newDriverData.user,
      role: "driver",
      email_verified: true,
      created_at: now,
      updated_at: now,
    });

    const createdDriver = await addDriver({
      ...newDriverData,
      user_id: createdUser.id as number | string,
    });

    setUsers((prev) => (prev.some((u) => String(u.id) === String(createdUser.id)) ? prev : [createdUser, ...prev]));
    setDrivers((prev) => (prev.some((d) => d.id === createdDriver.id) ? prev : [createdDriver, ...prev]));
    setIsAddDriverModalOpen(false);
    setSelectedDriver({ ...createdDriver, user: createdUser });
  };

  const handleSaveDriverProfile = (updatedDriver: Driver, updatedUser: User) => {
    setDrivers((prev) => prev.map((d) => (d.id === updatedDriver.id ? { ...d, ...updatedDriver } : d)));

    setUsers((prev) => {
      const exists = prev.some((u) => String(u.id) === String(updatedUser.id));
      if (!exists) return [updatedUser, ...prev];
      return prev.map((u) => (String(u.id) === String(updatedUser.id) ? { ...u, ...updatedUser } : u));
    });

    setSelectedDriver({ ...updatedDriver, user: updatedUser });
    void updateDriver(updatedDriver);
    void updateUser(updatedUser);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable;

      if (!typing && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (!typing && e.key.toLowerCase() === "n") {
        setIsAddDriverModalOpen(true);
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

  const totalDrivers = driversWithUsers.length;
  const currentlyActive = driversWithUsers.filter(
    (d) => d.employment_status === EmploymentStatus.ACTIVE
  ).length;

  const avgRating =
    driversWithUsers.length > 0
      ? driversWithUsers.reduce((sum, d) => sum + Number(d.rating || 0), 0) / driversWithUsers.length
      : 0;

  const pendingRenewals = driversWithUsers.filter((d) => {
    const exp = new Date(d.license_expiry_date).getTime();
    if (Number.isNaN(exp)) return false;
    return exp - Date.now() <= 1000 * 60 * 60 * 24 * 45;
  }).length;

  const onDutyCount = driversWithUsers.filter((d) => classifyDriver(d) === "on_duty").length;
  const offDutyCount = driversWithUsers.filter((d) => classifyDriver(d) === "off_duty").length;
  const onLeaveCount = driversWithUsers.filter((d) => classifyDriver(d) === "on_leave").length;

  const filterTabs: Array<{ key: DriverFilter; label: string; count: number }> = [
    { key: "all", label: "All Drivers", count: totalDrivers },
    { key: "on_duty", label: "On Duty", count: onDutyCount },
    { key: "off_duty", label: "Off Duty", count: offDutyCount },
    { key: "on_leave", label: "On Leave", count: onLeaveCount },
  ];

  const exportRows = filteredDrivers.map((driver) => {
    const latestAssignment = latestAssignmentByDriver.get(driver.id);
    const fullName = getFullName(driver.user) || `Driver #${driver.id}`;
    const duty = dutyStatusMeta(classifyDriver(driver));

    return {
      driver: fullName,
      employee_id: `EMP-${driver.id}`,
      status: duty.label,
      phone: driver.user?.phone || "",
      email: driver.user?.email || "",
      assigned_vehicle: latestAssignment?.vehicle_id ? `Vehicle #${latestAssignment.vehicle_id}` : "Unassigned",
      compliance: `${driver.license_type} (exp ${formatDate(driver.license_expiry_date)})`,
      rating: Number(driver.rating || 0).toFixed(1),
    };
  });

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Driver Management</h1>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[380px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, employee ID, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <Button variant="primary" onClick={() => setIsAddDriverModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add New Driver
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Total Drivers</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{totalDrivers}</p>
          <p className="mt-2 text-xs text-emerald-700">+2.4% this month</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Currently Active</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{currentlyActive}</p>
          <p className="mt-2 text-xs text-slate-500">
            {totalDrivers > 0 ? Math.round((currentlyActive / totalDrivers) * 100) : 0}% of roster
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Avg Performance Score</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">
            {avgRating.toFixed(1)} <span className="text-lg text-slate-500">/ 5.0</span>
          </p>
          <div className="mt-2 text-sm">{renderStars(avgRating)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">License Renewals Pending</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{pendingRenewals}</p>
          <p className={`mt-2 text-xs ${pendingRenewals > 0 ? "text-rose-600" : "text-slate-500"}`}>
            {pendingRenewals > 0 ? "Urgent" : "No urgent renewals"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDriverFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  driverFilter === tab.key
                    ? "bg-orange-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    driverFilter === tab.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Advanced Filters
            </button>

            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  exportRows as any,
                  [
                    { key: "driver", header: "Driver" },
                    { key: "employee_id", header: "Employee ID" },
                    { key: "status", header: "Status" },
                    { key: "phone", header: "Phone" },
                    { key: "email", header: "Email" },
                    { key: "assigned_vehicle", header: "Assigned Vehicle" },
                    { key: "compliance", header: "Compliance" },
                    { key: "rating", header: "Rating" },
                  ] as any,
                  "drivers"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Assigned Vehicle</th>
                <th className="px-5 py-3 font-medium">Compliance</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No drivers found.
                  </td>
                </tr>
              )}

              {filteredDrivers.map((driver) => {
                const isSelected = selectedDriver?.id === driver.id;
                const latestAssignment = latestAssignmentByDriver.get(driver.id);
                const duty = dutyStatusMeta(classifyDriver(driver));

                const expDate = new Date(driver.license_expiry_date);
                const expDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                const expLabel = Number.isNaN(expDate.getTime())
                  ? "No expiry"
                  : expDays < 0
                  ? `Expired ${Math.abs(expDays)}d ago`
                  : expDays <= 45
                  ? "Expiring soon"
                  : `Exp: ${formatDate(driver.license_expiry_date)}`;

                const rating = Number(driver.rating || 0);
                const fullName = getFullName(driver.user) || `Driver #${driver.id}`;

                return (
                  <tr
                    key={driver.id}
                    className={`border-t border-slate-200 text-slate-800 transition ${
                      isSelected ? "bg-orange-50/50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <button type="button" className="text-left" onClick={() => setSelectedDriver(driver)}>
                        <p className="text-base font-semibold leading-tight text-slate-900">{fullName}</p>
                        <p className="text-sm text-slate-500">ID: EMP-{driver.id}</p>
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill label={duty.label} tone={duty.tone} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{driver.user?.phone || "N/A"}</p>
                      <p className="text-xs text-slate-500">{driver.user?.email || "-"}</p>
                    </td>

                    <td className="px-5 py-4">
                      {latestAssignment?.vehicle_id ? (
                        <span className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
                          Vehicle #{latestAssignment.vehicle_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{driver.license_type}</p>
                      <p className={`text-xs ${expDays <= 45 ? "text-rose-600" : "text-slate-500"}`}>{expLabel}</p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {renderStars(rating)}
                        <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedDriver(driver)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
          <p>
            Showing <span className="font-semibold text-slate-900">{filteredDrivers.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalDrivers}</span> drivers
          </p>

          <div className="hidden sm:flex items-center gap-2">
            <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-500" disabled>
              Previous
            </button>
            <button className="rounded-xl bg-slate-900 px-3 py-1.5 text-white">Next</button>
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="mt-6">
          {selectedDriver ? (
            <DriverDetails
              driver={selectedDriver}
              assignments={assignmentsForSelected}
              onSaveProfile={handleSaveDriverProfile}
            />
          ) : (
            <EmptyState
              title={drivers.length > 0 ? "Select a Driver" : "No Drivers in System"}
              message={
                drivers.length > 0
                  ? "Choose a driver from the list to view profile analytics and compliance details."
                  : "Get started by adding your first driver."
              }
            />
          )}
        </div>
      )}

      {isMobile && selectedDriver && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedDriver(null)}
          title={getFullName(selectedDriver.user) || "Driver details"}
          description="Driver profile analytics and assignments"
          maxWidthClass="max-w-3xl"
          footer={
            <div className="flex justify-end">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50"
                onClick={() => setSelectedDriver(null)}
                type="button"
              >
                Close
              </button>
            </div>
          }
        >
          <DriverDetails
            driver={selectedDriver}
            assignments={assignmentsForSelected}
            onSaveProfile={handleSaveDriverProfile}
          />
        </ModalShell>
      )}

      {isAddDriverModalOpen && (
        <AddDriverModal onClose={() => setIsAddDriverModalOpen(false)} onAddDriver={handleAddDriver} />
      )}
    </>
  );
};

export default DriversPage;
