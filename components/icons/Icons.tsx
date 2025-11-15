import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

type IconBaseProps = IconProps & {
  children?: React.ReactNode;
};

const IconBase = ({ className, children, ...props }: IconBaseProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

// Basic UI icons

export const MenuIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h12" />
  </IconBase>
);

export const CloseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </IconBase>
);

export const SearchIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={11} cy={11} r={5} />
    <path d="M15.5 15.5L19 19" />
  </IconBase>
);

export const PlusIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export const TrashIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 7h14" />
    <path d="M10 4h4" />
    <path d="M9 7l.5 10" />
    <path d="M15 7l-.5 10" />
    <path d="M7 7l1 11a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7" />
  </IconBase>
);

export const WrenchIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M15.5 5.5a4 4 0 0 0-4.9 4.9l-4.6 4.6a1.4 1.4 0 0 0 2 2l4.6-4.6a4 4 0 0 0 4.9-4.9l-2.2 2.2-2-2 2.2-2.2z" />
  </IconBase>
);

export const CheckCircleIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={9} />
    <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
  </IconBase>
);

export const ExclamationTriangleIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4l8 14H4l8-14z" />
    <path d="M12 10v4" />
    <circle cx={12} cy={16.5} r={0.6} fill="currentColor" stroke="none" />
  </IconBase>
);

// Navigation / section icons

export const GridIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={4} y={4} width={6} height={6} rx={1.2} />
    <rect x={14} y={4} width={6} height={6} rx={1.2} />
    <rect x={4} y={14} width={6} height={6} rx={1.2} />
    <rect x={14} y={14} width={6} height={6} rx={1.2} />
  </IconBase>
);

export const TruckIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={3} y={9} width={10} height={5} rx={1} />
    <path d="M13 11h3.5L20 13.5V16" />
    <circle cx={7} cy={17} r={1.7} fill="currentColor" />
    <circle cx={17} cy={17} r={1.7} fill="currentColor" />
    <path d="M3 17h2" />
    <path d="M9 17h6" />
    <path d="M3 9V7h8" />
  </IconBase>
);

export const DriverIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={8} r={3} />
    <path d="M6.5 18.5a5.5 5.5 0 0 1 11 0" />
    <circle cx={12} cy={15} r={4.5} fill="none" />
  </IconBase>
);

export const UsersIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={9} cy={9} r={2.6} />
    <circle cx={15} cy={10} r={2.3} />
    <path d="M4.5 18a4.8 4.8 0 0 1 9-2" />
    <path d="M13 18h6" />
  </IconBase>
);

export const BriefcaseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={4} y={8} width={16} height={10} rx={1.8} />
    <path d="M10 8V6.5A1.5 1.5 0 0 1 11.5 5h1A1.5 1.5 0 0 1 14 6.5V8" />
    <path d="M4 12h16" />
    <path d="M11 12h2" />
  </IconBase>
);

export const DocumentTextIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 4h7l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M14 4v4h4" />
    <path d="M9 12h6" />
    <path d="M9 15h4" />
  </IconBase>
);

export const MapIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 5l-4 2v12l4-2 6 2 4-2V5l-4 2-6-2z" />
    <path d="M9 7v10" />
    <path d="M15 7v10" />
  </IconBase>
);

export const BarChartIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 19h14" />
    <rect x={6} y={10} width={3} height={6} rx={0.8} />
    <rect x={11} y={7} width={3} height={9} rx={0.8} />
    <rect x={16} y={4} width={3} height={12} rx={0.8} />
  </IconBase>
);

export const CampaignIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 11v3a2 2 0 0 0 2 2h2" />
    <path d="M10 7v8" />
    <path d="M10 8l6-2.5v10L10 13" />
    <circle cx={17} cy={10} r={1} fill="currentColor" stroke="none" />
  </IconBase>
);

export const ChartPieIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4a8 8 0 1 1-6.36 3.18" />
    <path d="M12 4v8l5.2 3" />
  </IconBase>
);

export const SettingsIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={3} />
    <path d="M4 12h2" />
    <path d="M18 12h2" />
    <path d="M12 4v2" />
    <path d="M12 18v2" />
    <path d="M6.2 6.2l1.4 1.4" />
    <path d="M16.4 16.4l1.4 1.4" />
    <path d="M17.8 6.2l-1.4 1.4" />
    <path d="M7.6 16.4l-1.4 1.4" />
  </IconBase>
);

// Finance icons

export const CreditCardIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={3} y={6} width={18} height={12} rx={2} />
    <path d="M3 10h18" />
    <path d="M7 14h3" />
    <path d="M12 14h2" />
  </IconBase>
);

export const CurrencyDollarIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4v16" />
    <path d="M9 8.5A2.5 2.5 0 0 1 12 6h1a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h1a2.5 2.5 0 0 0 3-2.5" />
  </IconBase>
);

// CRM icons

export const PhoneIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 4h3l1.2 3.5-2 1.3a12 12 0 0 0 5 5l1.3-2L19 14v3a2 2 0 0 1-2.2 2 13 13 0 0 1-9.8-9.8A2 2 0 0 1 7 4z" />
  </IconBase>
);

export const EnvelopeIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={3} y={5} width={18} height={14} rx={2} />
    <path d="M4 7l8 6 8-6" />
  </IconBase>
);

