import React from "react";
import {
  X,
  Menu,
  LayoutGrid,
  Search,
  Plus,
  Trash2,
  Upload,
  Copy,
  Tag,
  RefreshCw,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Send,
  Truck,
  MapPin,
  Map,
  Calendar,
  FileText,
  Users,
  User,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  Gauge,
  Wrench,
  ShieldCheck,
  Star,
  Calculator,
  Banknote,
  BarChart3,
  Megaphone,
  Workflow,
  LineChart,
  Settings,
  UserPlus,
  ShieldAlert,
} from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

const wrap =
  (Comp: React.ComponentType<any>) =>
  ({ title, ...props }: IconProps) =>
    (
      <Comp
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        {...props}
      >
        {title ? <title>{title}</title> : null}
      </Comp>
    );

// Core UI
export const CloseIcon = wrap(X);
export const MenuIcon = wrap(Menu);

// Common actions
export const SearchIcon = wrap(Search);
export const PlusIcon = wrap(Plus);
export const TrashIcon = wrap(Trash2);
export const UploadIcon = wrap(Upload);
export const DuplicateIcon = wrap(Copy);
export const DocumentDuplicateIcon = wrap(Copy);
export const ArrowPathIcon = wrap(RefreshCw);
export const RefreshIcon = wrap(RefreshCw);

// Status / alerts
export const ExclamationTriangleIcon = wrap(AlertTriangle);
export const InfoIcon = wrap(Info);
export const ClockIcon = wrap(Clock);
export const CheckCircleIcon = wrap(CheckCircle2);

// Navigation / entities
export const TruckIcon = wrap(Truck);
export const MapPinIcon = wrap(MapPin);
export const RoadIcon = wrap(Map);
export const CalendarDaysIcon = wrap(Calendar);
export const DocumentTextIcon = wrap(FileText);
export const UsersIcon = wrap(Users);
export const UserCircleIcon = wrap(User);
export const BriefcaseIcon = wrap(Briefcase);
export const GridIcon = wrap(LayoutGrid);
export const DriverIcon = wrap(User);
export const MapIcon = wrap(Map);
export const BarChartIcon = wrap(BarChart3);
export const MegaphoneIcon = wrap(Megaphone);
export const WorkflowIcon = wrap(Workflow);
export const AnalyticsIcon = wrap(LineChart);
export const SettingsIcon = wrap(Settings);

// Contact / org
export const EnvelopeIcon = wrap(Mail);
export const PhoneIcon = wrap(Phone);
export const GlobeIcon = wrap(Globe);
export const BuildingOfficeIcon = wrap(Building2);

// Finance
export const CreditCardIcon = wrap(CreditCard);
export const CurrencyDollarIcon = wrap(DollarSign);
export const BanknotesIcon = wrap(Banknote);
export const TrendingUpIcon = wrap(TrendingUp);
export const CalculatorIcon = wrap(Calculator);

// Fleet detail icons
export const GaugeIcon = wrap(Gauge);
export const WrenchIcon = wrap(Wrench);
export const FuelIcon = wrap(CreditCard);
export const CogIcon = wrap(Wrench);
export const ShieldCheckIcon = wrap(ShieldCheck);
export const TicketIcon = wrap(Tag);
export const ClipboardDocumentIcon = wrap(FileText);
export const PencilSquareIcon = wrap(Pencil);

// Pagination / misc
export const ChevronLeftIcon = wrap(ChevronLeft);
export const ChevronRightIcon = wrap(ChevronRight);
export const ChevronDownIcon = wrap(ChevronDown);

// Marketing
export const CampaignIcon = wrap(Mail);
export const SparklesIcon = wrap(TrendingUp);
export const PlayIcon = wrap(Play);
export const PauseIcon = wrap(Pause);
export const SendIcon = wrap(Send);
export const TagIcon = wrap(Tag);

// utility icons not in first set
export const UserPlusIcon = wrap(UserPlus);
export const LockIcon = wrap(ShieldAlert);
export const ShieldExclamationIcon = wrap(AlertTriangle);




// Keep your custom icons as-is (these are not in Lucide)
export const BoxTruckIconBold = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
    <rect x="2" y="6" width="12" height="9" rx="1.5" />
    <path d="M14 8h5.5l1.5 3v4h-7V8z" />
    <path d="M15 9h3.5l0.5 1h-4V9z" fillOpacity="0.3" />
    <rect x="7.5" y="6" width="0.5" height="9" fillOpacity="0.25" />
    <rect x="2" y="15" width="19" height="1.5" rx="0.5" />
    <circle cx="6" cy="18.5" r="2.5" />
    <circle cx="6" cy="18.5" r="1.2" fill="white" fillOpacity="0.3" />
    <circle cx="16.5" cy="18.5" r="2.5" />
    <circle cx="16.5" cy="18.5" r="1.2" fill="white" fillOpacity="0.3" />
    <circle cx="20" cy="12" r="0.7" fillOpacity="0.5" />
  </svg>
);

export const IllustrationTruckIcon = (props: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    className={props.className}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x={6} y={30} width={28} height={12} rx={3} />
    <path d="M34 34h8l7 6v8H49" />
    <circle cx={18} cy={46} r={3.5} fill="currentColor" />
    <circle cx={46} cy={46} r={3.5} fill="currentColor" />
    <path d="M6 46h4" />
    <path d="M26 46h7" />
    <path d="M6 30v-5h18" />
    <path d="M40 24h6l6 6" />
    <path d="M10 22c4-7 10-10 18-10 7 0 12 2 17 7" />
  </svg>
);

export const IllustrationMapIcon = (props: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    className={props.className}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 16l16-6 12 6 16-6v34l-16 6-12-6-16 6V16z" />
    <path d="M26 10v34" />
    <path d="M38 16v34" />
    <path d="M32 20a6 6 0 0 1 6 6c0 4-3.5 8.5-6 11-2.5-2.5-6-7-6-11a6 6 0 0 1 6-6z" />
    <circle cx={32} cy={26} r={2} />
  </svg>
);
  export default {} as Record<string, any>;