import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b border-[var(--sq-line,#e2e8f0)] pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.17em] text-[var(--sq-coral,#0f766e)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--sq-ink,#020617)] sm:text-[2rem]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-[var(--sq-muted,#475569)] sm:text-[0.9375rem]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&_[data-slot=button]]:min-h-11">{actions}</div>
      ) : null}
    </header>
  );
}
