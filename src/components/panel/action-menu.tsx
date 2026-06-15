import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
};

type ActionMenuProps = {
  label?: string;
  items: ActionMenuItem[];
  className?: string;
};

export function ActionMenu({
  label = "Acciones",
  items,
  className,
}: ActionMenuProps) {
  return (
    <details className={cn("group relative inline-block text-left", className)}>
      <summary
        aria-label={label}
        className="inline-flex size-7 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50",
              item.destructive && "text-red-700 hover:bg-red-50",
            )}
          >
            {item.icon ? <span className="text-current">{item.icon}</span> : null}
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
