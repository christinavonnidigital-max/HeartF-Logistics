import React, { useEffect } from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const cn = (...parts: Array<string | undefined | false | null>) =>
  parts.filter(Boolean).join(' ');

// Cards
export const ShellCard: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div
    className={cn(
      'rounded-xl bg-card border border-border shadow-sm',
      className
    )}
    {...props}
  />
);

export const SubtleCard: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={cn('rounded-2xl bg-muted/40 border border-border', className)} {...props} />
);

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  import React from "react";

  type DivProps = React.HTMLAttributes<HTMLDivElement>;

  const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");

  export const ShellCard = ({ className, ...props }: DivProps) => (
    <div
      className={cx(
        "rounded-2xl bg-card border border-border/60 shadow-sm",
        "backdrop-blur-[1px]",
        className
      )}
      {...props}
    />
  );

  export const SubtleCard = ({ className, ...props }: DivProps) => (
    <div className={cx("rounded-2xl bg-muted/30 border border-border/50", className)} {...props} />
  );

  export const SectionHeader: React.FC<{
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    className?: string;
  }> = ({ title, subtitle, right, className }) => (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle ? <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );

  export const PageHeader: React.FC<{
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
  }> = ({ title, subtitle, right }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );

  export const StatusPill: React.FC<{
    label: string;
    tone?: "success" | "warn" | "danger" | "neutral";
  }> = ({ label, tone = "neutral" }) => {
    const toneClasses =
      tone === "success"
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
        : tone === "warn"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
        : tone === "danger"
        ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
        : "bg-slate-500/10 text-slate-700 border-slate-500/20";

    return (
      <span
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          toneClasses
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {label}
      </span>
    );
  };

  export const IconButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
  > = ({ className, label, ...props }) => (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center rounded-xl border border-border/60 bg-card",
        "h-9 w-9 shadow-sm hover:bg-muted/40 active:scale-[0.98] transition",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        className
      )}
      {...props}
    />
  );

  export default {
    ShellCard,
    SubtleCard,
    SectionHeader,
    PageHeader,
    StatusPill,
    IconButton,
  };


export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
