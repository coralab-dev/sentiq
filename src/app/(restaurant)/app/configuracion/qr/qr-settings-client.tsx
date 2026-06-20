"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { EDGE_FUNCTIONS } from "@/config/edge-functions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RegenerateTokenResponse } from "@/types/edge-functions";

import {
  loadQrSettingsData,
  type QrSettingsRow,
  type TemporaryGeneratedLink,
} from "./qr-settings-data";

type LoadStatus = "loading" | "success" | "error";

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "Sin registro";
}

function getQrStatus(link: QrSettingsRow["link"]) {
  if (!link) {
    return <StatusBadge status="unassigned" label="Sin QR" />;
  }

  if (link.status === "active") {
    return <StatusBadge status="active" label="QR activo" />;
  }

  return (
    <StatusBadge
      status={link.status === "revoked" ? "revoked" : "inactive"}
      label={link.status === "revoked" ? "QR revocado" : "QR inactivo"}
    />
  );
}

function getBranchStatus(status: string) {
  return status === "active" ? (
    <StatusBadge status="active" label="Activa" />
  ) : (
    <StatusBadge status="inactive" label="Inactiva" />
  );
}

function isExpectedQrUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return /^\/s\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function QrSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<QrSettingsRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [regeneratingBranchId, setRegeneratingBranchId] = useState<string | null>(null);
  const [temporaryLinks, setTemporaryLinks] = useState<
    Record<string, TemporaryGeneratedLink>
  >({});
  const [rowMessages, setRowMessages] = useState<
    Record<string, { tone: "success" | "error"; text: string }>
  >({});

  const loadData = useCallback(async () => {
    setLoadStatus("loading");

    try {
      setRows(await loadQrSettingsData(supabase));
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function setRowMessage(
    branchId: string,
    tone: "success" | "error",
    text: string,
  ) {
    setRowMessages((current) => ({
      ...current,
      [branchId]: { tone, text },
    }));
  }

  async function regenerateQr(branchId: string) {
    if (!branchId || regeneratingBranchId) {
      return;
    }

    const confirmed = window.confirm(
      "El enlace anterior dejara de funcionar. ¿Quieres regenerar el enlace QR?",
    );

    if (!confirmed) {
      return;
    }

    setRegeneratingBranchId(branchId);
    setRowMessages((current) => {
      const next = { ...current };
      delete next[branchId];
      return next;
    });

    try {
      const { data, error } =
        await supabase.functions.invoke<RegenerateTokenResponse>(
          EDGE_FUNCTIONS.REGENERATE_QR_TOKEN,
          { body: { branch_id: branchId } },
        );

      if (
        error ||
        data?.ok !== true ||
        !data.token_last4 ||
        !isExpectedQrUrl(data.url)
      ) {
        throw error ?? new Error("Respuesta de regeneracion invalida");
      }

      const regeneratedAt = new Date().toISOString();

      setTemporaryLinks((current) => ({
        ...current,
        [branchId]: { url: data.url, tokenLast4: data.token_last4 },
      }));
      setRows((current) =>
        current.map((row) =>
          row.branch.id === branchId
            ? {
                ...row,
                link: {
                  id: row.link?.id ?? "temporary",
                  branch_id: branchId,
                  status: "active",
                  token_last4: data.token_last4,
                  regenerated_at: regeneratedAt,
                  last_used_at: row.link?.last_used_at ?? null,
                  created_at: row.link?.created_at ?? regeneratedAt,
                  updated_at: regeneratedAt,
                },
              }
            : row,
        ),
      );
      setRowMessage(branchId, "success", "Enlace QR regenerado. Copialo antes de salir.");
    } catch {
      setRowMessage(
        branchId,
        "error",
        "No se pudo regenerar el enlace. Verifica tus permisos e intenta de nuevo.",
      );
    } finally {
      setRegeneratingBranchId(null);
    }
  }

  async function copyLink(branchId: string) {
    const url = temporaryLinks[branchId]?.url;

    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setRowMessage(branchId, "success", "Enlace copiado al portapapeles.");
    } catch {
      setRowMessage(branchId, "error", "No se pudo copiar automaticamente.");
    }
  }

  if (loadStatus === "loading") {
    return (
      <LoadingState
        title="Cargando codigos QR"
        description="Consultando sucursales y enlaces visibles para tu sesion."
      />
    );
  }

  if (loadStatus === "error") {
    return (
      <EmptyState
        title="No se pudo cargar la configuracion QR"
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
        eyebrow="Configuracion"
        title="Codigos QR por sucursal"
        description="Consulta el estado de cada enlace y regenera un QR cuando necesites reemplazarlo."
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            Por seguridad, el enlace completo solo se muestra al regenerarlo. No es posible
            reconstruir enlaces existentes desde los ultimos cuatro caracteres.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No hay sucursales visibles"
          description="Las sucursales disponibles segun RLS apareceran aqui."
          icon={<Store className="size-6" aria-hidden="true" />}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {rows.map((row) => {
            const branchId = row.branch.id;
            const temporaryLink = temporaryLinks[branchId];
            const message = rowMessages[branchId];
            const isRegenerating = regeneratingBranchId === branchId;
            const lastRegeneration =
              row.link?.regenerated_at ?? row.link?.updated_at ?? row.link?.created_at ?? null;

            return (
              <SectionCard
                key={branchId}
                title={row.branch.name}
                actions={getBranchStatus(row.branch.status)}
              >
                <div className="space-y-5">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase text-slate-500">Estado QR</dt>
                      <dd>{getQrStatus(row.link)}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase text-slate-500">Identificador</dt>
                      <dd className="font-mono text-sm font-semibold text-slate-950">
                        {row.link?.token_last4 ? `•••• ${row.link.token_last4}` : "Sin identificador"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase text-slate-500">
                        Ultima regeneracion
                      </dt>
                      <dd className="text-sm text-slate-700">{formatDateTime(lastRegeneration)}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase text-slate-500">Ultimo uso</dt>
                      <dd className="text-sm text-slate-700">
                        {formatDateTime(row.link?.last_used_at ?? null)}
                      </dd>
                    </div>
                  </dl>

                  {temporaryLink ? (
                    <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 sm:grid-cols-[120px_1fr] sm:items-center">
                      <div className="grid aspect-square place-items-center rounded-lg border border-emerald-200 bg-white">
                        <QrCode className="size-20 text-slate-950" aria-label="Vista QR disponible" />
                      </div>
                      <div className="min-w-0 space-y-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Enlace completo disponible temporalmente
                          </p>
                          <p className="mt-1 break-all text-xs text-emerald-800">{temporaryLink.url}</p>
                        </div>
                        <Button type="button" variant="outline" onClick={() => void copyLink(branchId)}>
                          <Clipboard aria-hidden="true" />
                          Copiar enlace completo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      Regenera para obtener un nuevo enlace completo y habilitar su vista QR.
                    </div>
                  )}

                  {message ? (
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
                  ) : null}

                  <Button
                    type="button"
                    onClick={() => void regenerateQr(branchId)}
                    disabled={!branchId || Boolean(regeneratingBranchId)}
                    className="w-full bg-teal-700 text-white hover:bg-teal-800"
                  >
                    {isRegenerating ? (
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                      <RefreshCw aria-hidden="true" />
                    )}
                    {isRegenerating ? "Regenerando..." : "Regenerar enlace QR"}
                  </Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
