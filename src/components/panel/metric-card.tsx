import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricVariant = "neutral" | "success" | "warning" | "danger" | "info";

type MetricCardProps = {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  helper?: ReactNode;
  variant?: MetricVariant;
  className?: string;
};

const metricStyles: Record<
  MetricVariant,
  { icon: string; helper: string; accent: string }
> = {
  neutral: {
    icon: "bg-[var(--sq-soft,#f1f5f9)] text-[var(--sq-ink,#334155)]",
    helper: "text-[var(--sq-muted,#64748b)]",
    accent: "border-[var(--sq-line,#e2e8f0)]",
  },
  success: {
    icon: "bg-[var(--sq-olive-soft,#f0fdfa)] text-[var(--sq-olive,#0f766e)]",
    helper: "text-[var(--sq-olive,#0f766e)]",
    accent: "border-[var(--sq-line,#ccfbf1)]",
  },
  warning: {
    icon: "bg-[var(--sq-coral-soft,#fffbeb)] text-[var(--sq-coral,#b45309)]",
    helper: "text-[var(--sq-coral,#b45309)]",
    accent: "border-[var(--sq-line,#fde68a)]",
  },
  danger: {
    icon: "bg-[var(--sq-coral-soft,#fef2f2)] text-[var(--sq-coral,#b91c1c)]",
    helper: "text-[var(--sq-coral,#b91c1c)]",
    accent: "border-[var(--sq-line,#fecaca)]",
  },
  info: {
    icon: "bg-[var(--sq-soft,#f0f9ff)] text-[var(--sq-aubergine,#0369a1)]",
    helper: "text-[var(--sq-aubergine,#0369a1)]",
    accent: "border-[var(--sq-line,#bae6fd)]",
  },
};

export function MetricCard({
  label,
  value,
  icon,
  helper,
  variant = "neutral",
  className,
}: MetricCardProps) {
  const styles = metricStyles[variant];

  return (
    <article
      className={cn(
        "rounded-none border-0 border-l bg-transparent px-4 py-2 first:border-l-0 sm:px-5",
        styles.accent,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sq-muted,#64748b)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[var(--sq-ink,#020617)]">
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              styles.icon,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? (
        <p className={cn("mt-3 text-xs font-medium", styles.helper)}>{helper}</p>
      ) : null}
    </article>
  );
}