export const UserCircleIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={9} />
    <circle cx={12} cy={10} r={3} />
    <path d="M7 17.5a5.5 5.5 0 0 1 10 0" />
  </IconBase>
);

export const InfoIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={9} />
    <path d="M12 10v6" />
    <circle cx={12} cy={7} r={0.8} fill="currentColor" stroke="none" />
  </IconBase>
);

export const CalendarDaysIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={4} y={5} width={16} height={15} rx={2} />
    <path d="M9 3v4" />
    <path d="M15 3v4" />
    <path d="M4 10h16" />
    <path d="M8 14h2" />
    <path d="M12 14h2" />
    <path d="M16 14h2" />
  </IconBase>
);

export const ClockIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={8.5} />
    <path d="M12 8v4l3 2" />
  </IconBase>
);

export const PencilSquareIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={4} y={4} width={12} height={12} rx={2} />
    <path d="M9 15l7-7a1.8 1.8 0 0 0-2.5-2.5L6.5 13.5 6 16l2.5-.5z" />
  </IconBase>
);

// Fleet specific

export const CogIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx={12} cy={12} r={2.7} />
    <path d="M12 5V3" />
    <path d="M12 21v-2" />
    <path d="M5 12H3" />
    <path d="M21 12h-2" />
    <path d="M6.8 6.8L5.4 5.4" />
    <path d="M18.6 18.6l-1.4-1.4" />
    <path d="M17.2 6.8l1.4-1.4" />
    <path d="M5.4 18.6l1.4-1.4" />
  </IconBase>
);

export const GaugeIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 16a7 7 0 0 1 14 0" />
    <path d="M12 12l3-2" />
    <circle cx={12} cy={12} r={1} fill="currentColor" stroke="none" />
  </IconBase>
);

export const RoadIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 20L10 4h4l3 16" />
    <path d="M12 4v4" />
    <path d="M12 11v3" />
    <path d="M12 18v2" />
  </IconBase>
);

export const FuelIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={5} y={4} width={8} height={14} rx={1.8} />
    <path d="M9 4V3" />
    <path d="M7.5 9.5h3" />
    <path d="M14 8l2-1 2 2v8a2 2 0 0 1-2 2h-1" />
    <path d="M18 11.5l-1 1" />
  </IconBase>
);

export const ShieldCheckIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4l6 2v5.5c0 3.5-2.5 6.5-6 8-3.5-1.5-6-4.5-6-8V6l6-2z" />
    <path d="M9.5 11.5l2 2 3.5-4" />
  </IconBase>
);

export const ClipboardDocumentIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={7} y={5} width={10} height={14} rx={2} />
    <path d="M10 5V4a2 2 0 0 1 4 0v1" />
    <path d="M10 10h6" />
    <path d="M10 13h4" />
  </IconBase>
);

export const TicketIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 8h14v3a2 2 0 0 0 0 4v3H5v-3a2 2 0 0 0 0-4V8z" />
    <path d="M10 9v6" />
    <path d="M14 9v6" />
  </IconBase>
);

export const DocumentDuplicateIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 4h7l4 4v10H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M16 4v4h4" />
    <path d="M6 8H5a2 2 0 0 0-2 2v9h9a2 2 0 0 0 2-2v-1" />
  </IconBase>
);

// Marketing icons

export const PlayIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 7l7 5-7 5V7z" />
  </IconBase>
);

export const PauseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 7h2v10H9z" />
    <path d="M13 7h2v10h-2z" />
  </IconBase>
);

export const DuplicateIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x={8} y={7} width={10} height={11} rx={2} />
    <path d="M6 5h9a2 2 0 0 1 2 2v0" />
  </IconBase>
);

// Assistant icons

export const MapPinIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4.5a4.5 4.5 0 0 1 4.5 4.5c0 3-3 6.5-4.5 8-1.5-1.5-4.5-5-4.5-8A4.5 4.5 0 0 1 12 4.5z" />
    <circle cx={12} cy={9} r={1.4} />
  </IconBase>
);

export const SendIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 5l16 7-16 7 3-7-3-7z" />
    <path d="M7 12h6" />
  </IconBase>
);

export const SparklesIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4l1.2 3.2L16 8.5l-2.8 1.3L12 13l-1.2-3.2L8 8.5l2.8-1.3L12 4z" />
    <path d="M6 14l0.8 2 2 0.8-2 0.8L6 20l-0.8-2.4L3 16.8l2-0.8L6 14z" />
    <path d="M17.5 10l0.7 1.6 1.6 0.7-1.6 0.7-0.7 1.6-0.7-1.6-1.6-0.7 1.6-0.7 0.7-1.6z" />
  </IconBase>
);

// Large illustrations for empty states

export const IllustrationTruckIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    className={props.className}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
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

export const IllustrationMapIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    className={props.className}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 16l16-6 12 6 16-6v34l-16 6-12-6-16 6V16z" />
    <path d="M26 10v34" />
    <path d="M38 16v34" />
    <path d="M32 20a6 6 0 0 1 6 6c0 4-3.5 8.5-6 11-2.5-2.5-6-7-6-11a6 6 0 0 1 6-6z" />
    <circle cx={32} cy={26} r={2} />
  </svg>
);
