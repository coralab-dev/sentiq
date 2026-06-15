import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function LoadingState({
  title = "Cargando",
  description = "Estamos preparando la informacion.",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm",
        className
      )}
    >
      <LoaderCircle className="size-8 animate-spin text-teal-700" aria-hidden="true" />
      <p className="mt-4 font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
