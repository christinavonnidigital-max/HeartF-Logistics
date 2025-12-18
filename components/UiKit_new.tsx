import React, { useEffect } from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const cn = (...parts: Array<string | undefined | false | null>) =>
  parts.filter(Boolean).join(' ');

// Cards
export const ShellCard: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div
    className={cn(
      'rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-200/60',
      className
    )}
    {...props}
  />
);

export const SubtleCard: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={cn('rounded-2xl bg-white/70 backdrop-blur border border-slate-200/50', className)} {...props} />
);

// Page header (new pattern)
export const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
    {right ? <div className="flex items-center gap-2">{right}</div> : null}
  </div>
);

// Compact stat card
export const StatCard: React.FC<{ label: string; value: string | number; hint?: string; icon?: React.ReactNode }> = ({ label, value, hint, icon }) => (
  <ShellCard className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
      </div>
      {icon ? <div className="mt-1 text-slate-400">{icon}</div> : null}
    </div>
  </ShellCard>
);

// Headers
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// Pills
export const StatusPill: React.FC<{
  label: string;
  tone?: 'success' | 'warn' | 'danger' | 'info' | 'neutral';
}> = ({ label, tone = 'neutral' }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize border';

  const toneClass =
    tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 dark:text-emerald-200'
      : tone === 'warn'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 dark:text-amber-200'
      : tone === 'danger'
      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 dark:text-rose-200'
      : tone === 'info'
      ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 dark:text-sky-200'
      : 'bg-muted text-foreground/70 border-border';

  return <span className={cn(base, toneClass)}>{label}</span>;
};

// Buttons + Inputs
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
> = ({ className = '', variant = 'secondary', size = 'md', ...props }) => {
  const v =
    variant === 'primary'
      ? 'bg-brand-600 hover:bg-brand-700 text-white border-transparent'
      : variant === 'danger'
      ? 'bg-danger-600 hover:opacity-90 text-white border-transparent'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-muted text-foreground border-border'
      : 'bg-muted hover:opacity-90 text-foreground border-border';

  const s = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';

  return (
    <button
      className={cn(
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

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card',
      'hover:bg-muted transition',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={cn(
      'w-full rounded-xl border border-border bg-card px-3 py-2 text-sm',
      'placeholder:opacity-60',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={cn(
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
    className={cn(
      'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

// Modal shell
export const ModalShell: React.FC<{
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}> = ({ isOpen, title, description, icon, onClose, children, footer, maxWidthClass = 'max-w-lg' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm overflow-y-auto" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className={cn('min-h-full flex items-start justify-center p-4 sm:p-6', maxWidthClass)} onMouseDown={(e) => e.stopPropagation()}>
        <div className={cn('w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl')}>
          <div className="p-6 flex gap-4">
            {icon && (
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border">{icon}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold tracking-tight">{title}</div>
              {description && <div className="mt-1 text-sm opacity-70">{description}</div>}
            </div>
            <IconButton type="button" onClick={onClose} aria-label="Close">
              <span className="text-base leading-none">×</span>
            </IconButton>
          </div>

          <div className="px-6 pb-6">{children}</div>

          {footer && <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-end gap-2">{footer}</div>}
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
  StatCard,
  StatusPill,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  ModalShell,
};
