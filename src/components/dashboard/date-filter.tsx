import { CalendarDays } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DateFilterProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options?: Array<{ label: string; value: string }>;
};

const defaultOptions = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "7d" },
  { label: "Últimos 30 días", value: "30d" },
  { label: "Personalizado", value: "custom" },
];

export function DateFilter({
  label = "Rango de fechas",
  options = defaultOptions,
  className,
  id = "date-filter",
  ...props
}: DateFilterProps) {
  return (
    <FilterSelect
      id={id}
      label={label}
      icon={<CalendarDays className="size-4" aria-hidden="true" />}
      options={options}
      className={className}
      {...props}
    />
  );
}

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon?: React.ReactNode;
  options: Array<{ label: string; value: string }>;
};

function FilterSelect({ label, icon, options, className, id, ...props }: FilterSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
        <select
          id={id}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pr-9 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/20",
            icon ? "pl-10" : "pl-3"
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          ▾
        </span>
      </div>
    </div>
  );
}
