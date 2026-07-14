"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  MonitorSmartphone,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { ConfirmDialog, PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { EDGE_FUNCTIONS } from "@/config/edge-functions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  RegenerateDeviceTokenRequest,
  RegenerateTokenResponse,
} from "@/types/edge-functions";

import {
  createDevice,
  loadDeviceSettingsData,
  updateDeviceStatus,
  validateDeviceDraft,
  type DeviceDraft,
  type DeviceDraftErrors,
  type DeviceSettingsRow,
  type TemporaryDeviceLink,
} from "./devices-settings-data";

type LoadStatus = "loading" | "success" | "error";
type PendingDeviceAction = { type: "regenerate" | "toggle"; row: DeviceSettingsRow } | null;
type Message = { tone: "success" | "error"; text: string };

const EMPTY_DRAFT: DeviceDraft = {
  name: "",
  branchId: "",
  zoneId: "",
  description: "",
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "Sin registro";
}

function isExpectedDeviceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    return /^\/d\/[^/]+\/?$/.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

export function DevicesSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<DeviceSettingsRow[]>([]);
  const [branches, setBranches] = useState<Awaited<ReturnType<typeof loadDeviceSettingsData>>["branches"]>([]);
  const [zones, setZones] = useState<Awaited<ReturnType<typeof loadDeviceSettingsData>>["zones"]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draft, setDraft] = useState<DeviceDraft>(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<DeviceDraftErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [temporaryLinks, setTemporaryLinks] = useState<Record<string, TemporaryDeviceLink>>({});
  const [rowMessages, setRowMessages] = useState<Record<string, Message>>({});
  const [pageMessage, setPageMessage] = useState<Message | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingDeviceAction>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadStatus("loading");

    try {
      const data = await loadDeviceSettingsData(supabase);
      setRows(data.rows);
      setBranches(data.branches);
      setZones(data.zones);
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableZones = useMemo(
    () => zones.filter((zone) => zone.branch_id === draft.branchId && zone.status === "active"),
    [draft.branchId, zones],
  );

  function setRowMessage(deviceId: string, message: Message) {
    setRowMessages((current) => ({ ...current, [deviceId]: message }));
  }

  async function requestDeviceLink(
    deviceId: string,
    request: RegenerateDeviceTokenRequest,
  ): Promise<TemporaryDeviceLink> {
    const { data, error } = await supabase.functions.invoke<RegenerateTokenResponse>(
      EDGE_FUNCTIONS.REGENERATE_DEVICE_TOKEN,
      { body: request },
    );

    if (
      error ||
      data?.ok !== true ||
      !data.token_last4 ||
      !isExpectedDeviceUrl(data.url)
    ) {
      throw error ?? new Error("invalid_regeneration_response");
    }

    const temporaryLink = { url: data.url, tokenLast4: data.token_last4 };
    setTemporaryLinks((current) => ({ ...current, [deviceId]: temporaryLink }));
    return temporaryLink;
  }

  async function handleCreateDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const errors = validateDeviceDraft(draft, branches, zones);
    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setPageMessage(null);

    try {
      const device = await createDevice(supabase, draft, branches, zones);
      let regenerationFailed = false;

      try {
        await requestDeviceLink(device.id, { device_id: device.id });
      } catch {
        regenerationFailed = true;
      }

      setDraft(EMPTY_DRAFT);
      setDraftErrors({});
      setShowCreateForm(false);
      await loadData(false);
      setPageMessage(
        regenerationFailed
          ? {
              tone: "error",
              text: "El dispositivo se creo, pero no se pudo generar el enlace. Usa Regenerar enlace.",
            }
          : {
              tone: "success",
              text: "Dispositivo creado. Copia el enlace temporal antes de salir.",
            },
      );
    } catch {
      setPageMessage({
        tone: "error",
        text: "No se pudo crear el dispositivo. Revisa los datos e intenta de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function regenerateLink(row: DeviceSettingsRow) {
    const deviceId = row.device.id;
    if (!deviceId || busyDeviceId) return;
    setPendingAction(null);

    setBusyDeviceId(deviceId);
    setRowMessages((current) => {
      const next = { ...current };
      delete next[deviceId];
      return next;
    });

    try {
      const request: RegenerateDeviceTokenRequest = row.link?.id
        ? { survey_link_id: row.link.id }
        : { device_id: deviceId };
      const temporaryLink = await requestDeviceLink(deviceId, request);
      const now = new Date().toISOString();

      setRows((current) =>
        current.map((item) =>
          item.device.id === deviceId
            ? {
                ...item,
                link: {
                  id: item.link?.id ?? "temporary",
                  device_id: deviceId,
                  status: "active",
                  token_last4: temporaryLink.tokenLast4,
                  regenerated_at: now,
                  last_used_at: item.link?.last_used_at ?? null,
                  created_at: item.link?.created_at ?? now,
                  updated_at: now,
                },
              }
            : item,
        ),
      );
      setRowMessage(deviceId, {
        tone: "success",
        text: "Enlace regenerado. Copialo antes de salir.",
      });
    } catch {
      setRowMessage(deviceId, {
        tone: "error",
        text: "No se pudo regenerar el enlace. Intenta nuevamente.",
      });
    } finally {
      setBusyDeviceId(null);
    }
  }

  async function toggleDevice(row: DeviceSettingsRow) {
    const deviceId = row.device.id;
    if (!deviceId || busyDeviceId) return;

    const nextStatus = row.device.status === "active" ? "inactive" : "active";
    setPendingAction(null);

    setBusyDeviceId(deviceId);
    try {
      await updateDeviceStatus(supabase, deviceId, nextStatus);
      setRows((current) =>
        current.map((item) =>
          item.device.id === deviceId
            ? {
                ...item,
                device: {
                  ...item.device,
                  status: nextStatus,
                  updated_at: new Date().toISOString(),
                },
              }
            : item,
        ),
      );
      setRowMessage(deviceId, {
        tone: "success",
        text: `Dispositivo ${nextStatus === "active" ? "activado" : "desactivado"}.`,
      });
    } catch {
      setRowMessage(deviceId, {
        tone: "error",
        text: "No se pudo cambiar el estado del dispositivo.",
      });
    } finally {
      setBusyDeviceId(null);
    }
  }

  async function copyLink(deviceId: string) {
    const url = temporaryLinks[deviceId]?.url;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setRowMessage(deviceId, { tone: "success", text: "Enlace copiado al portapapeles." });
    } catch {
      setRowMessage(deviceId, { tone: "error", text: "No se pudo copiar automaticamente." });
    }
  }

  if (loadStatus === "loading") {
    return (
      <LoadingState
        title="Cargando dispositivos"
        description="Consultando dispositivos, sucursales, zonas y enlaces visibles."
      />
    );
  }

  if (loadStatus === "error") {
    return (
      <EmptyState
        title="No se pudieron cargar los dispositivos"
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
        eyebrow="Captura"
        title="Dispositivos"
        description="Administra los dispositivos usados para capturar encuestas internas."
        actions={
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="bg-[var(--sq-aubergine)] text-white hover:bg-[#3c1949]"
          >
            {showCreateForm ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {showCreateForm ? "Cancelar" : "Nuevo dispositivo"}
          </Button>
        }
      />

      <div className="rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-soft)] px-4 py-4 text-sm text-[var(--sq-ink)]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--sq-olive)]" aria-hidden="true" />
          <p>
            El enlace completo solo se muestra al crear o regenerar. Los enlaces existentes no
            pueden reconstruirse desde sus ultimos cuatro caracteres.
          </p>
        </div>
      </div>

      {showCreateForm ? (
        <SectionCard title="Nuevo dispositivo">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreateDevice} noValidate>
            <Field label="Nombre" error={draftErrors.name}>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                aria-invalid={Boolean(draftErrors.name)}
                disabled={isSaving}
              />
            </Field>

            <Field label="Sucursal" error={draftErrors.branchId}>
              <select
                value={draft.branchId}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, branchId: event.target.value, zoneId: "" }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                aria-invalid={Boolean(draftErrors.branchId)}
                disabled={isSaving}
              >
                <option value="">Selecciona una sucursal</option>
                {branches.filter((branch) => branch.status === "active").map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Zona opcional" error={draftErrors.zoneId}>
              <select
                value={draft.zoneId}
                onChange={(event) => setDraft((current) => ({ ...current, zoneId: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                disabled={isSaving || !draft.branchId}
                aria-invalid={Boolean(draftErrors.zoneId)}
              >
                <option value="">Sin zona</option>
                {availableZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Descripcion opcional">
              <input
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                disabled={isSaving}
              />
            </Field>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSaving || branches.length === 0}>
                {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {isSaving ? "Creando..." : "Crear dispositivo"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {pageMessage ? <MessageText message={pageMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No hay dispositivos configurados"
          description="Crea el primer dispositivo para generar su enlace de encuesta."
          icon={<MonitorSmartphone className="size-6" aria-hidden="true" />}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const deviceId = row.device.id;
            const temporaryLink = temporaryLinks[deviceId];
            const message = rowMessages[deviceId];
            const isBusy = busyDeviceId === deviceId;
            const lastRegeneration =
              row.link?.regenerated_at ?? row.link?.updated_at ?? row.link?.created_at ?? null;

            return (
              <SectionCard
                key={deviceId}
                title={row.device.name}
                actions={
                  <StatusBadge
                    status={row.device.status === "active" ? "active" : "inactive"}
                    label={row.device.status === "active" ? "Activo" : "Inactivo"}
                  />
                }
              >
                <div className="space-y-5">
                  {row.device.description ? (
                    <p className="text-sm text-slate-600">{row.device.description}</p>
                  ) : null}

                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DataPoint label="Sucursal" value={row.branch?.name ?? "Sin sucursal visible"} />
                    <DataPoint label="Zona" value={row.zone?.name ?? "Sin zona"} />
                    <DataPoint
                      label="Identificador"
                      value={row.link?.token_last4 ? `•••• ${row.link.token_last4}` : "Sin identificador"}
                      mono
                    />
                    <DataPoint label="Ultima regeneracion" value={formatDateTime(lastRegeneration)} />
                    <DataPoint
                      label="Ultimo uso"
                      value={formatDateTime(row.device.last_used_at ?? row.link?.last_used_at ?? null)}
                    />
                    <DataPoint
                      label="Estado del enlace"
                      value={
                        row.link
                          ? row.link.status === "active" ? "Activo" : "Inactivo"
                          : "Sin enlace"
                      }
                    />
                  </dl>

                  {temporaryLink ? (
                    <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 sm:grid-cols-[112px_1fr] sm:items-center">
                      <div className="grid aspect-square place-items-center rounded-lg border border-emerald-200 bg-white p-2">
                        <QRCodeSVG
                          value={temporaryLink.url}
                          size={104}
                          level="M"
                          marginSize={2}
                          title={`Enlace de ${row.device.name}`}
                          className="size-full max-h-24 max-w-24"
                        />
                      </div>
                      <div className="min-w-0 space-y-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Enlace disponible temporalmente
                        </p>
                        <p className="break-all text-xs text-emerald-800">{temporaryLink.url}</p>
                        <Button type="button" variant="outline" onClick={() => void copyLink(deviceId)}>
                          <Clipboard aria-hidden="true" />
                          Copiar enlace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      Regenera para obtener un nuevo enlace completo.
                    </div>
                  )}

                  {message ? <MessageText message={message} /> : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      onClick={() => setPendingAction({ type: "regenerate", row })}
                      disabled={Boolean(busyDeviceId)}
                    >
                      {isBusy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                      Regenerar enlace
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPendingAction({ type: "toggle", row })}
                      disabled={Boolean(busyDeviceId)}
                    >
                      <Power aria-hidden="true" />
                      {row.device.status === "active" ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
        title={pendingAction?.type === "regenerate" ? "Regenerar enlace" : pendingAction?.row.device.status === "active" ? "Desactivar dispositivo" : "Activar dispositivo"}
        description={pendingAction?.type === "regenerate" ? "El enlace anterior dejará de funcionar y el nuevo enlace completo se mostrará una sola vez." : pendingAction?.row.device.status === "active" ? "El dispositivo dejará de aceptar respuestas hasta que se reactive." : "El dispositivo volverá a estar disponible para captura."}
        confirmLabel={pendingAction?.type === "regenerate" ? "Regenerar" : pendingAction?.row.device.status === "active" ? "Desactivar" : "Activar"}
        pending={Boolean(busyDeviceId)}
        onConfirm={() => pendingAction?.type === "regenerate" ? regenerateLink(pendingAction.row) : pendingAction ? toggleDevice(pendingAction.row) : undefined}
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  );
}

function DataPoint({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono text-sm font-semibold text-slate-950" : "text-sm text-slate-700"}>
        {value}
      </dd>
    </div>
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
