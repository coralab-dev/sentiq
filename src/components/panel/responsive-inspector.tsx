"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ResponsiveInspectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ResponsiveInspector({ open, onOpenChange, title, description, children, footer, className }: ResponsiveInspectorProps) {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={!isWide}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#24102d]/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 xl:hidden" />
        <Dialog.Popup className={cn("fixed inset-x-0 bottom-0 z-50 flex max-h-[92svh] flex-col rounded-t-[1.5rem] border border-[var(--sq-line)] bg-[var(--sq-surface)] shadow-2xl outline-none transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:inset-y-4 sm:left-auto sm:right-4 sm:max-h-none sm:w-[26rem] sm:rounded-[1.5rem] xl:inset-y-20 xl:right-0 xl:w-[27rem] xl:rounded-l-[1.5rem] xl:rounded-r-none xl:border-r-0", className)}>
          <header className="flex items-start justify-between gap-4 border-b border-[var(--sq-line)] px-5 py-5 sm:px-6">
            <div className="min-w-0"><Dialog.Title className="text-xl font-semibold tracking-[-0.035em] text-[var(--sq-ink)]">{title}</Dialog.Title>{description ? <Dialog.Description className="mt-1 text-sm leading-5 text-[var(--sq-muted)]">{description}</Dialog.Description> : null}</div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--sq-muted)] transition hover:bg-[var(--sq-soft)] hover:text-[var(--sq-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]" aria-label="Cerrar detalle"><X className="size-5" aria-hidden="true" /></Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer ? <footer className="border-t border-[var(--sq-line)] bg-[var(--sq-soft)] px-5 py-4 sm:px-6">{footer}</footer> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
