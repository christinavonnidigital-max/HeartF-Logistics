import React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" ");

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
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, right, actions, className }) => (
  <div className={cx("flex items-start justify-between gap-4", className)}>
    <div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {subtitle ? <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div> : null}
    </div>
    {(actions || right) ? <div className="shrink-0">{actions ?? right}</div> : null}
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

// Basic form primitives (kept for compatibility)
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }
> = ({ className = '', variant = 'secondary', size = 'md', ...props }) => {
  const v =
    variant === 'primary'
      ? 'bg-brand-600 hover:bg-brand-700 text-white border-transparent'
      : variant === 'danger'
      ? 'bg-danger-600 hover:opacity-90 text-white border-transparent'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-muted text-foreground border-transparent'
      : 'bg-card hover:opacity-95 border-border';

  const s = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border shadow-sm transition',
        'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
        s,
        v,
        className
      )}
      {...props}
    />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={cx(
      'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm',
      'placeholder:opacity-60',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={cx(
      'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm',
      'placeholder:opacity-60',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select
    className={cx(
      'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', children, ...props }) => (
  <label className={cx('block text-xs font-medium text-foreground-muted mb-1', className)} {...props}>
    {children}
  </label>
);

export const ModalShell: React.FC<{
  isOpen?: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}> = ({ isOpen, title, subtitle, description, icon, onClose, children, footer, maxWidthClass = 'max-w-lg' }) => {
  React.useEffect(() => {
    if (isOpen === false) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // If caller explicitly passes `isOpen={false}` we honor it; otherwise assume it's open when rendered
  if (isOpen === false) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm md:pl-64 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* overlay scroll container */}
      <div className="min-h-full flex items-start md:items-center justify-center">
        <div
          className={`w-full ${maxWidthClass} bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900 leading-tight truncate">{title}</div>
              {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
              {description && <div className="mt-1 text-sm text-slate-500">{description}</div>}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition"
              aria-label="Close"
              type="button"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          {/* THIS is the key: min-h-0 so the overflow works inside flex */}
          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">{children}</div>
          </div>

          {footer && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default {
  ShellCard,
  SubtleCard,
  SectionHeader,
  PageHeader,
  StatusPill,
  IconButton,
  Button,
  Input,
  Textarea,
  Select,
  Label,
  ModalShell,
};
