import React from "react";
import { View } from "../App";
import { ChevronRightIcon } from "./icons";

type BreadcrumbItem = {
  label: string;
  view?: View;
};

type BreadcrumbsProps = {
  activeView: View;
  onNavigate: (view: View) => void;
};

const breadcrumbMap: Record<View, BreadcrumbItem[]> = {
  dashboard: [{ label: "Overview", view: "dashboard" }],
  fleet: [
    { label: "Operations", view: "fleet" },
    { label: "Fleet", view: "fleet" },
  ],
  bookings: [
    { label: "Operations", view: "fleet" },
    { label: "Bookings", view: "bookings" },
  ],
  drivers: [
    { label: "Operations", view: "fleet" },
    { label: "Drivers", view: "drivers" },
  ],
  routes: [
    { label: "Operations", view: "fleet" },
    { label: "Routes", view: "routes" },
  ],
  leads: [
    { label: "CRM", view: "leads" },
    { label: "Leads", view: "leads" },
  ],
  "lead-finder": [
    { label: "CRM", view: "leads" },
    { label: "Lead Finder", view: "lead-finder" },
  ],
  customers: [
    { label: "CRM", view: "leads" },
    { label: "Customers", view: "customers" },
  ],
  marketing: [
    { label: "Marketing", view: "marketing" },
    { label: "Campaigns", view: "marketing" },
  ],
  campaigns: [
    { label: "Marketing", view: "marketing" },
    { label: "Sequences", view: "campaigns" },
  ],
  "new-campaign": [
    { label: "Marketing", view: "marketing" },
    { label: "Sequences", view: "campaigns" },
    { label: "Create sequence", view: "new-campaign" },
  ],
  analytics: [
    { label: "Marketing", view: "marketing" },
    { label: "Performance analytics", view: "analytics" },
  ],
  financials: [
    { label: "Finance", view: "financials" },
    { label: "Financials", view: "financials" },
  ],
  reports: [
    { label: "Finance", view: "financials" },
    { label: "Reports", view: "reports" },
  ],
  settings: [
    { label: "Admin", view: "settings" },
    { label: "Settings", view: "settings" },
  ],
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ activeView, onNavigate }) => {
  const trail = (breadcrumbMap[activeView] ?? breadcrumbMap.dashboard).map(
    (item, idx, arr) => ({
      ...item,
      isCurrent: idx === arr.length - 1,
    })
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-[13px] text-foreground-muted sm:text-sm"
    >
      {trail.map((item, idx) => (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && (
            <ChevronRightIcon className="h-3.5 w-3.5 text-border" aria-hidden />
          )}
          {item.isCurrent || !item.view ? (
            <span
              className={`truncate ${item.isCurrent ? "font-semibold text-foreground" : ""}`}
            >
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(item.view!)}
              className="inline-flex items-center rounded-md px-2 py-1 text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
