"use client";

import { Check, QrCode, RotateCcw, Smartphone } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThankYouMessageProps = {
  title?: ReactNode;
  description?: ReactNode;
  mode?: "qr" | "device";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function ThankYouMessage({
  title = "Gracias por compartir tu opinión",
  description = "Tu feedback nos ayuda a brindar mejores experiencias cada día.",
  mode = "qr",
  actionLabel = "Nueva encuesta",
  onAction,
  className,
}: ThankYouMessageProps) {
  const isDevice = mode === "device";

  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center rounded-3xl border border-[#ded4c7] bg-[#fffdf8] px-6 py-10 text-center shadow-[0_12px_40px_rgba(43,18,53,0.08)] sm:px-10 sm:py-12",
        className
      )}
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#eef0c9] text-[#59622f] ring-8 ring-[#f7f3e9]">
        <Check className="size-10" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#2b1235] sm:text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#685f6b] sm:text-base">{description}</p>
      <div className="mt-8 w-full rounded-2xl border border-[#ded4c7] bg-[#fbf7ef] p-4 text-left">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#69723a] shadow-sm">
            {isDevice ? (
              <Smartphone className="size-5" aria-hidden="true" />
            ) : (
              <QrCode className="size-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="font-semibold text-[#2b1235]">
              {isDevice ? "Modo dispositivo" : "Modo QR"}
            </p>
            <p className="mt-1 text-sm leading-5 text-[#685f6b]">
              {isDevice
                ? "La encuesta se reiniciará automáticamente en unos segundos."
                : "Puedes cerrar esta pestaña. Tu respuesta ya fue registrada."}
            </p>
          </div>
        </div>
      </div>
      {onAction && (
        <Button
          type="button"
          variant="outline"
          className="mt-8 min-h-11 w-full rounded-xl border-[#2b1235] text-[#2b1235] hover:bg-[#fbf7ef]"
          onClick={onAction}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {actionLabel}
        </Button>
      )}
    </section>
  );
}
