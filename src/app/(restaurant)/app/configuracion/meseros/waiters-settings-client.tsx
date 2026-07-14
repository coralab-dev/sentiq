"use client";

import {
  AlertTriangle,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog, DataTable, PageHeader, ResponsiveInspector, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  createWaiter,
  filterWaiterRowsByBranch,
  getWaitersSummary,
  loadWaitersSettingsData,
  updateWaiter,
  updateWaiterStatus,
  validateWaiterDraft,
  type WaiterBranch,
  type WaiterDraft,
  type WaiterDraftErrors,
  type WaiterSettingsRow,
} from "./waiters-settings-data";

type LoadStatus = "loading" | "success" | "error";
type Message = { tone: "success" | "error"; text: string };
type Modal = { mode: "create" } | { mode: "edit"; row: WaiterSettingsRow };

const EMPTY_DRAFT: WaiterDraft = {
  name: "",
  internalCode: "",
  branchId: "",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Sin registro";
}

export function WaitersSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<WaiterSettingsRow[]>([]);
  const [branches, setBranches] = useState<WaiterBranch[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [modal, setModal] = useState<Modal | null>(null);
  const [draft, setDraft] = useState<WaiterDraft>(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<WaiterDraftErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyWaiterId, setBusyWaiterId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [pendingWaiter, setPendingWaiter] = useState<WaiterSettingsRow | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoadStatus("loading");
    }

    try {
      const data = await loadWaitersSettingsData(supabase);
      setRows(data.rows);
      setBranches(data.branches);
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRows = useMemo(
    () => filterWaiterRowsByBranch(rows, selectedBranchId),
    [rows, selectedBranchId],
  );
  const summary = useMemo(() => getWaitersSummary(rows), [rows]);

  function openCreate() {
    setDraft({
      ...EMPTY_DRAFT,
      branchId: selectedBranchId !== "all" ? selectedBranchId : branches[0]?.id ?? "",
    });
    setDraftErrors({});
    setMessage(null);
    setModal({ mode: "create" });
  }

  function openEdit(row: WaiterSettingsRow) {
    setDraft({
      name: row.waiter.name,
      internalCode: row.waiter.internal_code ?? "",
      branchId: row.waiter.branch_id,
    });
    setDraftErrors({});
    setMessage(null);
    setModal({ mode: "edit", row });
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setModal(null);
    setDraft(EMPTY_DRAFT);
    setDraftErrors({});
  }

  async function saveWaiter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || isSaving) {
      return;
    }

    const errors = validateWaiterDraft(draft, branches);
    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      if (modal.mode === "create") {
        await createWaiter(supabase, draft, branches);
      } else {
        await updateWaiter(supabase, modal.row.waiter.id, draft, branches);
      }

      setModal(null);
      setDraft(EMPTY_DRAFT);
      setDraftErrors({});
      await loadData(false);
      setMessage({
        tone: "success",
        text: modal.mode === "create" ? "Mesero creado correctamente." : "Mesero actualizado correctamente.",
      });
    } catch {
      setMessage({
        tone: "error",
        text: "No se pudo guardar el mesero. Revisa los datos e intenta nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleWaiter(row: WaiterSettingsRow) {
    if (busyWaiterId) {
      return;
    }

    const nextStatus = row.waiter.status === "active" ? "inactive" : "active";
    setPendingWaiter(null);

    setBusyWaiterId(row.waiter.id);
    setMessage(null);

    try {
      await updateWaiterStatus(supabase, row.waiter.id, nextStatus);
      await loadData(false);
      setMessage({
        tone: "success",
        text: `Mesero ${nextStatus === "active" ? "activado" : "desactivado"}.`,
      });
    } catch {
      setMessage({
        tone: "error",
        text: "No se pudo cambiar el estado del mesero.",
      });
    } finally {
      setBusyWaiterId(null);
    }
  }

  if (loadStatus === "loading") {
    return (
      <LoadingState
        title="Cargando meseros"
        description="Consultando sucursales y meseros visibles."
      />
    );
  }

  if (loadStatus === "error") {
    return (
      <EmptyState
        title="No se pudieron cargar los meseros"
        description="Verifica tu conexion e intenta nuevamente."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Button type="button" onClick={() => void loadData()}>
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipo"
        title="Meseros"
        description="Gestiona registros internos opcionales de meseros."
        actions={
          <Button type="button" onClick={openCreate} disabled={!branches.length}>
            <Plus aria-hidden="true" />
            Nuevo mesero
          </Button>
        }
      />

      {message ? <MessageText message={message} /> : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid sm:grid-cols-3">
        <SummaryCard title="Total" value={summary.total} />
        <SummaryCard title="Activos" value={summary.active} />
        <SummaryCard title="Inactivos" value={summary.inactive} />
      </div>

      <SectionCard title="Filtro" description="Filtra el listado por sucursal visible.">
        <label className="block max-w-sm space-y-2 text-sm font-medium text-[var(--sq-ink)]">
          <span>Sucursal</span>
          <select
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral-soft)]"
          >
            <option value="all">Todas</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
      </SectionCard>

      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          { key: "code", header: "Codigo interno" },
          { key: "branch", header: "Sucursal" },
          { key: "status", header: "Estado" },
          { key: "created", header: "Fecha de alta" },
        ]}
        rows={filteredRows.map((row) => ({
          id: row.waiter.id,
          cells: {
            name: <span className="font-medium text-[var(--sq-ink)]">{row.waiter.name}</span>,
            code: row.waiter.internal_code ? (
              <span className="font-mono text-xs">{row.waiter.internal_code}</span>
            ) : (
              "Sin codigo"
            ),
            branch: row.branch?.name ?? "Sucursal no visible",
            status: <WaiterStatusBadge status={row.waiter.status} />,
            created: formatDate(row.waiter.created_at),
          },
          actions: (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Editar ${row.waiter.name}`}
                onClick={() => openEdit(row)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${row.waiter.status === "active" ? "Desactivar" : "Activar"} ${row.waiter.name}`}
                disabled={Boolean(busyWaiterId)}
                onClick={() => setPendingWaiter(row)}
              >
                {busyWaiterId === row.waiter.id ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <Power aria-hidden="true" />
                )}
              </Button>
            </div>
          ),
        }))}
        emptyState={
          <EmptyState
            title="No hay meseros"
            description="Crea un registro cuando necesites identificar a un mesero en la operación."
            icon={<UserRound className="size-6" aria-hidden="true" />}
          />
        }
        actionsHeader="Acciones"
      />

      {modal ? (
        <WaiterModal
          modal={modal}
          draft={draft}
          errors={draftErrors}
          branches={branches}
          isSaving={isSaving}
          onChange={setDraft}
          onClose={closeModal}
          onSubmit={saveWaiter}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingWaiter)}
        onOpenChange={(open) => { if (!open) setPendingWaiter(null); }}
        title={pendingWaiter?.waiter.status === "active" ? "Desactivar mesero" : "Activar mesero"}
        description={pendingWaiter?.waiter.status === "active" ? "El registro dejará de aparecer como activo hasta que lo reactives." : "El registro volverá a estar disponible para la operación."}
        confirmLabel={pendingWaiter?.waiter.status === "active" ? "Desactivar" : "Activar"}
        pending={Boolean(busyWaiterId)}
        onConfirm={() => pendingWaiter ? toggleWaiter(pendingWaiter) : undefined}
      />
    </div>
  );
}

