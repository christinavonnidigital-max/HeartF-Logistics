import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

// Icons sourced from Icons8 "Fluent" Style: https://icons8.com/icons/fluent

export const TruckIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M42 31.5v-3A1.5 1.5 0 0040.5 27h-6a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 0034.5 41h6a1.5 1.5 0 001.5-1.5v-3a1.5 1.5 0 00-1.5-1.5h-4.5M39 27V15.75A1.75 1.75 0 0037.25 14H24.5a1.5 1.5 0 01-1.5-1.5V9a2 2 0 00-2-2H8a2 2 0 00-2 2v23a2 2 0 002 2h4.5a5.5 5.5 0 0111 0H33m-15.5 1a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0zm18 0a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z"/>
    </svg>
);

export const MapIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M21 4.5a1.5 1.5 0 00-1.2 2.4L25.9 18l-8.3 4.9a1.5 1.5 0 00-.7 1.3V38l10-6 10 6V16.5a1.5 1.5 0 00-1.2-2.4L29.9 3 21.5 8.3a1.5 1.5 0 01-2.6-1.5l3-5.2A1.5 1.5 0 0020.7 0L8.2 7.2A1.5 1.5 0 007 8.7V31l-4.2 2.5A1.5 1.5 0 001.5 35v8a1.5 1.5 0 002.3 1.3L14 38l11.4 6.8a1.5 1.5 0 001.2 0L38 38l10-6V13.5a1.5 1.5 0 00-2.3-1.3L40 16zM27 19.5l10-6v20.4l-10 6z"/>
    </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M34 14a2 2 0 00-2-2H16a2 2 0 00-2 2v2h20zM12 18v16a2 2 0 002 2h20a2 2 0 002-2V18zM10 16a2 2 0 012-2h24a2 2 0 012 2v20a2 2 0 01-2 2H12a2 2 0 01-2-2z"/>
    </svg>
);

export const CreditCardIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M41 11H7a2 2 0 00-2 2v22a2 2 0 002 2h34a2 2 0 002-2V13a2 2 0 00-2-2zM7 17h34v-4H7zm0 6h34v-4H7zM13 31H9a1 1 0 010-2h4a1 1 0 010 2zm6 0h-4a1 1 0 010-2h4a1 1 0 010 2z"/>
    </svg>
);

export const DriverIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 23a7 7 0 100-14 7 7 0 000 14zM32.5 28.2A14 14 0 0024 21a14 14 0 00-8.5 7.2c-3.1 4.1-3.5 9.3-3.5 10.8v1h24v-1c0-1.5-.4-6.7-3.5-10.8z"/>
    </svg>
);

export const UsersIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M35 25a7 7 0 100-14 7 7 0 000 14zm-15-2a6 6 0 100-12 6 6 0 000 12zm0 4a9.9 9.9 0 00-7.1 3.1A9.9 9.9 0 0020 40a9.9 9.9 0 007.1-16.9A9.9 9.9 0 0020 27zm15 3.2a11.1 11.1 0 01-3 2.1 12 12 0 00-13.8 0 11.1 11.1 0 01-3-2.1c-3-3.2-3-8.2-3-9.2v-1h25.8s0 6-3 9.2z"/>
    </svg>
);

export const BarChartIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M8 40h2V8H8zM23 40h2V20h-2zM38 40h2V14h-2z"/>
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M43.3 26.3l-3.5-1.1c-.2-1.2-.5-2.4-1-3.5l2-3.1a1 1 0 00-.3-1.4l-3.5-3.5a1 1 0 00-1.4-.3l-3.1 2c-1.1-.5-2.3-.8-3.5-1l-1.1-3.5a1 1 0 00-1-.8h-5a1 1 0 00-1 .8l-1.1 3.5c-1.2.2-2.4.5-3.5 1l-3.1-2a1 1 0 00-1.4.3L8.3 12a1 1 0 00-.3 1.4l2 3.1c-.5 1.1-.8 2.3-1 3.5l-3.5 1.1a1 1 0 00-.8 1v5a1 1 0 00.8 1l3.5 1.1c.2 1.2.5 2.4 1 3.5l-2 3.1a1 1 0 00.3 1.4l3.5 3.5a1 1 0 001.4.3l3.1-2c1.1.5 2.3.8 3.5 1l1.1 3.5a1 1 0 001 .8h5a1 1 0 001-.8l1.1-3.5c1.2-.2 2.4-.5 3.5-1l3.1 2a1 1 0 001.4-.3l3.5-3.5a1 1 0 00.3-1.4l-2-3.1c.5-1.1.8-2.3 1-3.5l3.5-1.1a1 1 0 00.8-1v-5a1 1 0 00-.8-1.2zM24 32a8 8 0 110-16 8 8 0 010 16z"/>
    </svg>
);

