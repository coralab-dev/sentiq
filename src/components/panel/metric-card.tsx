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
    icon: "bg-slate-100 text-slate-700",
    helper: "text-slate-500",
    accent: "border-slate-200",
  },
  success: {
    icon: "bg-teal-50 text-teal-700",
    helper: "text-teal-700",
    accent: "border-teal-100",
  },
  warning: {
    icon: "bg-amber-50 text-amber-700",
    helper: "text-amber-700",
    accent: "border-amber-100",
  },
  danger: {
    icon: "bg-red-50 text-red-700",
    helper: "text-red-700",
    accent: "border-red-100",
  },
  info: {
    icon: "bg-sky-50 text-sky-700",
    helper: "text-sky-700",
    accent: "border-sky-100",
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
        "rounded-lg border bg-white p-5 shadow-sm",
        styles.accent,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              styles.icon,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? (
        <p className={cn("mt-4 text-sm font-medium", styles.helper)}>{helper}</p>
      ) : null}
    </article>
  );
}
