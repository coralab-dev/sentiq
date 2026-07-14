"use client";

import {
  AlertTriangle,
  Building2,
  LoaderCircle,
  MapPinned,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Smartphone,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog, PageHeader, ResponsiveInspector, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  createZone,
  getManagersEmptyLabel,
  loadZoneSettingsData,
  updateZone,
  updateZoneStatus,
  validateZoneDraft,
  type BranchZoneSettings,
  type ZoneDraft,
  type ZoneDraftErrors,
  type ZoneWithDevices,
} from "./zones-settings-data";

type LoadStatus = "loading" | "success" | "error";
type Message = { tone: "success" | "error"; text: string };
type ModalState = { mode: "create"; branchId: string } | { mode: "edit"; zone: ZoneWithDevices };

const EMPTY_DRAFT: ZoneDraft = { name: "", branchId: "", description: "" };

export function ZonesSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [branches, setBranches] = useState<BranchZoneSettings[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draft, setDraft] = useState<ZoneDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ZoneDraftErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyZoneId, setBusyZoneId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [pendingZone, setPendingZone] = useState<ZoneWithDevices | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadStatus("loading");
    try {
      const data = await loadZoneSettingsData(supabase);
      setBranches(data);
      setSelectedBranchId((current) =>
        data.some((item) => item.branch.id === current) ? current : data[0]?.branch.id ?? "",
      );
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedBranch = branches.find((item) => item.branch.id === selectedBranchId) ?? null;
  const branchRecords = useMemo(() => branches.map((item) => item.branch), [branches]);

  function openCreateModal() {
    const branchId = selectedBranchId || branches[0]?.branch.id || "";
    setDraft({ ...EMPTY_DRAFT, branchId });
    setErrors({});
    setModal({ mode: "create", branchId });
  }

  function openEditModal(zone: ZoneWithDevices) {
    setDraft({ name: zone.name, branchId: zone.branch_id, description: zone.description ?? "" });
    setErrors({});
    setModal({ mode: "edit", zone });
  }

  function closeModal() {
    if (isSaving) return;
    setModal(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  }

  async function saveZone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || isSaving) return;
    const nextErrors = validateZoneDraft(draft, branchRecords);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setMessage(null);
    try {
      if (modal.mode === "create") {
        await createZone(supabase, draft, branchRecords);
        setSelectedBranchId(draft.branchId);
        setMessage({ tone: "success", text: "Zona creada correctamente." });
      } else {
        await updateZone(supabase, modal.zone.id, draft);
        setMessage({ tone: "success", text: "Zona actualizada correctamente." });
      }
      closeModalAfterSave();
      await loadData(false);
    } catch {
      setMessage({ tone: "error", text: "No se pudo guardar la zona. Revisa los datos e intenta nuevamente." });
    } finally {
      setIsSaving(false);
    }
  }

  function closeModalAfterSave() {
    setModal(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  }

  async function toggleZone(zone: ZoneWithDevices) {
    if (busyZoneId) return;
    const nextStatus = zone.status === "active" ? "inactive" : "active";
    setPendingZone(null);

    setBusyZoneId(zone.id);
    setMessage(null);
    try {
      await updateZoneStatus(supabase, zone.id, nextStatus);
      await loadData(false);
      setMessage({
        tone: "success",
        text: `Zona ${nextStatus === "active" ? "activada" : "desactivada"} correctamente.`,
      });
    } catch {
      setMessage({ tone: "error", text: "No se pudo cambiar el estado de la zona." });
    } finally {
      setBusyZoneId(null);
    }
  }

  if (loadStatus === "loading") {
    return <LoadingState title="Cargando zonas" description="Consultando sucursales, zonas y dispositivos visibles." />;
  }

  if (loadStatus === "error") {
    return (
      <EmptyState
        title="No se pudieron cargar las zonas"
        description="Verifica tu conexión e intenta nuevamente."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={<Button type="button" onClick={() => void loadData()}><RefreshCw aria-hidden="true" />Reintentar</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Captura"
        title="Zonas"
        description="Organiza las zonas operativas y consulta su contexto por sucursal."
        actions={<Button type="button" onClick={openCreateModal} disabled={branches.length === 0}><Plus aria-hidden="true" />Nueva zona</Button>}
      />

      {message ? <MessageText message={message} /> : null}

      {branches.length === 0 ? (
        <EmptyState
          title="No hay sucursales disponibles"
          description="Necesitas una sucursal visible antes de crear zonas."
          icon={<Building2 className="size-6" aria-hidden="true" />}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <SectionCard title="Sucursales">
            <div className="space-y-2">
              {branches.map((item) => {
                const selected = item.branch.id === selectedBranchId;
                return (
                  <button
                    key={item.branch.id}
                    type="button"
                    onClick={() => setSelectedBranchId(item.branch.id)}
                    className={`min-h-11 w-full rounded-xl border px-3 py-3 text-left transition ${selected ? "border-[var(--sq-coral)] bg-[var(--sq-coral-soft)]" : "border-[var(--sq-line)] bg-[var(--sq-surface)] hover:border-[var(--sq-muted)]"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-950">{item.branch.name}</span>
                      <StatusBadge status={item.branch.status === "active" ? "active" : "inactive"} label={item.branch.status === "active" ? "Activa" : "Inactiva"} />
                    </span>
                    <span className="mt-2 block text-xs text-slate-600">{item.zoneCount} zonas · {item.deviceCount} dispositivos</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">{item.qrStatus === "active" ? "QR activo" : "Sin QR activo"}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {selectedBranch ? <BranchDetail item={selectedBranch} busyZoneId={busyZoneId} onEdit={openEditModal} onToggle={setPendingZone} /> : null}
        </div>
      )}

      {modal ? (
        <ZoneModal
          modal={modal}
          draft={draft}
          errors={errors}
          branches={branches}
          isSaving={isSaving}
          onDraftChange={setDraft}
          onClose={closeModal}
          onSubmit={saveZone}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingZone)}
        onOpenChange={(open) => { if (!open) setPendingZone(null); }}
        title={pendingZone?.status === "active" ? "Desactivar zona" : "Activar zona"}
        description={pendingZone?.status === "active" && pendingZone.devices.some((device) => device.status === "active") ? "Esta zona tiene dispositivos activos. Desactivarla no elimina el historial, pero cambia su organización operativa." : pendingZone?.status === "active" ? "La zona dejará de estar disponible para la operación hasta que se reactive." : "La zona volverá a estar disponible para la operación."}
        confirmLabel={pendingZone?.status === "active" ? "Desactivar" : "Activar"}
        pending={Boolean(busyZoneId)}
        onConfirm={() => pendingZone ? toggleZone(pendingZone) : undefined}
      />
    </div>
  );
}

function BranchDetail({ item, busyZoneId, onEdit, onToggle }: {
  item: BranchZoneSettings;
  busyZoneId: string | null;
  onEdit: (zone: ZoneWithDevices) => void;
  onToggle: (zone: ZoneWithDevices) => void;
}) {
  const managersEmptyLabel = getManagersEmptyLabel(
    item.managersAvailable,
    item.managers.length,
  );

  return (
    <div className="space-y-5">
      <SectionCard title={item.branch.name} actions={<StatusBadge status={item.branch.status === "active" ? "active" : "inactive"} label={item.branch.status === "active" ? "Activa" : "Inactiva"} />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <DataPoint label="Dirección" value={item.branch.address ?? "Sin dirección"} />
          <DataPoint label="Dispositivos" value={String(item.deviceCount)} />
          <DataPoint label="QR" value={item.qrStatus === "active" ? `Activo${item.qrTokenLast4 ? ` · •••• ${item.qrTokenLast4}` : ""}` : "Sin QR activo"} />
        </div>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><Users className="size-4" aria-hidden="true" />Gerentes asignados</p>
          {managersEmptyLabel ? (
            <p className="mt-2 text-sm text-slate-600">{managersEmptyLabel}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {item.managers.map((manager) => <li key={manager.id}><span className="font-medium text-slate-950">{manager.fullName}</span> · {manager.email}</li>)}
            </ul>
          )}
        </div>
      </SectionCard>

      {item.zones.length === 0 ? (
        <EmptyState title="Esta sucursal no tiene zonas" description="Crea una zona para organizar sus dispositivos." icon={<MapPinned className="size-6" aria-hidden="true" />} />
      ) : (
        <div className="space-y-3">
          {item.zones.map((zone) => (
            <SectionCard key={zone.id} title={zone.name} actions={<StatusBadge status={zone.status === "active" ? "active" : "inactive"} label={zone.status === "active" ? "Activa" : "Inactiva"} />}>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{zone.description ?? "Sin descripción"}</p>
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><Smartphone className="size-4" aria-hidden="true" />Dispositivos asociados</p>
                  {zone.devices.length === 0 ? <p className="mt-2 text-sm text-slate-600">Sin dispositivos asociados</p> : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {zone.devices.map((device) => <li key={device.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-950">{device.name}</span><span className="ml-2 text-xs text-slate-500">{device.status === "active" ? "Activo" : "Inactivo"}</span></li>)}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <Button type="button" variant="outline" onClick={() => onEdit(zone)} disabled={Boolean(busyZoneId)}><Pencil aria-hidden="true" />Editar</Button>
                  <Button type="button" variant="outline" onClick={() => void onToggle(zone)} disabled={Boolean(busyZoneId)}>
                    {busyZoneId === zone.id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Power aria-hidden="true" />}
                    {zone.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneModal({ modal, draft, errors, branches, isSaving, onDraftChange, onClose, onSubmit }: {
  modal: ModalState;
  draft: ZoneDraft;
  errors: ZoneDraftErrors;
  branches: BranchZoneSettings[];
  isSaving: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<ZoneDraft>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const branchName = branches.find((item) => item.branch.id === draft.branchId)?.branch.name ?? "Sucursal no disponible";
  const formId = "zone-settings-form";

  return (
    <ResponsiveInspector
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={modal.mode === "create" ? "Nueva zona" : "Editar zona"}
      description="Organiza el punto de captura dentro de la sucursal seleccionada."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {isSaving ? "Guardando..." : "Guardar zona"}
          </Button>
        </div>
      }
    >
        <form id={formId} className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field label="Sucursal" error={errors.branchId}>
            {modal.mode === "create" ? (
              <select value={draft.branchId} onChange={(event) => onDraftChange((current) => ({ ...current, branchId: event.target.value }))} className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)]" disabled={isSaving} aria-invalid={Boolean(errors.branchId)}>
                <option value="">Selecciona una sucursal</option>
                {branches.map((item) => <option key={item.branch.id} value={item.branch.id}>{item.branch.name}</option>)}
              </select>
            ) : <div className="rounded-xl border border-[var(--sq-line)] bg-[var(--sq-soft)] px-3 py-3 text-sm text-[var(--sq-ink)]">{branchName}</div>}
          </Field>
          <Field label="Nombre de zona" error={errors.name}>
            <input value={draft.name} onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))} className="min-h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)]" disabled={isSaving} aria-invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field label="Descripción opcional">
            <textarea value={draft.description} onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))} className="min-h-28 w-full resize-y rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 py-3 text-sm text-[var(--sq-ink)]" disabled={isSaving} />
          </Field>
        </form>
    </ResponsiveInspector>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium text-[var(--sq-ink)]"><span>{label}</span>{children}{error ? <span className="block text-xs font-medium text-red-700">{error}</span> : null}</label>;
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1"><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="text-sm text-slate-700">{value}</dd></div>;
}

function MessageText({ message }: { message: Message }) {
  return <p role="status" className={message.tone === "success" ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"}>{message.text}</p>;
}