export const RoadIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M42 44.5H6a1.5 1.5 0 01-1.5-1.5V5A1.5 1.5 0 016 3.5h36a1.5 1.5 0 011.5 1.5v38a1.5 1.5 0 01-1.5 1.5zM25.5 5h-3v5h3zm-3 8h3v5h-3zm3 8h-3v5h3zm-3 8h3v5h-3z"/>
    </svg>
);

export const GaugeIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 10a14 14 0 1014 14A14 14 0 0024 10zm0 24a10 10 0 1110-10 10 10 0 01-10 10zM12 24a12 12 0 0121.3-8.1L32 17.2a10 10 0 00-14.7 8.1z"/>
    </svg>
);

export const WrenchIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M41 27.9l-2.7 1.2c-.3 1-.7 2-1.2 2.9l1.6 2.4a2 2 0 01-.6 2.8L35 39.3a2 2 0 01-2.8-.6l-2.4-1.6c-.9.5-1.9.9-2.9 1.2l-1.2 2.7a2 2 0 01-2 .9h-4a2 2 0 01-2-.9L16.5 41c-1 .3-2 .7-2.9 1.2l-2.4 1.6a2 2 0 01-2.8-.6L6.3 40a2 2 0 01-.6-2.8l1.6-2.4c-.5-.9-.9-1.9-1.2-2.9l-2.7-1.2a2 2 0 01-.9-2v-4a2 2 0 01.9-2l2.7-1.2c.3-1 .7-2 1.2-2.9l-1.6-2.4a2 2 0 01.6-2.8L8.7 7a2 2 0 012.8.6l2.4 1.6c.9-.5 1.9-.9 2.9-1.2l1.2-2.7a2 2 0 012-.9h4a2 2 0 012 .9l1.2 2.7c1 .3 2 .7 2.9 1.2l2.4-1.6a2 2 0 012.8.6l2.1 2.1a2 2 0 01.6 2.8l-1.6 2.4c.5.9.9 1.9 1.2 2.9l2.7 1.2a2 2 0 01.9 2v4a2 2 0 01-.9 2.1zM24 31a7 7 0 100-14 7 7 0 000 14z"/>
    </svg>
);

export const CogIcon: React.FC<IconProps> = (props) => <SettingsIcon {...props} />;

export const DollarIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4.5a19.5 19.5 0 100 39 19.5 19.5 0 000-39zM22.5 32H21v-3h1.5a4.5 4.5 0 000-9H21V17h1.5v3H24a1.5 1.5 0 010 3h-1.5v3H24a1.5 1.5 0 010 3h-1.5z"/>
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M38 10h-2V7a1 1 0 00-2 0v3H14V7a1 1 0 00-2 0v3h-2a2 2 0 00-2 2v24a2 2 0 002 2h28a2 2 0 002-2V12a2 2 0 00-2-2zM12 18h24v-6H12zM38 36H10V20h28z"/>
    </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4a20 20 0 100 40 20 20 0 000-40zm0 36a16 16 0 110-32 16 16 0 010 32zM26 14h-4v11l9.5 5.7 2-3.4-7.5-4.4z"/>
    </svg>
);

export const WarningIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4a20 20 0 100 40 20 20 0 000-40zm-2 29v-5h4v5zm0-8V13h4v12z"/>
    </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M22.5 38V25.5H10v-3h12.5V10h3v12.5H38v3H25.5V38z"/>
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4l-4.2 10.8L9 19l10.5 7.7L16 38l8-6.3 8 6.3-3.5-11.3L40 19l-10.8-4.2z"/>
    </svg>
);

export const CloseIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M25.4 24l10.3-10.3a1 1 0 00-1.4-1.4L24 22.6 13.7 12.3a1 1 0 00-1.4 1.4L22.6 24 12.3 34.3a1 1 0 101.4 1.4L24 25.4l10.3 10.3a1 1 0 001.4-1.4z"/>
    </svg>
);

