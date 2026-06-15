import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "inactive"
  | "revoked"
  | "pending"
  | "attended"
  | "paused"
  | "unassigned"
  | "success"
  | "error"
  | "neutral"
  | "completed";

type StatusBadgeProps = {
  status: StatusVariant;
  label?: string;
  className?: string;
};

const statusStyles: Record<StatusVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  revoked: "bg-red-50 text-red-700 ring-red-100",
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
  attended: "bg-teal-50 text-teal-700 ring-teal-100",
  paused: "bg-orange-50 text-orange-700 ring-orange-100",
  unassigned: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  error: "bg-red-50 text-red-700 ring-red-100",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const statusLabels: Record<StatusVariant, string> = {
  active: "Activo",
  inactive: "Inactivo",
  revoked: "Revocado",
  pending: "Pendiente",
  attended: "Atendida",
  paused: "Pausado",
  unassigned: "Sin asignar",
  success: "Correcto",
  error: "Error",
  neutral: "Neutral",
  completed: "Completado",
};

export function StatusBadge({ status, label = statusLabels[status], className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        statusStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
}