function WaiterModal({
  modal,
  draft,
  errors,
  branches,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  modal: Modal;
  draft: WaiterDraft;
  errors: WaiterDraftErrors;
  branches: WaiterBranch[];
  isSaving: boolean;
  onChange: React.Dispatch<React.SetStateAction<WaiterDraft>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const formId = "waiter-settings-form";

  return (
    <ResponsiveInspector
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={modal.mode === "create" ? "Nuevo mesero" : "Editar mesero"}
      description="Completa solo los datos que usa tu equipo para identificarlo."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {isSaving ? "Guardando..." : "Guardar mesero"}
          </Button>
        </div>
      }
    >
        <form id={formId} className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field label="Nombre" error={errors.name}>
            <input
              autoFocus
              value={draft.name}
              maxLength={120}
              onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
              disabled={isSaving}
              aria-invalid={Boolean(errors.name)}
              className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral-soft)]"
            />
          </Field>

          <Field label="Codigo interno opcional" error={errors.internalCode}>
            <input
              value={draft.internalCode}
              maxLength={50}
              onChange={(event) => onChange((current) => ({ ...current, internalCode: event.target.value }))}
              disabled={isSaving}
              aria-invalid={Boolean(errors.internalCode)}
              className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral-soft)]"
            />
          </Field>

          <Field label="Sucursal" error={errors.branchId}>
            <select
              value={draft.branchId}
              onChange={(event) => onChange((current) => ({ ...current, branchId: event.target.value }))}
              disabled={isSaving}
              aria-invalid={Boolean(errors.branchId)}
              className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral-soft)]"
            >
              <option value="">Selecciona una sucursal</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </Field>

        </form>
    </ResponsiveInspector>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-[var(--sq-ink)]">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="border-b border-[var(--sq-line)] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sq-muted)]">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--sq-ink)]">{value}</p>
    </div>
  );
}

function WaiterStatusBadge({ status }: { status: string }) {
  return status === "active" ? (
    <StatusBadge status="active" label="Activo" />
  ) : (
    <StatusBadge status="inactive" label="Inactivo" />
  );
}

function MessageText({ message }: { message: Message }) {
  return (
    <p
      role="status"
      className={
        message.tone === "success"
          ? "text-sm font-medium text-emerald-700"
          : "text-sm font-medium text-red-700"
      }
    >
      {message.text}
    </p>
  );
}
