import React from 'react';

type LeadMetricCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
};

type LeadViewTab = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type LeadViewTabsProps = {
  tabs: LeadViewTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export const LeadWorkspaceHeader: React.FC<{
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children ? <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">{children}</div> : null}
    </div>
  </section>
);

export const LeadMetricCard: React.FC<LeadMetricCardProps> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

export const LeadViewTabs: React.FC<LeadViewTabsProps> = ({ tabs, activeKey, onChange }) => (
  <div className="mt-4 flex flex-wrap items-center gap-2">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          activeKey === tab.key ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {tab.icon ? <span className="mr-1 inline-block align-middle">{tab.icon}</span> : null}
        <span className="align-middle">{tab.label}</span>
      </button>
    ))}
  </div>
);