export const SendIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M4.1 44.1a1.9 1.9 0 012.3-1.6L44.2 24 6.4 5.5a1.9 1.9 0 01-2.3-1.6 1.9 1.9 0 011-2.3L44.9 1a1.9 1.9 0 012.2 3.8l-18 8.1h-4.3l18-8.1-39.8 18a1.9 1.9 0 010 1.8l39.8 18-18-8.1h4.3l-18 8.1a1.9 1.9 0 01-3.2-1.5z"/>
    </svg>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M21 4a17 17 0 1011.6 29.4l9.7 9.7a1.5 1.5 0 002.1-2.1l-9.7-9.7A17 17 0 0021 4zm0 30a13 13 0 110-26 13 13 0 010 26z"/>
    </svg>
);

export const MapPinIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4a14 14 0 00-14 14c0 10.6 12.3 23.4 13.2 24.5a1.5 1.5 0 002.6 0C35.7 41.4 42 28.6 42 18A14 14 0 0024 4zm0 20a6 6 0 110-12 6 6 0 010 12z"/>
    </svg>
);

export const UserCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4a20 20 0 100 40 20 20 0 000-40zm0 36a16 16 0 110-32 16 16 0 010 32zm0-18a7 7 0 100-14 7 7 0 000 14z"/>
    </svg>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M24 4a20 20 0 100 40 20 20 0 000-40zm-2 29v-5h4v5zm0-8V13h4v12z"/>
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path d="M12 5H9a2 2 0 00-2 2v34a2 2 0 002 2h30a2 2 0 002-2V22l-13-13zm17 2h7.6L29 14.6zM37 41H11V9h16v10a2 2 0 002 2h10z"/>
    </svg>
);

export const PhoneIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
    <path d="M36.6 42.4A23.5 23.5 0 015.6 11.4a2 2 0 012-1.9h6a2 2 0 012 1.7l1.7 7.3a2 2 0 01-.8 2.1L14 23a.5.5 0 00-.1.6 19.4 19.4 0 0010.5 10.5.5.5 0 00.6-.1l2.5-2.5a2 2 0 012.1-.8l7.3 1.7a2 2 0 011.7 2v6a2 2 0 01-1.9 2z"/>
  </svg>
);

export const EnvelopeIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
    <path d="M41 11H7a2 2 0 00-2 2v22a2 2 0 002 2h34a2 2 0 002-2V13a2 2 0 00-2-2zM8 35V15.4l15.4 10a1 1 0 001.2 0L40 15.4V35zM38.8 13L24 22.8 9.2 13z"/>
  </svg>
);

export const CalendarDaysIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
    <path d="M38 10h-2V7a1 1 0 00-2 0v3H14V7a1 1 0 00-2 0v3h-2a2 2 0 00-2 2v24a2 2 0 002 2h28a2 2 0 002-2V12a2 2 0 00-2-2zM12 18h24v-6H12zM38 36H10V20h28z"/>
  </svg>
);

export const PencilSquareIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
    <path d="M35 5a3.9 3.9 0 00-2.8 1.2L13.5 24.9a1 1 0 000 1.4l5.7 5.7a1 1 0 001.4 0L39.2 13.4a3.9 3.9 0 000-5.6A3.9 3.9 0 0035 5zm-2.1 6.3l-17 17V33h4.8l17-17-4.8-4.7zM9 13h18a1 1 0 000-2H9a1 1 0 000 2zm0 8h10a1 1 0 000-2H9a1 1 0 000 2zm0 8h18a1 1 0 000-2H9a1 1 0 000 2zM9 37h30a1 1 0 000-2H9a1 1 0 000 2z"/>
  </svg>
);

// Illustration Icons
export const IllustrationTruckIcon: React.FC<IconProps> = (props) => (
    <svg {...props} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M54 38H48V26H14V38H6C5.44772 38 5 38.4477 5 39V43C5 43.5523 5.44772 44 6 44H7" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M55 44H56C56.5523 44 57 43.5523 57 43V39C57 38.4477 56.5523 38 56 38H54" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M54 29V38" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 26L30 18H48V26" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="44" r="3" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="50" cy="44" r="3" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 44H47" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const IllustrationMapIcon: React.FC<IconProps> = (props) => (
    <svg {...props} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 14L24 8L40 16L54 10V44L40 50L24 42L10 48V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 8V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M40 16V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 14V48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M54 10V44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);