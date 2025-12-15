import React from "react";
import * as Lucide from "lucide-react";

export type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const LUCIDE_NAME_OVERRIDES: Record<string, string> = {
  CloseIcon: "X",
  DocumentTextIcon: "FileText",
  BarChartIcon: "BarChart2",
  CampaignIcon: "Megaphone",
  WorkflowIcon: "Layers",
  AnalyticsIcon: "Activity",
  ChartPieIcon: "PieChart",
  CurrencyDollarIcon: "DollarSign",
  CalendarDaysIcon: "Calendar",
  PencilSquareIcon: "Edit2",
  TrashIcon: "Trash2",
  MapIcon: "MapPin",
  GridIcon: "Grid",
  DriverIcon: "User",
  UserCircleIcon: "User",
  EnvelopeIcon: "Mail",
  SparklesIcon: "Sparkles",
  PlayIcon: "Play",
  PauseIcon: "Pause",
  DuplicateIcon: "Copy",
  UploadIcon: "Upload",
  DownloadIcon: "Download",
  PhoneIcon: "Phone",
  MegaphoneIcon: "Megaphone",
  ShieldExclamationIcon: "ShieldAlert",
};

type IconLike = React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;

function makeIcon(name: string): IconLike {
  const lucideName = LUCIDE_NAME_OVERRIDES[name] || name.replace(/Icon$/, "");
  const C = (Lucide as any)[lucideName];
  if (typeof C === "function") return (props) => <C {...props} />;
  return (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden="true" focusable="false" {...props}>
      <circle cx={12} cy={12} r={8} />
    </svg>
  );
}

// Canonical set of exported icons (single definitions)
export const MenuIcon = makeIcon("MenuIcon");
export const CloseIcon = makeIcon("CloseIcon");
export const ChevronLeftIcon = makeIcon("ChevronLeftIcon");
export const ChevronRightIcon = makeIcon("ChevronRightIcon");
export const SearchIcon = makeIcon("SearchIcon");
export const PlusIcon = makeIcon("PlusIcon");
export const TrashIcon = makeIcon("TrashIcon");
export const WrenchIcon = makeIcon("WrenchIcon");
export const CheckCircleIcon = makeIcon("CheckCircleIcon");
export const ExclamationTriangleIcon = makeIcon("ExclamationTriangleIcon");
export const ArrowPathIcon = makeIcon("ArrowPathIcon");
export const TagIcon = makeIcon("TagIcon");
export const DownloadIcon = makeIcon("DownloadIcon");
export const TrendingUpIcon = makeIcon("TrendingUpIcon");
export const TrendingDownIcon = makeIcon("TrendingDownIcon");
export const ChartPieIcon = makeIcon("ChartPieIcon");
export const CreditCardIcon = makeIcon("CreditCardIcon");
export const CurrencyDollarIcon = makeIcon("CurrencyDollarIcon");
export const CampaignIcon = makeIcon("CampaignIcon");
export const MegaphoneIcon = makeIcon("MegaphoneIcon");
export const WorkflowIcon = makeIcon("WorkflowIcon");
export const AnalyticsIcon = makeIcon("AnalyticsIcon");
export const BarChartIcon = makeIcon("BarChartIcon");
export const BanknotesIcon = makeIcon("BanknotesIcon");
export const BriefcaseIcon = makeIcon("BriefcaseIcon");
export const CalculatorIcon = makeIcon("CalculatorIcon");
export const PhoneIcon = makeIcon("PhoneIcon");
export const EnvelopeIcon = makeIcon("EnvelopeIcon");
export const UserCircleIcon = makeIcon("UserCircleIcon");
export const InfoIcon = makeIcon("InfoIcon");
export const CalendarDaysIcon = makeIcon("CalendarDaysIcon");
export const ClockIcon = makeIcon("ClockIcon");
export const PencilSquareIcon = makeIcon("PencilSquareIcon");
export const StarIcon = makeIcon("StarIcon");
export const LockIcon = makeIcon("LockIcon");
export const ShieldExclamationIcon = makeIcon("ShieldExclamationIcon");
export const GlobeIcon = makeIcon("GlobeIcon");
export const BuildingOfficeIcon = makeIcon("BuildingOfficeIcon");
export const CogIcon = makeIcon("CogIcon");
export const GaugeIcon = makeIcon("GaugeIcon");
export const RoadIcon = makeIcon("RoadIcon");
export const FuelIcon = makeIcon("FuelIcon");
export const ShieldCheckIcon = makeIcon("ShieldCheckIcon");
export const ClipboardDocumentIcon = makeIcon("ClipboardDocumentIcon");
export const TicketIcon = makeIcon("TicketIcon");
export const DocumentDuplicateIcon = makeIcon("DocumentDuplicateIcon");
export const DocumentTextIcon = makeIcon("DocumentTextIcon");
export const UploadIcon = makeIcon("UploadIcon");
export const MapIcon = makeIcon("MapIcon");
export const PlayIcon = makeIcon("PlayIcon");
export const PauseIcon = makeIcon("PauseIcon");
export const DuplicateIcon = makeIcon("DuplicateIcon");
export const MapPinIcon = makeIcon("MapPinIcon");
export const SendIcon = makeIcon("SendIcon");
export const TruckIcon = makeIcon("TruckIcon");

export default {} as Record<string, unknown>;
