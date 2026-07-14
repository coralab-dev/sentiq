import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-[var(--sq-line,#e2e8f0)] bg-[var(--sq-surface,#fff)] p-4 md:flex-row md:items-end md:justify-between sm:p-5",
        className,
      )}
    >
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&_[data-slot=button]]:min-h-11">{actions}</div>
      ) : null}
    </div>
  );
}

type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.09em] text-[var(--sq-muted,#64748b)]">{label}</span>
      {children}
    </label>
  );
}
