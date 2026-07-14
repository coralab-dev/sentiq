"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, pending = false }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#24102d]/40 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--sq-line,#e2e8f0)] bg-[var(--sq-surface,#fff)] p-6 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--sq-coral-soft,#fef2f2)] text-[var(--sq-coral,#b91c1c)]"><AlertTriangle className="size-5" aria-hidden="true" /></span><Dialog.Close className="grid size-11 place-items-center rounded-xl text-[var(--sq-muted,#64748b)] hover:bg-[var(--sq-soft,#f8fafc)]" aria-label="Cerrar"><X className="size-5" aria-hidden="true" /></Dialog.Close></div>
          <Dialog.Title className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--sq-ink,#020617)]">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--sq-muted,#475569)]">{description}</Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close render={<Button type="button" variant="outline" className="min-h-11" disabled={pending} />}>Cancelar</Dialog.Close><Button type="button" className="min-h-11 bg-[var(--sq-coral,#dc2626)] text-white hover:bg-[#e94b3a]" disabled={pending} onClick={() => void onConfirm()}>{pending ? "Procesando..." : confirmLabel}</Button></div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
