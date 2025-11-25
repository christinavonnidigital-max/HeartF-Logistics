import React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const ShellCard: React.FC<DivProps> = ({ className = "", ...props }) => (
  <div
    className={
      "rounded-2xl bg-white shadow-md border border-slate-200/60 " + className
    }
    {...props}
  />
);

export const SubtleCard: React.FC<DivProps> = ({ className = "", ...props }) => (
  <div
    className={
      "rounded-xl bg-slate-50/80 border border-slate-200/80 " + className
    }
    {...props}
  />
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode; }> = ({
  title,
  subtitle,
  actions
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);


export const StatusPill: React.FC<{
  label: string;
  tone?: "success" | "warn" | "danger" | "info" | "neutral";
}> = ({ label, tone = "neutral" }) => {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize border";

  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : tone === "info"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-slate-50 text-slate-600 border-slate-200";

  return <span className={base + " " + toneClass}>{label}</span>;
};