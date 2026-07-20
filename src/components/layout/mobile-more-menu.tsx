"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileMoreMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userSummary: ReactNode;
  navigation: ReactNode;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export function MobileMoreMenu({
  open,
  onOpenChange,
  userSummary,
  navigation,
  isLoggingOut,
  onLogout,
}: MobileMoreMenuProps) {
  function handleLogout() {
    onOpenChange(false);
    onLogout();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger
        type="button"
        aria-label="Más opciones"
        aria-expanded={open}
        className={cn(
          "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-semibold text-[var(--sq-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]",
          open && "text-[var(--sq-aubergine)]",
        )}
      >
        <MoreHorizontal className={cn("size-5", open && "text-[var(--sq-coral)]")} aria-hidden="true" />
        Más
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--sq-aubergine)]/35 backdrop-blur-[2px] md:hidden" />
        <Dialog.Popup className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none transition data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 md:hidden">
          <header className="flex items-start justify-between gap-4 border-b border-[var(--sq-line)] pb-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--sq-muted)]">
                Panel del restaurante
              </p>
              <Dialog.Title className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--sq-ink)]">
                Más opciones
              </Dialog.Title>
            </div>
            <Dialog.Close
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--sq-muted)] transition hover:bg-[var(--sq-soft)] hover:text-[var(--sq-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]"
              aria-label="Cerrar más opciones"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="py-4">{userSummary}</div>

          <div className="border-t border-[var(--sq-line)] pt-4">
            {navigation}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 min-h-11 w-full justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" />
            {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
          </Button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
