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
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="text-base font-semibold tracking-tight">{title}</div>
      {subtitle && <div className="mt-1 text-sm opacity-70">{subtitle}</div>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', children, ...props }) => (
  <label className={cn('block text-xs font-medium text-foreground-muted mb-1', className)} {...props}>
    {children}
  </label>
);

export const StatusPill: React.FC<{ label: string; tone?: 'neutral' | 'success' | 'warn' | 'danger' }> = ({
  label,
  tone = 'neutral',
}) => {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20'
      : tone === 'warn'
      ? 'bg-amber-600/10 text-amber-700 border-amber-600/20'
      : tone === 'danger'
      ? 'bg-rose-600/10 text-rose-700 border-rose-600/20'
      : 'bg-muted text-foreground/80 border-border';

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>
      {label}
    </span>
  );
};

// Inputs
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={cn(
      'w-full rounded-xl border border-border bg-card px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={cn(
      'w-full rounded-xl border border-border bg-card px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select
    className={cn(
      'w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
      'focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:ring-offset-2 focus:ring-offset-background',
      className
    )}
    {...props}
  />
);

// Buttons
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
      ? 'bg-transparent hover:bg-muted border-transparent'
      : 'bg-card hover:bg-muted border-border';

  const s = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-10 px-4 text-sm';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border transition',
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
      'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card',
      'hover:bg-muted transition',
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
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full overflow-hidden rounded-2xl border border-border bg-background shadow-2xl',
          maxWidthClass
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex gap-4">
          {icon && (
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border">
              {icon}
            </div>
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

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  ShellCard,
  SubtleCard,
  SectionHeader,
  StatusPill,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  ModalShell,
  Label,
};

