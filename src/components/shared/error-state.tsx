"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "No pudimos cargar la información",
  description = "Intenta de nuevo en unos segundos.",
  action,
  secondaryAction,
  retryLabel = "Reintentar",
  onRetry,
  className,
}: ErrorStateProps) {
  const hasActions = Boolean(onRetry || action || secondaryAction);

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-8 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <p className="mt-4 font-semibold text-slate-950">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {hasActions && (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {onRetry && (
            <Button
              type="button"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
