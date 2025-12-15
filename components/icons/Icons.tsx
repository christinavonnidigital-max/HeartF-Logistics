import React from "react";
import {
  X,
  Menu,
  LayoutGrid,
  Truck,
  FileText,
  User,
  Users,
  Map,
  BarChart3,
  Megaphone,
  Workflow,
  LineChart,
  CreditCard,
  Settings,
  Search,
  Plus,
  Calendar,
  Sparkles,
  Play,
  Pause,
  Copy,
  Trash2,
  Mail,
  Tag,
  RefreshCw,
  Upload,
  Briefcase,
  Phone,
  Globe,
  Building2,
  Clipboard,
  Fuel,
  Gauge,
  DollarSign,
  Banknote,
  Calculator,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Download,
  Cog,
  Ticket,
  Info,
  Star,
  MapPin,
  Send,
  Clock,
  UserPlus,
  Lock,
} from "lucide-react";

type IconProps = { className?: string };

const i = (Icon: React.ComponentType<any>) => {
  const Wrapped = ({ className }: IconProps) => (
    // @ts-ignore - lucide uses its own typing; keep a simple wrapper
    <Icon className={className} aria-hidden="true" />
  );
  return Wrapped;
};

// Navigation + common
export const CloseIcon = i(X);
export const MenuIcon = i(Menu);
export const GridIcon = i(LayoutGrid);
export const TruckIcon = i(Truck);
export const DocumentTextIcon = i(FileText);
export const DriverIcon = i(User);
export const UsersIcon = i(Users);
export const MapIcon = i(Map);
export const BarChartIcon = i(BarChart3);
export const CampaignIcon = i(Megaphone);
export const MegaphoneIcon = i(Megaphone);
export const WorkflowIcon = i(Workflow);
export const AnalyticsIcon = i(LineChart);
export const CreditCardIcon = i(CreditCard);
export const SettingsIcon = i(Settings);

// UI actions
export const SearchIcon = i(Search);
export const PlusIcon = i(Plus);
export const CalendarDaysIcon = i(Calendar);
export const SparklesIcon = i(Sparkles);
export const PlayIcon = i(Play);
export const PauseIcon = i(Pause);
export const DuplicateIcon = i(Copy);
export const DocumentDuplicateIcon = i(Copy);
export const TrashIcon = i(Trash2);
export const EnvelopeIcon = i(Mail);
export const TagIcon = i(Tag);
export const ArrowPathIcon = i(RefreshCw);
export const UploadIcon = i(Upload);

// Forms + entities
export const BriefcaseIcon = i(Briefcase);
export const PhoneIcon = i(Phone);
export const GlobeIcon = i(Globe);
export const BuildingOfficeIcon = i(Building2);
export const ClipboardDocumentIcon = i(Clipboard);
export const FuelIcon = i(Fuel);
export const GaugeIcon = i(Gauge);
export const CurrencyDollarIcon = i(DollarSign);
export const BanknotesIcon = i(Banknote);
export const CalculatorIcon = i(Calculator);
export const PencilSquareIcon = i(Pencil);
export const CheckCircleIcon = i(CheckCircle2);
export const ExclamationTriangleIcon = i(AlertTriangle);
export const TrendingUpIcon = i(TrendingUp);
export const WrenchIcon = i(Wrench);
export const ChevronLeftIcon = i(ChevronLeft);
export const ChevronRightIcon = i(ChevronRight);
export const ShieldCheckIcon = i(ShieldCheck);
export const DownloadIcon = i(Download);
export const CogIcon = i(Cog);
export const TicketIcon = i(Ticket);
export const InfoIcon = i(Info);
export const StarIcon = i(Star);

// utility icons not in first set
export const ClockIcon = i(Clock);
export const UserPlusIcon = i(UserPlus);
export const LockIcon = i(Lock);
export const ShieldExclamationIcon = i(AlertTriangle);

// Routes + assistant
export const RoadIcon = i(Map);
export const MapPinIcon = i(MapPin);
export const SendIcon = i(Send);

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