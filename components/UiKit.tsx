import React from "react";

const cn = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" ");

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ShellCard: React.FC<DivProps> = ({ className = "", ...props }) => (
  <div
    className={cn(
      "rounded-2xl bg-card text-foreground border border-border shadow-sm",
      className
    )}
    {...props}
  />
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }> = ({ className = '', label, ...props }) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex items-center justify-center rounded-xl border border-border h-9 w-9 bg-card",
      "shadow-sm hover:bg-muted/40 active:scale-[0.98] transition",
      className
    )}
    {...props}
  />
);

export const SubtleCard: React.FC<DivProps> = ({ className = "", ...props }) => (
  <div
    className={cn(
      "rounded-2xl bg-muted/30 text-foreground border border-border shadow-sm",
      className
    )}
    {...props}
  />
);

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, right, className }) => (
  <div className={cn("flex items-start justify-between gap-4", className)}>
    <div className="min-w-0">
      <div className="text-lg font-semibold tracking-tight">{title}</div>
      {subtitle ? (
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
    {right ? <div className="shrink-0">{right}</div> : null}
  </div>
);

export const StatusPill: React.FC<{
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  className?: string;
}> = ({ children, tone = "neutral", className }) => {
  const toneCls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
      : tone === "bad"
      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneCls,
        className
      )}
    >
      {children}
    </span>
  );
};

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export const Button: React.FC<
  ButtonProps & { variant?: ButtonVariant; size?: ButtonSize }
> = ({ className = "", variant = "secondary", size = "md", ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:translate-y-[1px] disabled:opacity-60 disabled:pointer-events-none";

  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
      ? "h-11 px-5 text-sm"
      : "h-10 px-4 text-sm";

  const variants =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : variant === "ghost"
      ? "bg-transparent hover:bg-muted text-foreground"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-card border border-border hover:bg-muted text-foreground";

  return (
    <button className={cn(base, sizes, variants, className)} {...props} />
  );
};

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
> = ({ className = "", ...props }) => (
  <input
    className={cn(
      "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50",
      className
    )}
    {...props}
  />
);

export const Textarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
> = ({ className = "", ...props }) => (
  <textarea
    className={cn(
      "min-h-[100px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50",
      className
    )}
    {...props}
  />
);

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
> = ({ className = "", ...props }) => (
  <select
    className={cn(
      "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50",
      className
    )}
    {...props}
  />
);

export const Label: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children, ...props }) => (
  <label className={cn('block text-xs font-medium text-muted-foreground mb-1', className)} {...props}>
    {children}
  </label>
);

export const ModalShell: React.FC<{
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}> = ({
  isOpen,
  title,
  description,
  icon,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-3xl",
}) => {
  // unique ids for accessibility (used by aria-labelledby/aria-describedby)
  const uid = React.useId();
  const titleId = `modal-title-${uid}`;
  const descId = description ? `modal-desc-${uid}` : undefined;

  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className={cn(
          "relative w-full",
          maxWidthClass,
          "w-full max-w-3xl",
          "max-h-[85vh]",
          "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl",
          "flex flex-col"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div className="flex min-w-0 items-start gap-4">
            {icon ? (
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
              {description ? (
                <div id={descId} className="mt-1 text-sm text-muted-foreground">{description}</div>
              ) : null}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        {/* Body (THIS is what scrolls) */}
        <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0 custom-scrollbar">
          {children}
        </div>

        {/* Footer (stays pinned) */}
        {footer ? (
          <div className="px-6 py-4 border-t border-[var(--border)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const ThemeToggle: React.FC<{
  isDark: boolean;
  onToggle: () => void;
  size?: ButtonSize;
}> = ({ isDark, onToggle, size = "sm" }) => (
  <Button
    variant="ghost"
    size={size}
    onClick={onToggle}
    aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    title={isDark ? "Light" : "Dark"}
  >
    <span className="text-base leading-none">{isDark ? "☀" : "🌙"}</span>
    <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
  </Button>
);

